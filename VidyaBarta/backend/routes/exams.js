const express = require('express');
const router = express.Router();
const { protect, protectAnyStaff, protectAnyUser } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Get all exams (scoped by school_id)
router.get('/', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    let query = supabase.from('exams').select('*, exam_timetable(is_finalized)');
    
    if (school_id) {
      query = query.eq('school_id', school_id);
    }
    
    query = query.order('id', { ascending: false });
    
    const { data: exams, error } = await query;
      
    if (error) throw error;
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get all available default exam templates (with their routine subjects) for schools to use
router.get('/default-templates', protectAnyStaff, async (req, res) => {
  try {
    const { data: templates, error } = await supabase
      .from('default_exams')
      .select('*, default_exam_timetables(*)')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(templates || []);
  } catch (err) {
    console.error('[GET DEFAULT TEMPLATES ERROR]:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

const crypto = require('crypto');
const { normalizeClassLevel, getHolyNameDefaultSubjects } = require('../utils/defaultClassSubjects');

// Helper to generate working dates (Monday to Saturday, skipping Sundays)
const getWorkingDates = (startDateStr, endDateStr) => {
  const dates = [];
  if (!startDateStr) return dates;
  let curr = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date(startDateStr);
  
  if (isNaN(curr.getTime())) return dates;

  while (curr <= end) {
    if (curr.getDay() !== 0) { // 0 is Sunday - skip
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Helper to generate N working dates (skipping Sundays) starting from startDateStr
const getWorkingDatesCount = (startDateStr, maxWorkingDays = 20) => {
  const dates = [];
  if (!startDateStr) return dates;
  let curr = new Date(startDateStr);
  if (isNaN(curr.getTime())) return dates;

  while (dates.length < maxWorkingDays) {
    if (curr.getDay() !== 0) { // Skip Sunday
      dates.push(curr.toISOString().split('T')[0]);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Helper to retrieve school's eligible subjects for a class based on category
const getClassEligibleSubjects = async (school_id, class_level, category) => {
  const normClass = normalizeClassLevel(class_level);
  
  // 1. Query school_subjects for this class and school
  const { data: schoolSubs, error: subErr } = await supabase
    .from('school_subjects')
    .select('id, class_level, subject_id, is_core, elective_group_id, is_divided, parts, subjects(id, name, code, marking_system)')
    .eq('school_id', school_id);

  if (subErr) throw subErr;

  // 2. Query elective groups for this school
  const { data: groups, error: grpErr } = await supabase
    .from('school_elective_groups')
    .select('*')
    .eq('school_id', school_id);

  if (grpErr) throw grpErr;

  const groupMap = {};
  (groups || []).forEach(g => {
    groupMap[g.id] = g.group_name;
  });

  // Filter subjects for the specific class level
  const classRows = (schoolSubs || []).filter(s => normalizeClassLevel(s.class_level) === normClass);

  let eligibleList = [];

  if (classRows.length > 0) {
    classRows.forEach(s => {
      const subName = s.subjects?.name;
      if (!subName) return;
      const grpName = s.elective_group_id ? groupMap[s.elective_group_id] : null;
      const markingSystem = s.subjects?.marking_system || 'Marking';
      const isGrading = markingSystem === 'Grade' || grpName === 'Grading Sets';

      // Check category eligibility
      if (category === 'periodic_assessment') {
        // Periodic Assessment: ONLY Core, Elective, and MIL
        const isElective = grpName === 'Elective';
        const isMIL = grpName === 'MIL';
        if (s.is_core || isElective || isMIL) {
          eligibleList.push({
            subject_id: s.subject_id,
            name: subName,
            code: s.subjects?.code,
            is_core: !!s.is_core,
            group_name: grpName,
            marking_system: markingSystem,
            is_grading: isGrading,
            is_divided: !!s.is_divided,
            parts: s.parts || [],
            total_marks: 50,
            passing_marks: 20
          });
        }
      } else {
        // Terminal Examination: ALL subjects
        eligibleList.push({
          subject_id: s.subject_id,
          name: subName,
          code: s.subjects?.code,
          is_core: !!s.is_core,
          group_name: grpName,
          marking_system: markingSystem,
          is_grading: isGrading,
          is_divided: !!s.is_divided,
          parts: s.parts || [],
          total_marks: 100,
          passing_marks: 40
        });
      }
    });
  } else {
    // Fallback: Check Holy Name default template
    const defTemplate = await getHolyNameDefaultSubjects(supabase);
    const defClass = defTemplate[normClass];
    if (defClass) {
      const allDef = [
        ...(defClass.core_subjects || []).map(s => ({ ...s, is_core: true, group_name: null })),
        ...((defClass.elective_groups || []).flatMap(g => (g.subjects || []).map(s => ({ ...s, is_core: false, group_name: g.group_name }))))
      ];

      allDef.forEach(s => {
        const subName = s.name || s.subjects?.name;
        if (!subName) return;
        const grpName = s.group_name;
        const markingSystem = s.marking_system || s.subjects?.marking_system || 'Marking';
        const isGrading = markingSystem === 'Grade' || grpName === 'Grading Sets';

        if (category === 'periodic_assessment') {
          const isElective = grpName === 'Elective';
          const isMIL = grpName === 'MIL';
          if (s.is_core || isElective || isMIL) {
            eligibleList.push({
              subject_id: s.subject_id,
              name: subName,
              code: s.code || s.subjects?.code,
              is_core: !!s.is_core,
              group_name: grpName,
              marking_system: markingSystem,
              is_grading: isGrading,
              is_divided: !!s.is_divided,
              parts: s.parts || [],
              total_marks: 50,
              passing_marks: 20
            });
          }
        } else {
          eligibleList.push({
            subject_id: s.subject_id,
            name: subName,
            code: s.code || s.subjects?.code,
            is_core: !!s.is_core,
            group_name: grpName,
            marking_system: markingSystem,
            is_grading: isGrading,
            is_divided: !!s.is_divided,
            parts: s.parts || [],
            total_marks: 100,
            passing_marks: 40
          });
        }
      });
    }
  }

  // Deduplicate by name if any duplicates exist
  const seen = new Set();
  let uniqueList = eligibleList.filter(item => {
    const key = item.name.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // MIL Consolidation for High School (Class IX to XII)
  // In Class IX-XII, each student has only 1 MIL subject (Assamese, Hindi, Bengali, Alt English, etc.)
  // So all MIL subjects must be conducted on ONE day and stated as "MIL" in the routine.
  const highSchoolClasses = ['IX', 'X', 'XI', 'XII', 'XI-SCIENCE', 'XI-COM', 'XI-ARTS', 'XII-SCIENCE', 'XII-COM', 'XII-ARTS'];
  const isHighSchool = highSchoolClasses.includes(normClass.toUpperCase());

  if (isHighSchool) {
    const isMilItem = (item) => {
      const grp = (item.group_name || '').toUpperCase();
      const nm = (item.name || '').toUpperCase();
      return grp === 'MIL' || nm === 'MIL' || nm.startsWith('MIL ') || nm.startsWith('MIL-') || nm.startsWith('MIL(') || nm.startsWith('MIL (');
    };

    const milItems = uniqueList.filter(isMilItem);
    if (milItems.length > 0) {
      const nonMilItems = uniqueList.filter(item => !isMilItem(item));
      const firstMil = milItems[0];
      const consolidatedMil = {
        subject_id: firstMil.subject_id || 'mil-unified',
        name: 'MIL',
        code: 'MIL',
        is_core: false,
        group_name: 'MIL',
        marking_system: 'Marking',
        is_grading: false,
        is_divided: false,
        parts: [],
        total_marks: category === 'periodic_assessment' ? 50 : 100,
        passing_marks: category === 'periodic_assessment' ? 20 : 40
      };
      return [...nonMilItems, consolidatedMil];
    }
  }

  return uniqueList;
};

// Create a new exam (admin only, attaches school_id, atomic with rollback)
router.post('/', protect, async (req, res) => {
  let createdExams = [];
  let logical_exam_id = null;
  try {
    const { 
      name, 
      type, 
      class_levels, 
      class_level, 
      target_class, 
      start_date, 
      default_exam_id,
      category: clientCategory,
      single_start_time,
      single_end_time
    } = req.body;
    const { school_id } = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Exam name is required' });
    }

    if (!start_date) {
      return res.status(400).json({ message: 'Start date is required' });
    }

    if (!default_exam_id) {
      return res.status(400).json({ message: 'A default exam template (default_exam_id) is required' });
    }

    // 1. Authoritative Template Verification
    const { data: template, error: tmplError } = await supabase
      .from('default_exams')
      .select('*')
      .eq('id', default_exam_id)
      .eq('is_active', true)
      .single();

    if (tmplError || !template) {
      return res.status(404).json({ message: 'Selected default exam template not found or inactive' });
    }

    const templateCategory = template.category || 'periodic_assessment';
    if (clientCategory && clientCategory !== templateCategory) {
      return res.status(400).json({ message: `Category mismatch: template requires '${templateCategory}'` });
    }

    // 2. Class Expansion: Ensure class_level is strictly the actual class, never "all"
    let targetClasses = [];
    const requested = class_levels || (class_level ? [class_level] : []);
    if (requested.length === 0 && target_class) {
      if (target_class === 'all') requested.push('all');
      else requested.push(target_class);
    }
    
    if (requested.includes('all') || target_class === 'all') {
      const { data: configs } = await supabase
        .from('school_class_configs')
        .select('class_level')
        .eq('school_id', school_id);

      if (configs && configs.length > 0) {
        targetClasses = configs.map(c => normalizeClassLevel(c.class_level)).filter(Boolean);
      } else {
        const { data: mappedClasses } = await supabase
          .from('school_subjects')
          .select('class_level')
          .eq('school_id', school_id);
        const unique = [...new Set((mappedClasses || []).map(m => normalizeClassLevel(m.class_level)))];
        targetClasses = unique.length > 0 ? unique : ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      }
    } else {
      targetClasses = requested.map(c => normalizeClassLevel(c)).filter(Boolean);
    }

    targetClasses = [...new Set(targetClasses)];
    if (targetClasses.length === 0) {
      return res.status(400).json({ message: 'At least one valid class level is required' });
    }

    // 3. Generate 20 Working Dates (skipping Sundays)
    const workingDates = getWorkingDatesCount(start_date, 20);
    if (!workingDates || workingDates.length === 0) {
      return res.status(400).json({ 
        code: 'INVALID_START_DATE',
        message: 'Could not generate working days from the provided start date. Please provide a valid date.' 
      });
    }

    // 4. Phase 1: Pre-Validation Across ALL Targeted Classes
    const classSubjectsMap = {};
    let maxGradingCountAcrossClasses = 0;

    for (const c of targetClasses) {
      const eligibleSubs = await getClassEligibleSubjects(school_id, c, templateCategory);
      const N_c = eligibleSubs.length;

      if (N_c === 0 && targetClasses.length === 1) {
        return res.status(400).json({ 
          code: 'NO_SUBJECTS', 
          message: `No eligible subjects found for Class ${c}. Please configure subjects for this class first.` 
        });
      }

      classSubjectsMap[c] = eligibleSubs;
      const gCount = eligibleSubs.filter(s => s.is_grading).length;
      if (gCount > maxGradingCountAcrossClasses) {
        maxGradingCountAcrossClasses = gCount;
      }
    }

    // Grading subjects rule: All grading subjects conducted within at most 2 dates
    const gradingDaysCount = maxGradingCountAcrossClasses === 0 ? 0 : (maxGradingCountAcrossClasses === 1 ? 1 : 2);

    // Validate that every class's routine fits within 20 working days
    for (const c of targetClasses) {
      const nonGradingCount = (classSubjectsMap[c] || []).filter(s => !s.is_grading).length;
      const totalDaysNeeded = gradingDaysCount + nonGradingCount;

      if (totalDaysNeeded > 20) {
        return res.status(400).json({
          code: 'EXCEEDS_20_WORKING_DAYS',
          message: `Class ${c} requires ${totalDaysNeeded} working days (${gradingDaysCount} grading days + ${nonGradingCount} non-grading subjects), exceeding the 20 working days limit.`,
          class_level: c,
          total_days_needed: totalDaysNeeded,
          max_allowed: 20
        });
      }
    }

    // Calculate actual end date across all classes (within 20 working days)
    let maxDaysUsedAcrossClasses = 0;
    for (const c of targetClasses) {
      const nonGradingCount = (classSubjectsMap[c] || []).filter(s => !s.is_grading).length;
      const days = gradingDaysCount + nonGradingCount;
      if (days > maxDaysUsedAcrossClasses) {
        maxDaysUsedAcrossClasses = days;
      }
    }
    const endDayIdx = Math.max(0, Math.min(maxDaysUsedAcrossClasses - 1, workingDates.length - 1));
    const calculatedEndDate = workingDates[endDayIdx] || workingDates[0];

    // 5. Phase 2: Atomic Execution with Rollback
    logical_exam_id = crypto.randomUUID();

    const singleStart = single_start_time || '08:30';
    const singleEnd = single_end_time || '10:30';

    const examInserts = targetClasses.map(c => ({
      name: name.trim(),
      type: type || template.type || 'Offline',
      class_level: c, // Strictly actual class string!
      start_date: start_date,
      end_date: calculatedEndDate,
      school_id,
      default_exam_id: template.id,
      category: templateCategory,
      logical_exam_id
    }));

    // Insert exams
    const { data: insertedExams, error: examError } = await supabase
      .from('exams')
      .insert(examInserts)
      .select();

    if (examError) throw examError;
    createdExams = insertedExams;

    // Generate timetable rows per class (1-Shift System Only)
    const timetableInserts = [];

    for (const ex of createdExams) {
      const subs = [...(classSubjectsMap[ex.class_level] || [])];
      const gradingSubs = subs.filter(s => s.is_grading);
      const nonGradingSubs = subs.filter(s => !s.is_grading);

      // 1. Schedule Grading subjects within at most 2 dates: Day 1 (workingDates[0]) and Day 2 (workingDates[1])
      if (gradingSubs.length === 1) {
        timetableInserts.push({
          exam_id: ex.id,
          school_id,
          class_level: ex.class_level,
          subject: gradingSubs[0].name,
          sub_subject: null,
          exam_date: workingDates[0],
          start_time: singleStart,
          end_time: singleEnd,
          total_marks: gradingSubs[0].total_marks,
          passing_marks: gradingSubs[0].passing_marks,
          has_practical: false,
          is_finalized: false
        });
      } else if (gradingSubs.length >= 2) {
        const mid = Math.ceil(gradingSubs.length / 2);
        const day1Grading = gradingSubs.slice(0, mid);
        const day2Grading = gradingSubs.slice(mid);

        day1Grading.forEach(item => {
          timetableInserts.push({
            exam_id: ex.id,
            school_id,
            class_level: ex.class_level,
            subject: item.name,
            sub_subject: null,
            exam_date: workingDates[0],
            start_time: singleStart,
            end_time: singleEnd,
            total_marks: item.total_marks,
            passing_marks: item.passing_marks,
            has_practical: false,
            is_finalized: false
          });
        });

        day2Grading.forEach(item => {
          timetableInserts.push({
            exam_id: ex.id,
            school_id,
            class_level: ex.class_level,
            subject: item.name,
            sub_subject: null,
            exam_date: workingDates[1] || workingDates[0],
            start_time: singleStart,
            end_time: singleEnd,
            total_marks: item.total_marks,
            passing_marks: item.passing_marks,
            has_practical: false,
            is_finalized: false
          });
        });
      }

      // 2. Schedule Non-Grading subjects: 1 subject per day starting at workingDates[gradingDaysCount]
      nonGradingSubs.forEach((item, nIdx) => {
        const dateIdx = gradingDaysCount + nIdx;
        const assignedDate = workingDates[dateIdx] || workingDates[workingDates.length - 1];

        timetableInserts.push({
          exam_id: ex.id,
          school_id,
          class_level: ex.class_level,
          subject: item.name,
          sub_subject: null,
          exam_date: assignedDate,
          start_time: singleStart,
          end_time: singleEnd,
          total_marks: item.total_marks,
          passing_marks: item.passing_marks,
          has_practical: false,
          is_finalized: false
        });
      });
    }

    if (timetableInserts.length > 0) {
      const { error: ttError } = await supabase
        .from('exam_timetable')
        .insert(timetableInserts);

      if (ttError) throw ttError;
    }

    res.status(201).json({
      logical_exam_id,
      exams: createdExams
    });
  } catch (err) {
    console.error('[CREATE EXAMS ERROR]:', err);
    // Atomic rollback: clean up any partially created exams or timetables
    if (logical_exam_id) {
      try {
        if (createdExams && createdExams.length > 0) {
          const ids = createdExams.map(e => e.id);
          await supabase.from('exam_timetable').delete().in('exam_id', ids);
        }
        await supabase.from('exams').delete().eq('logical_exam_id', logical_exam_id);
      } catch (rbErr) {
        console.error('[ROLLBACK ERROR]:', rbErr);
      }
    }
    res.status(500).json({ message: err.message || 'Server Error', details: err });
  }
});

// Get master timetable across all classes for a logical exam group
router.get('/logical/:logicalExamId/timetable', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { logicalExamId } = req.params;

    let examQuery = supabase
      .from('exams')
      .select('id, name, type, class_level, start_date, end_date, category, default_exam_id, logical_exam_id')
      .eq('logical_exam_id', logicalExamId);

    if (school_id) {
      examQuery = examQuery.eq('school_id', school_id);
    }

    const { data: exams, error: exErr } = await examQuery;
    if (exErr) throw exErr;

    if (!exams || exams.length === 0) {
      return res.status(404).json({ message: 'Exam group not found' });
    }

    const examIds = exams.map(e => e.id);

    const { data: timetables, error: ttErr } = await supabase
      .from('exam_timetable')
      .select('*')
      .in('exam_id', examIds)
      .order('exam_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (ttErr) throw ttErr;

    res.json({
      exams,
      timetables: timetables || []
    });
  } catch (err) {
    console.error('[GET LOGICAL TIMETABLE ERROR]:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a logical exam group (all classes for this logical_exam_id)
router.delete('/logical/:logicalExamId', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { logicalExamId } = req.params;

    const { data: toDel } = await supabase
      .from('exams')
      .select('id')
      .eq('logical_exam_id', logicalExamId)
      .eq('school_id', school_id);

    if (toDel && toDel.length > 0) {
      const ids = toDel.map(e => e.id);
      await supabase.from('exam_timetable').delete().in('exam_id', ids);
      await supabase.from('exams').delete().eq('logical_exam_id', logicalExamId).eq('school_id', school_id);
    }

    res.json({ message: 'Logical exam group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete an exam group by name (legacy support)
router.delete('/group/:name', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { data: toDel } = await supabase
      .from('exams')
      .select('id')
      .eq('name', req.params.name)
      .eq('school_id', school_id);

    if (toDel && toDel.length > 0) {
      const ids = toDel.map(e => e.id);
      await supabase.from('exam_timetable').delete().in('exam_id', ids);
      await supabase.from('exams').delete().eq('name', req.params.name).eq('school_id', school_id);
    }

    res.json({ message: 'Exam group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a single exam
router.delete('/:id', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', school_id);

    if (error) throw error;
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get marks for an exam
router.get('/:id/marks', protectAnyStaff, async (req, res) => {
  try {
    const { data: marks, error } = await supabase
      .from('marks')
      .select('*')
      .eq('exam_id', req.params.id);
      
    if (error) throw error;
    res.json(marks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Subject Teacher marks entry
router.post('/:id/marks/subject-teacher', protectAnyStaff, async (req, res) => {
  try {
    const { marks } = req.body; // Array of { student_id, subject, marks_obtained, max_marks }
    const staff_id = req.user.id;

    // Fetch exam name for the required exam_name column in marks table
    const { data: exam } = await supabase
      .from('exams')
      .select('name')
      .eq('id', req.params.id)
      .single();
    
    const exam_name = exam ? exam.name : 'Unknown';

    // We process each mark
    for (let mark of marks) {
      // Build the query to find existing mark
      let query = supabase
        .from('marks')
        .select('*')
        .eq('exam_id', req.params.id)
        .eq('student_id', mark.student_id)
        .eq('subject', mark.subject);
        
      if (mark.sub_subject) {
        query = query.eq('sub_subject', mark.sub_subject);
      } else {
        query = query.is('sub_subject', null);
      }
      
      const { data: existingMark } = await query.maybeSingle();
        
      if (existingMark) {
        // Only update if not finalized
        if (existingMark.status !== 'finalized') {
           await supabase.from('marks').update({
             marks_obtained: mark.marks_obtained,
             practical_marks_obtained: mark.practical_marks_obtained || null,
             max_marks: mark.max_marks,
             status: 'submitted_by_subject_teacher'
           }).eq('id', existingMark.id);
        }
      } else {
        const { error: insertErr } = await supabase.from('marks').insert({
          exam_id: req.params.id,
          exam_name,
          student_id: mark.student_id,
          subject: mark.subject,
          sub_subject: mark.sub_subject || null,
          marks_obtained: mark.marks_obtained,
          practical_marks_obtained: mark.practical_marks_obtained || null,
          max_marks: mark.max_marks,
          staff_id,
          status: 'submitted_by_subject_teacher'
        });
        if (insertErr) {
          console.error('Mark insert error:', insertErr);
        }
      }
    }

    // Update exam workflow status to indicate subject entries are in progress
    await supabase.from('exams').update({ workflow_status: 'SubjectEntry' }).eq('id', req.params.id);

    res.json({ message: 'Marks submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Class Teacher review marks
router.post('/:id/marks/class-teacher-review', protectAnyStaff, async (req, res) => {
  try {
    // modifications is array of { mark_id, marks_obtained, reason }
    const { modifications } = req.body; 
    const staff_id = req.user.id;

    for (let mod of modifications) {
      const { data: existingMark } = await supabase
        .from('marks')
        .select('*')
        .eq('id', mod.mark_id)
        .single();
        
      if (existingMark) {
        if (String(existingMark.marks_obtained) !== String(mod.marks_obtained)) {
          if (!mod.reason) {
            return res.status(400).json({ message: 'Reason is required for modification' });
          }
          
          const auditEntry = {
            previous_mark: existingMark.marks_obtained,
            new_mark: mod.marks_obtained,
            modified_by: staff_id,
            reason: mod.reason,
            timestamp: new Date().toISOString()
          };
          
          let auditLog = Array.isArray(existingMark.audit_log) ? existingMark.audit_log : [];
          auditLog.push(auditEntry);
          
          await supabase.from('marks').update({
            marks_obtained: mod.marks_obtained,
            class_teacher_id: staff_id,
            status: 'reviewed_by_class_teacher',
            audit_log: auditLog
          }).eq('id', mod.mark_id);
        } else {
          await supabase.from('marks').update({
            class_teacher_id: staff_id,
            status: 'reviewed_by_class_teacher'
          }).eq('id', mod.mark_id);
        }
      }
    }
    
    // Update exam status
    await supabase.from('exams').update({ workflow_status: 'ClassReview' }).eq('id', req.params.id);

    res.json({ message: 'Marks reviewed and updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Publish Results
router.post('/:id/publish', protect, async (req, res) => {
  try {
    const published_date = new Date();
    const grievance_deadline = new Date();
    grievance_deadline.setDate(grievance_deadline.getDate() + 7);

    const { data, error } = await supabase
      .from('exams')
      .update({
        workflow_status: 'Published',
        published_date,
        grievance_deadline
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Results published successfully', exam: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Finalize Results
router.post('/:id/finalize', protect, async (req, res) => {
  try {
    const { data: exam, error: examError } = await supabase.from('exams').select('grievance_deadline').eq('id', req.params.id).single();
    if (examError) throw examError;

    if (exam.grievance_deadline && new Date() < new Date(exam.grievance_deadline)) {
      return res.status(400).json({ message: 'Cannot finalize until 7-day grievance window has passed.' });
    }

    const { error } = await supabase
      .from('exams')
      .update({ workflow_status: 'Finalized' })
      .eq('id', req.params.id);

    if (error) throw error;

    // Lock marks
    await supabase.from('marks').update({ status: 'finalized' }).eq('exam_id', req.params.id);

    res.json({ message: 'Results finalized successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Get eligible subjects for an exam instance (by class and exam category)
router.get('/:id/eligible-subjects', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { data: exam, error } = await supabase
      .from('exams')
      .select('id, school_id, class_level, category')
      .eq('id', req.params.id)
      .single();

    if (error || !exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (school_id && exam.school_id && exam.school_id !== school_id) {
      return res.status(403).json({ message: 'Access denied: mismatched school_id' });
    }

    const eligible = await getClassEligibleSubjects(exam.school_id, exam.class_level, exam.category || 'periodic_assessment');
    res.json(eligible);
  } catch (err) {
    console.error('[GET ELIGIBLE SUBJECTS ERROR]:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get exam timetable
router.get('/:id/timetable', protectAnyUser, async (req, res) => {
  try {
    const { data: timetable, error } = await supabase
      .from('exam_timetable')
      .select('*')
      .eq('exam_id', req.params.id)
      .order('exam_date', { ascending: true });
      
    if (error) throw error;
    res.json(timetable || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Save exam timetable (Bulk Draft Save)
router.post('/:id/timetable', protect, async (req, res) => {
  try {
    const { timetableData } = req.body;
    const { school_id } = req.user;
    
    // 1. Verify exam ownership
    const { data: exam, error: exErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', school_id)
      .single();

    if (exErr || !exam) {
      return res.status(404).json({ message: 'Exam not found or access denied' });
    }

    if (timetableData && timetableData.length > 0) {
      // Validate dates
      const dailyCounts = {};
      for (const t of timetableData) {
        if (t.exam_date) {
          const d = new Date(t.exam_date);
          if (d.getDay() === 0) {
            return res.status(400).json({ message: `Cannot schedule exam on Sunday (${t.exam_date})` });
          }
          if (exam.start_date && exam.end_date && (t.exam_date < exam.start_date || t.exam_date > exam.end_date)) {
            return res.status(400).json({ message: `Date ${t.exam_date} is outside the exam period (${exam.start_date} to ${exam.end_date})` });
          }
          dailyCounts[t.exam_date] = (dailyCounts[t.exam_date] || 0) + 1;
          if (dailyCounts[t.exam_date] > 2) {
            return res.status(400).json({ message: `Maximum 2 exams allowed on ${t.exam_date}` });
          }
        }
      }

      // First, delete existing timetable for this exam
      await supabase.from('exam_timetable').delete().eq('exam_id', req.params.id);

      const inserts = timetableData.map(t => ({
        exam_id: req.params.id,
        school_id,
        class_level: t.class_level || exam.class_level,
        subject: t.subject,
        sub_subject: t.sub_subject || null,
        exam_date: t.exam_date || null,
        start_time: t.start_time || null,
        end_time: t.end_time || null,
        total_marks: t.total_marks || (exam.category === 'periodic_assessment' ? 50 : 100),
        passing_marks: t.passing_marks || (exam.category === 'periodic_assessment' ? 20 : 40),
        has_practical: t.has_practical || false,
        theory_marks: t.theory_marks || null,
        theory_passing_marks: t.theory_passing_marks || null,
        practical_marks: t.practical_marks || null,
        practical_passing_marks: t.practical_passing_marks || null,
        room_number: t.room_number || null,
        is_finalized: false
      }));
      
      const { error } = await supabase.from('exam_timetable').insert(inserts);
      if (error) throw error;
    } else {
      await supabase.from('exam_timetable').delete().eq('exam_id', req.params.id);
    }
    
    res.json({ message: 'Timetable saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// Finalize exam timetable for a specific class (Strict Server-Side Validation Gate)
router.put('/:id/timetable/finalize', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { class_level } = req.body;

    // 1. Verify exam ownership
    const { data: exam, error: exErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', school_id)
      .single();

    if (exErr || !exam) {
      return res.status(404).json({ message: 'Exam not found or access denied' });
    }

    const targetClass = class_level || exam.class_level;

    // 2. Fetch current timetable rows
    const { data: ttRows, error: ttErr } = await supabase
      .from('exam_timetable')
      .select('*')
      .eq('exam_id', req.params.id)
      .eq('class_level', targetClass)
      .order('exam_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (ttErr) throw ttErr;

    if (!ttRows || ttRows.length === 0) {
      return res.status(400).json({ 
        code: 'EMPTY_TIMETABLE', 
        message: `Cannot finalize: No subjects found in timetable for Class ${targetClass}` 
      });
    }

    // 3. Fetch class eligible subjects
    const eligibleSubs = await getClassEligibleSubjects(school_id, targetClass, exam.category);
    const eligibleNames = new Set(eligibleSubs.map(s => s.name.toUpperCase()));
    const scheduledNames = new Set(ttRows.map(r => r.subject.toUpperCase()));

    // Validation 1: Completeness - All required eligible subjects must be scheduled
    const missing = [...eligibleNames].filter(name => !scheduledNames.has(name));
    if (missing.length > 0) {
      return res.status(400).json({
        code: 'MISSING_SUBJECTS',
        message: `Cannot finalize: Missing required eligible subjects: ${missing.join(', ')}`,
        missing
      });
    }

    // Validation 2: Subject Eligibility - No forbidden subjects outside the category pool
    const forbidden = [...scheduledNames].filter(name => !eligibleNames.has(name));
    if (forbidden.length > 0) {
      return res.status(400).json({
        code: 'FORBIDDEN_SUBJECTS',
        message: `Cannot finalize: Forbidden subjects not permitted in ${exam.category}: ${forbidden.join(', ')}`,
        forbidden
      });
    }

    // Validation 3: Daily Limit, Sundays, Valid Dates and Times
    const dailyCounts = {};
    for (const r of ttRows) {
      if (!r.exam_date) {
        return res.status(400).json({
          code: 'UNSCHEDULED_DATE',
          message: `Cannot finalize: Subject '${r.subject}' has no exam date scheduled.`
        });
      }

      const d = new Date(r.exam_date);
      if (d.getDay() === 0) {
        return res.status(400).json({
          code: 'SUNDAY_SCHEDULED',
          message: `Cannot finalize: Exam for '${r.subject}' is scheduled on a Sunday (${r.exam_date}).`
        });
      }

      if (exam.start_date && exam.end_date && (r.exam_date < exam.start_date || r.exam_date > exam.end_date)) {
        return res.status(400).json({
          code: 'DATE_OUT_OF_RANGE',
          message: `Cannot finalize: Date ${r.exam_date} for '${r.subject}' is outside the exam period (${exam.start_date} to ${exam.end_date}).`
        });
      }

      dailyCounts[r.exam_date] = (dailyCounts[r.exam_date] || 0) + 1;
      if (dailyCounts[r.exam_date] > 2) {
        return res.status(400).json({
          code: 'DAILY_LIMIT_EXCEEDED',
          message: `Cannot finalize: More than 2 exams scheduled on ${r.exam_date}.`
        });
      }

      if (r.start_time && r.end_time && r.start_time >= r.end_time) {
        return res.status(400).json({
          code: 'INVALID_TIMES',
          message: `Cannot finalize: Start time (${r.start_time}) must be earlier than end time (${r.end_time}) for subject '${r.subject}'.`
        });
      }
    }

    // Validation 4: Grading Subjects Constraints & Priority Rule
    const gradingSubsMap = new Map(eligibleSubs.map(s => [s.name.toUpperCase(), !!s.is_grading]));
    const gradingRows = ttRows.filter(r => gradingSubsMap.get(r.subject.toUpperCase()));
    const nonGradingRows = ttRows.filter(r => !gradingSubsMap.get(r.subject.toUpperCase()));

    // Rule A: All grading subjects must be conducted within at most 2 distinct dates
    const gradingDates = new Set(gradingRows.map(r => r.exam_date));
    if (gradingDates.size > 2) {
      return res.status(400).json({
        code: 'GRADING_DATES_EXCEEDED',
        message: `Cannot finalize: All grading subjects must be conducted within at most 2 dates. Currently scheduled across ${gradingDates.size} dates: ${[...gradingDates].join(', ')}.`
      });
    }

    // Rule B: For non-grading subjects, max 1 exam per day in 1-shift system
    const nonGradingDailyCounts = {};
    for (const r of nonGradingRows) {
      nonGradingDailyCounts[r.exam_date] = (nonGradingDailyCounts[r.exam_date] || 0) + 1;
      if (nonGradingDailyCounts[r.exam_date] > 1) {
        return res.status(400).json({
          code: 'DAILY_LIMIT_EXCEEDED',
          message: `Cannot finalize: Only 1 non-grading exam per day is allowed. Multiple non-grading exams scheduled on ${r.exam_date}.`
        });
      }
    }

    // Rule C: 20 working days limit from exam start_date
    if (exam.start_date) {
      const allowedWorkingDates = getWorkingDatesCount(exam.start_date, 20);
      const maxAllowedDate = allowedWorkingDates[allowedWorkingDates.length - 1];
      for (const r of ttRows) {
        if (r.exam_date > maxAllowedDate) {
          return res.status(400).json({
            code: 'EXCEEDS_20_WORKING_DAYS',
            message: `Cannot finalize: Exam for '${r.subject}' on ${r.exam_date} exceeds the 20 working days limit (maximum allowed date: ${maxAllowedDate}).`
          });
        }
      }
    }

    // Rule D: Grading Priority Rule for terminal_examination
    if (exam.category === 'terminal_examination') {
      if (gradingRows.length > 0 && nonGradingRows.length > 0) {
        let latestGradingTime = null;
        let latestGradingSubject = '';
        for (const gr of gradingRows) {
          const dtStr = `${gr.exam_date}T${gr.start_time || '00:00:00'}`;
          if (!latestGradingTime || dtStr > latestGradingTime) {
            latestGradingTime = dtStr;
            latestGradingSubject = gr.subject;
          }
        }

        let earliestNonGradingTime = null;
        let earliestNonGradingSubject = '';
        for (const ngr of nonGradingRows) {
          const dtStr = `${ngr.exam_date}T${ngr.start_time || '00:00:00'}`;
          if (!earliestNonGradingTime || dtStr < earliestNonGradingTime) {
            earliestNonGradingTime = dtStr;
            earliestNonGradingSubject = ngr.subject;
          }
        }

        if (earliestNonGradingTime <= latestGradingTime) {
          return res.status(400).json({
            code: 'GRADING_PRIORITY_VIOLATION',
            message: `Cannot finalize: All grading subjects must be conducted before any non-grading subjects. Non-grading subject '${earliestNonGradingSubject}' is scheduled on or before grading subject '${latestGradingSubject}'.`
          });
        }
      }
    }

    // 4. Update status to finalized
    const { error: finError } = await supabase
      .from('exam_timetable')
      .update({ is_finalized: true })
      .eq('exam_id', req.params.id)
      .eq('class_level', targetClass);

    if (finError) throw finError;

    res.json({ message: 'Exam timetable finalized successfully' });
  } catch (err) {
    console.error('[FINALIZE ERROR]:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

module.exports = router;

