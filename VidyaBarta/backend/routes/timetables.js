const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');


// @desc    Get all timetables for the school (used for clash detection)
// @route   GET /api/timetables/all
// @access  Private
router.get('/all', protect, async (req, res) => {
  try {
    // Note: If you have a school_id, you'd filter by it here
    const { data, error } = await supabase
      .from('class_timetable')
      .select('*');
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get timetable for a specific class & section
// @route   GET /api/timetables/:class_level/:section
// @access  Private
router.get('/:class_level/:section', protect, async (req, res) => {
  try {
    const { data: timetable, error } = await supabase
      .from('class_timetable')
      .select('*')
      .eq('class_level', req.params.class_level)
      .eq('section', req.params.section)
      .order('day_of_week', { ascending: true })
      .order('period_number', { ascending: true });
      
    if (error) throw error;
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Save/Update timetable entries
// @route   POST /api/timetables
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { class_level, section, entries } = req.body; 
    // entries: array of { day_of_week, period_number, subject, staff_id, start_time, end_time }
    
    // 1. Validate max 6 classes per day for each teacher across all classes in the school
    if (entries && entries.length > 0) {
      const { data: allTimetables, error: fetchErr } = await supabase
        .from('class_timetable')
        .select('day_of_week, period_number, staff_id, subject, class_level, section');

      if (fetchErr) throw fetchErr;

      // Filter out entries belonging to the class and section being updated
      const otherEntries = (allTimetables || []).filter(t => 
        !(t.class_level === class_level && t.section === section)
      );

      // Count classes per teacher per day in other classes (excluding 'Recess' or non-teaching breaks)
      const dailyCounts = {}; // key: `${staff_id}_${day_of_week}` => count
      otherEntries.forEach(t => {
        if (t.staff_id && t.subject && !t.subject.toLowerCase().includes('recess') && !t.subject.toLowerCase().includes('break')) {
          const key = `${t.staff_id}_${t.day_of_week}`;
          dailyCounts[key] = (dailyCounts[key] || 0) + 1;
        }
      });

      // Add the counts from incoming entries being saved
      entries.forEach(e => {
        if (e.staff_id && e.subject && !e.subject.toLowerCase().includes('recess') && !e.subject.toLowerCase().includes('break')) {
          const key = `${e.staff_id}_${e.day_of_week}`;
          dailyCounts[key] = (dailyCounts[key] || 0) + 1;
        }
      });

      // Check for duplicate teacher assignment in the same slot
      const slotTeacherSet = new Set();
      for (const e of entries) {
        if (e.staff_id && e.day_of_week && e.period_number) {
          const slotKey = `${e.day_of_week}_${e.period_number}_${e.staff_id}`;
          if (slotTeacherSet.has(slotKey)) {
            return res.status(400).json({
              message: `Validation Error: The same teacher cannot be assigned twice for Period ${e.period_number} on ${e.day_of_week}.`
            });
          }
          slotTeacherSet.add(slotKey);
        }
      }

      // Check double-booking clash with other classes for that day & period
      for (const e of entries) {
        if (e.staff_id && e.day_of_week && e.period_number) {
          const clash = otherEntries.find(t => 
            t.day_of_week === e.day_of_week &&
            t.period_number === e.period_number &&
            t.staff_id === e.staff_id
          );
          if (clash) {
            const { data: teacher } = await supabase
              .from('staff')
              .select('name')
              .eq('id', e.staff_id)
              .single();
            const teacherName = teacher?.name || 'Staff member';
            return res.status(400).json({
              message: `Schedule Conflict: Teacher "${teacherName}" is already scheduled in Class ${clash.class_level}-${clash.section} at Period ${e.period_number} on ${e.day_of_week}.`
            });
          }
        }
      }

      // Check if any teacher exceeds 6 classes on any single day
      for (const [key, count] of Object.entries(dailyCounts)) {
        if (count > 6) {
          const [staff_id, day_of_week] = key.split('_');
          const { data: teacher } = await supabase
            .from('staff')
            .select('name')
            .eq('id', staff_id)
            .single();

          const teacherName = teacher?.name || 'Staff member';
          return res.status(400).json({
            message: `Validation Error: Teacher "${teacherName}" has ${count} classes assigned on ${day_of_week}. A teacher cannot have more than 6 classes in a single day.`
          });
        }
      }
    }

    // 2. Delete existing entries for this class/section to avoid duplicates during a full save
    await supabase
      .from('class_timetable')
      .delete()
      .eq('class_level', class_level)
      .eq('section', section);
      
    if (entries && entries.length > 0) {
      const insertData = entries.map(e => ({
        class_level,
        section,
        ...e
      }));
      
      const { data, error } = await supabase
        .from('class_timetable')
        .insert(insertData)
        .select();
        
      if (error) throw error;
      res.status(201).json(data);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

const { generateSchoolTimetable } = require('../services/timetableGenerator');

// @desc    Automatic Timetable Generation (Preview or Direct Save)
// @route   POST /api/timetables/auto-generate
// @access  Private (Admin)
router.post('/auto-generate', protect, async (req, res) => {
  try {
    const { 
      school_id, 
      targetClassLevels, 
      weekdayPeriods = 7, 
      saturdayPeriods = 5,
      tiffinBreakAfterPeriod = 4,
      save = false 
    } = req.body;

    const resolvedSchoolId = school_id || req.user?.school_id || null;

    const generationResult = await generateSchoolTimetable({
      supabase,
      school_id: resolvedSchoolId,
      targetClassLevels,
      weekdayPeriods: parseInt(weekdayPeriods) || 7,
      saturdayPeriods: parseInt(saturdayPeriods) || 5,
      tiffinBreakAfterPeriod: parseInt(tiffinBreakAfterPeriod) || 4
    });

    if (save && generationResult.timetables && generationResult.timetables.length > 0) {
      const classesToUpdate = Array.from(new Set(generationResult.timetables.map(e => e.class_level)));
      
      for (const cls of classesToUpdate) {
        await supabase
          .from('class_timetable')
          .delete()
          .eq('class_level', cls);
      }

      const chunkSize = 500;
      for (let i = 0; i < generationResult.timetables.length; i += chunkSize) {
        const chunk = generationResult.timetables.slice(i, i + chunkSize);
        const { error: insertErr } = await supabase
          .from('class_timetable')
          .insert(chunk);
        if (insertErr) throw insertErr;
      }

      generationResult.saved = true;
    }

    res.json(generationResult);
  } catch (err) {
    console.error('Error during auto-generation:', err);
    res.status(500).json({ message: err.message || 'Auto-generation failed', error: err });
  }
});

// @desc    Apply and Save Auto-Generated Timetable to database
// @route   POST /api/timetables/auto-generate/apply
// @access  Private (Admin)
router.post('/auto-generate/apply', protect, async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || entries.length === 0) {
      return res.status(400).json({ message: 'No timetable entries provided to apply.' });
    }

    const classesToUpdate = Array.from(new Set(entries.map(e => e.class_level)));
    for (const cls of classesToUpdate) {
      await supabase
        .from('class_timetable')
        .delete()
        .eq('class_level', cls);
    }

    const chunkSize = 500;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      const { error: insertErr } = await supabase
        .from('class_timetable')
        .insert(chunk);
      if (insertErr) throw insertErr;
    }

    res.json({ message: 'Timetable applied and saved successfully!', count: entries.length });
  } catch (err) {
    console.error('Error applying auto-generated timetable:', err);
    res.status(500).json({ message: err.message || 'Failed to apply timetable' });
  }
});

module.exports = router;
