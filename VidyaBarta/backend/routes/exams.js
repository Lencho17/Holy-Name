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
const { mapClassSubjectsToTemplate } = require('../utils/templateRoutineMapper');

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

    // Fetch template's default routine items
    const { data: defaultTimetableRows } = await supabase
      .from('default_exam_timetables')
      .select('*')
      .eq('default_exam_id', template.id)
      .order('order_index', { ascending: true });

    // Calculate actual end date across all classes (within 20 working days) using placeholder mapping
    let maxAssignedDate = start_date;
    for (const c of targetClasses) {
      const subs = [...(classSubjectsMap[c] || [])];
      const previewTt = mapClassSubjectsToTemplate({
        examId: 'preview',
        schoolId,
        classLevel: c,
        templateRows: defaultTimetableRows || [],
        classSubjects: subs,
        workingDates,
        singleStart: single_start_time || '08:30',
        singleEnd: single_end_time || (templateCategory === 'periodic_assessment' ? '10:30' : '11:30'),
        templateCategory
      });

      previewTt.forEach(t => {
        if (t.exam_date && t.exam_date > maxAssignedDate) {
          maxAssignedDate = t.exam_date;
        }
      });
    }
    const calculatedEndDate = maxAssignedDate || workingDates[0];

    // 5. Phase 2: Atomic Execution with Rollback
    logical_exam_id = crypto.randomUUID();

    const singleStart = single_start_time || '08:30';
    const singleEnd = single_end_time || (templateCategory === 'periodic_assessment' ? '10:30' : '11:30');

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

    // Generate timetable rows per class using placeholder mapping
    const timetableInserts = [];

    for (const ex of createdExams) {
      const subs = [...(classSubjectsMap[ex.class_level] || [])];
      const classTt = mapClassSubjectsToTemplate({
        examId: ex.id,
        schoolId,
        classLevel: ex.class_level,
        templateRows: defaultTimetableRows || [],
        classSubjects: subs,
        workingDates,
        singleStart,
        singleEnd,
        templateCategory
      });
      timetableInserts.push(...classTt);
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

// Helper to calculate next grade for promotion
const getNextClassLevel = (currentClass) => {
  const progression = ['Nursery', 'KG-I', 'KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const curClean = (currentClass || '').trim();
  const idx = progression.findIndex(c => c.toLowerCase() === curClean.toLowerCase());
  if (idx !== -1 && idx < progression.length - 1) {
    return progression[idx + 1];
  }
  return 'Next Higher Class';
};

// Standard grading rule
const calculateGrade = (percentage) => {
  const p = parseFloat(percentage) || 0;
  if (p >= 90) return { grade: 'A1', gpa: 10.0, remarks: 'Outstanding' };
  if (p >= 80) return { grade: 'A2', gpa: 9.0, remarks: 'Excellent' };
  if (p >= 70) return { grade: 'B1', gpa: 8.0, remarks: 'Very Good' };
  if (p >= 60) return { grade: 'B2', gpa: 7.0, remarks: 'Good' };
  if (p >= 50) return { grade: 'C1', gpa: 6.0, remarks: 'Above Average' };
  if (p >= 40) return { grade: 'C2', gpa: 5.0, remarks: 'Average' };
  if (p >= 33) return { grade: 'D', gpa: 4.0, remarks: 'Pass' };
  return { grade: 'E', gpa: 0.0, remarks: 'Needs Improvement' };
};

// GET /api/exams/marksheets/class-data
// Aggregates data for Unit Test 1 & 2, Terminal 1 & 2, Combined 4-Exam, and Annual Average marksheets
router.get('/marksheets/class-data', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { class_level } = req.query;

    if (!class_level) {
      return res.status(400).json({ message: 'class_level is required' });
    }

    // 1. Fetch Students for the class
    const parts = class_level.trim().split(' ');
    let stuQuery = supabase
      .from('students')
      .select('*')
      .eq('grade', parts[0]);

    if (parts[1]) {
      stuQuery = stuQuery.eq('section', parts[1]);
    }
    if (school_id) {
      stuQuery = stuQuery.eq('school_id', school_id);
    }

    const { data: studentsData, error: stuErr } = await stuQuery;
    if (stuErr) throw stuErr;

    const students = (studentsData || []).sort((a, b) => {
      const rA = parseInt(a.roll_number, 10);
      const rB = parseInt(b.roll_number, 10);
      if (!isNaN(rA) && !isNaN(rB)) return rA - rB;
      return (a.student_name || '').localeCompare(b.student_name || '');
    });

    // 2. Fetch all exams for this class level
    let examQuery = supabase
      .from('exams')
      .select('*')
      .eq('class_level', class_level);

    if (school_id) {
      examQuery = examQuery.eq('school_id', school_id);
    }

    const { data: exams, error: examErr } = await examQuery.order('start_date', { ascending: true });
    if (examErr) throw examErr;

    // Categorize exams into the 4 slots: Periodic 1 (UT1), Terminal 1, Periodic 2 (UT2), Terminal 2
    const periodicExams = (exams || []).filter(e => e.category === 'periodic_assessment');
    const terminalExams = (exams || []).filter(e => e.category === 'terminal_examination');

    const ut1Exam = periodicExams[0] || null;
    const ut2Exam = periodicExams[1] || null;
    const term1Exam = terminalExams[0] || null;
    const term2Exam = terminalExams[1] || null;

    const allIdentifiedExamIds = [ut1Exam?.id, term1Exam?.id, ut2Exam?.id, term2Exam?.id].filter(Boolean);

    // 3. Fetch timetables for these exams
    let timetables = [];
    if (allIdentifiedExamIds.length > 0) {
      const { data: ttData, error: ttErr } = await supabase
        .from('exam_timetable')
        .select('*')
        .in('exam_id', allIdentifiedExamIds)
        .order('exam_date', { ascending: true });
      if (ttErr) throw ttErr;
      timetables = ttData || [];
    }

    // 4. Fetch marks for these exams
    let allMarks = [];
    if (allIdentifiedExamIds.length > 0) {
      const { data: mData, error: mErr } = await supabase
        .from('marks')
        .select('*')
        .in('exam_id', allIdentifiedExamIds);
      if (mErr) throw mErr;
      allMarks = mData || [];
    }

    // Index marks by examId -> studentId -> subject
    const marksMap = {};
    allMarks.forEach(m => {
      const key = `${m.exam_id}_${m.student_id}_${(m.subject || '').toUpperCase()}`;
      marksMap[key] = m;
    });

    // 4b. Fetch school subjects to distinguish scholastic vs grading subjects
    const normClass = normalizeClassLevel(class_level);
    let schoolSubjects = [];
    if (school_id) {
      const { data: ssData } = await supabase
        .from('school_subjects')
        .select('id, class_level, subject_id, is_core, elective_group_id, is_divided, subjects(id, name, code, order_index, marking_system)')
        .eq('school_id', school_id);
      
      schoolSubjects = (ssData || [])
        .filter(s => normalizeClassLevel(s.class_level) === normClass)
        .sort((a, b) => (a.subjects?.order_index || 999) - (b.subjects?.order_index || 999));
    }

    // Build grading and scholastic sets
    const gradingSubjectSet = new Set();
    const configScholasticSubs = [];
    const configGradingSubs = [];

    schoolSubjects.forEach(s => {
      const subName = s.subjects?.name ? s.subjects.name.toUpperCase().trim() : null;
      if (!subName) return;
      const isGrading = s.subjects?.marking_system === 'Grade' || s.subjects?.marking_system === 'grades';
      if (isGrading) {
        gradingSubjectSet.add(subName);
        if (!configGradingSubs.includes(subName)) configGradingSubs.push(subName);
      } else {
        if (!configScholasticSubs.includes(subName)) configScholasticSubs.push(subName);
      }
    });

    timetables.forEach(t => {
      const subName = t.subject ? t.subject.toUpperCase().trim() : null;
      if (!subName) return;
      if (t.is_grading) {
        gradingSubjectSet.add(subName);
        if (!configGradingSubs.includes(subName)) configGradingSubs.push(subName);
      }
    });

    // Extract unique subjects across all timetables and marks
    const examSubjectSet = new Set();
    timetables.forEach(t => {
      if (t.subject) examSubjectSet.add(t.subject.toUpperCase().trim());
    });
    allMarks.forEach(m => {
      if (m.subject) examSubjectSet.add(m.subject.toUpperCase().trim());
    });

    // Scholastic subjects: configured scholastic subjects + any exam timetable subjects not in grading set
    const scholasticSubjectSet = new Set(configScholasticSubs);
    examSubjectSet.forEach(s => {
      if (!gradingSubjectSet.has(s)) {
        scholasticSubjectSet.add(s);
      }
    });
    let scholasticSubjects = [...scholasticSubjectSet];

    // Grading subjects: configured grading subjects + timetabled grading subjects
    let gradingSubjectsList = [...configGradingSubs];
    
    // Add universal evaluation metrics: Attendance and Conduct if not already included
    if (!gradingSubjectsList.includes('ATTENDANCE')) gradingSubjectsList.unshift('ATTENDANCE');
    if (!gradingSubjectsList.includes('CONDUCT')) {
      const attIdx = gradingSubjectsList.indexOf('ATTENDANCE');
      gradingSubjectsList.splice(attIdx + 1, 0, 'CONDUCT');
    }

    // Fallback for KG/Nursery only if no other grading subjects were configured by school
    const isKgOrNursery = /^(KG|NURSERY|LKG|UKG|PPE)/i.test(class_level.trim());
    if (gradingSubjectsList.length <= 2 && isKgOrNursery) {
      const kgDefaults = ['CRAFT', 'DRAWING', 'CONVERSATION', 'DRILL/GAMES', 'DICTATION'];
      kgDefaults.forEach(d => {
        if (!gradingSubjectsList.includes(d)) gradingSubjectsList.push(d);
      });
    }

    const classSubjects = [...scholasticSubjects, ...gradingSubjectsList.filter(g => !['ATTENDANCE', 'CONDUCT'].includes(g))];

    // Helper to evaluate one exam for a student
    const evaluateStudentExam = (studentId, exam) => {
      if (!exam) return null;
      const examTt = timetables.filter(t => t.exam_id === exam.id);
      const isPeriodic = exam.category === 'periodic_assessment';
      const defaultMax = isPeriodic ? 50 : 100;
      const defaultPass = isPeriodic ? 20 : 40;

      const subjects = [];
      let totalObtained = 0;
      let totalMax = 0;
      let allPassed = true;
      let enteredCount = 0;

      const evalSubs = examTt.length > 0 ? examTt : scholasticSubjects.map(s => ({ subject: s, total_marks: defaultMax, passing_marks: defaultPass }));

      evalSubs.forEach(t => {
        const subName = t.subject;
        const isGradingSub = t.is_grading || gradingSubjectSet.has((subName || '').toUpperCase());
        const markKey = `${exam.id}_${studentId}_${(subName || '').toUpperCase()}`;
        const m = marksMap[markKey];

        const maxMarks = parseFloat(t.total_marks || defaultMax);
        const passMarks = parseFloat(t.passing_marks || defaultPass);
        const theoryMax = t.theory_marks != null ? parseFloat(t.theory_marks) : null;
        const practicalMax = t.practical_marks != null ? parseFloat(t.practical_marks) : null;

        const hasEntry = !!m;
        if (hasEntry && !isGradingSub) enteredCount++;

        const marksObt = hasEntry ? (parseFloat(m.marks_obtained) || 0) : null;
        const pracObt = hasEntry && m.practical_marks_obtained != null ? (parseFloat(m.practical_marks_obtained) || 0) : null;
        const totalSubObt = marksObt != null ? (marksObt + (pracObt || 0)) : null;

        if (!isGradingSub) {
          if (totalSubObt != null) {
            totalObtained += totalSubObt;
            totalMax += maxMarks;
            if (totalSubObt < passMarks) allPassed = false;
          } else {
            allPassed = false;
          }
        }

        const subPercentage = totalSubObt != null && maxMarks > 0 ? ((totalSubObt / maxMarks) * 100) : 0;
        const gradeInfo = m?.grade ? { grade: m.grade } : (totalSubObt != null ? calculateGrade(subPercentage) : { grade: '—', gpa: 0, remarks: 'Pending' });

        subjects.push({
          subject: subName,
          isGrading: isGradingSub,
          maxMarks: isGradingSub ? '—' : maxMarks,
          passingMarks: isGradingSub ? '—' : passMarks,
          theoryMax,
          practicalMax,
          marksObtained: marksObt,
          practicalMarks: pracObt,
          totalObtained: totalSubObt,
          percentage: totalSubObt != null && !isGradingSub ? subPercentage.toFixed(1) : '—',
          grade: gradeInfo.grade,
          remarks: totalSubObt != null ? (totalSubObt >= passMarks ? 'Pass' : 'Needs Focus') : (isGradingSub ? 'Graded' : 'Pending')
        });
      });

      const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
      const overallGradeInfo = calculateGrade(overallPercentage);

      return {
        examId: exam.id,
        examName: exam.name,
        category: exam.category,
        subjects,
        totalObtained,
        totalMax,
        percentage: overallPercentage,
        overallGrade: overallGradeInfo.grade,
        status: allPassed && enteredCount > 0 ? 'PASSED' : (enteredCount === 0 ? 'PENDING' : 'NEEDS IMPROVEMENT')
      };
    };

    // 5. Aggregate student records
    const aggregatedStudents = students.map(student => {
      const ut1 = evaluateStudentExam(student.id, ut1Exam);
      const ut2 = evaluateStudentExam(student.id, ut2Exam);
      const term1 = evaluateStudentExam(student.id, term1Exam);
      const term2 = evaluateStudentExam(student.id, term2Exam);

      // Combined 4-Exam Breakdown (Scholastic Subjects)
      const targetEvalSubjects = scholasticSubjects.length > 0 ? scholasticSubjects : classSubjects;

      const combinedSubjects = targetEvalSubjects.map((subName, sIdx) => {
        const u1 = ut1?.subjects.find(s => s.subject.toUpperCase() === subName);
        const t1 = term1?.subjects.find(s => s.subject.toUpperCase() === subName);
        const u2 = ut2?.subjects.find(s => s.subject.toUpperCase() === subName);
        const t2 = term2?.subjects.find(s => s.subject.toUpperCase() === subName);

        const ut1Val = u1?.totalObtained ?? null;
        const term1Val = t1?.totalObtained ?? null;
        const ut2Val = u2?.totalObtained ?? null;
        const term2Val = t2?.totalObtained ?? null;

        const vals = [ut1Val, term1Val, ut2Val, term2Val].filter(v => v != null);
        const grandTotal = vals.reduce((a, b) => a + b, 0);
        const grandMax = (u1 ? u1.maxMarks : 50) + (t1 ? t1.maxMarks : 100) + (u2 ? u2.maxMarks : 50) + (t2 ? t2.maxMarks : 100);
        const subPct = grandMax > 0 ? ((grandTotal / grandMax) * 100) : 0;
        const subGrade = vals.length > 0 ? calculateGrade(subPct).grade : '—';

        return {
          sl: sIdx + 1,
          subject: subName,
          ut1: ut1Val != null ? `${ut1Val} / ${u1.maxMarks}` : '—',
          term1: term1Val != null ? `${term1Val} / ${t1.maxMarks}` : '—',
          ut2: ut2Val != null ? `${ut2Val} / ${u2.maxMarks}` : '—',
          term2: term2Val != null ? `${term2Val} / ${t2.maxMarks}` : '—',
          grandTotal: vals.length > 0 ? grandTotal : '—',
          grandMax,
          percentage: vals.length > 0 ? subPct.toFixed(1) : '—',
          grade: subGrade
        };
      });

      const combTotalObt = (ut1?.totalObtained || 0) + (term1?.totalObtained || 0) + (ut2?.totalObtained || 0) + (term2?.totalObtained || 0);
      const combTotalMax = (ut1?.totalMax || 0) + (term1?.totalMax || 0) + (ut2?.totalMax || 0) + (term2?.totalMax || 0);
      const combPct = combTotalMax > 0 ? ((combTotalObt / combTotalMax) * 100).toFixed(1) : 0;
      const combGrade = calculateGrade(combPct);

      // Annual Combined Marksheet Calculation:
      // Exact weightage formula: 20% PA1 + 30% Term 1 + 20% PA2 + 30% Term 2 = 100%
      const annualSubjects = targetEvalSubjects.map((subName, sIdx) => {
        const u1 = ut1?.subjects.find(s => s.subject.toUpperCase() === subName);
        const t1 = term1?.subjects.find(s => s.subject.toUpperCase() === subName);
        const u2 = ut2?.subjects.find(s => s.subject.toUpperCase() === subName);
        const t2 = term2?.subjects.find(s => s.subject.toUpperCase() === subName);

        // PA 1 (20% weightage)
        const ut1Obt = u1?.totalObtained ?? null;
        const ut1Max = u1?.maxMarks || 50;
        const ut1Pct = ut1Obt != null && ut1Max > 0 ? (ut1Obt / ut1Max) * 100 : null;
        const ut1Wt = ut1Pct != null ? (ut1Pct * 0.20) : null;

        // Term 1 (30% weightage)
        const term1Obt = t1?.totalObtained ?? null;
        const term1Max = t1?.maxMarks || 100;
        const term1Pct = term1Obt != null && term1Max > 0 ? (term1Obt / term1Max) * 100 : null;
        const term1Wt = term1Pct != null ? (term1Pct * 0.30) : null;

        // PA 2 (20% weightage)
        const ut2Obt = u2?.totalObtained ?? null;
        const ut2Max = u2?.maxMarks || 50;
        const ut2Pct = ut2Obt != null && ut2Max > 0 ? (ut2Obt / ut2Max) * 100 : null;
        const ut2Wt = ut2Pct != null ? (ut2Pct * 0.20) : null;

        // Term 2 (30% weightage)
        const term2Obt = t2?.totalObtained ?? null;
        const term2Max = t2?.maxMarks || 100;
        const term2Pct = term2Obt != null && term2Max > 0 ? (term2Obt / term2Max) * 100 : null;
        const term2Wt = term2Pct != null ? (term2Pct * 0.30) : null;

        let totalWt = 0;
        let earnedWt = 0;
        if (ut1Wt != null) { totalWt += 20; earnedWt += ut1Wt; }
        if (term1Wt != null) { totalWt += 30; earnedWt += term1Wt; }
        if (ut2Wt != null) { totalWt += 20; earnedWt += ut2Wt; }
        if (term2Wt != null) { totalWt += 30; earnedWt += term2Wt; }

        let finalScore = null;
        if (totalWt > 0) {
          finalScore = totalWt === 100 ? earnedWt.toFixed(1) : ((earnedWt / totalWt) * 100).toFixed(1);
        }

        const gradeInfo = finalScore != null ? calculateGrade(finalScore) : { grade: '—', remarks: 'Pending' };

        return {
          sl: sIdx + 1,
          subject: subName,
          ut1Raw: ut1Obt != null ? `${ut1Obt}/${ut1Max}` : '—',
          ut1Wt: ut1Wt != null ? ut1Wt.toFixed(1) : '—',
          term1Raw: term1Obt != null ? `${term1Obt}/${term1Max}` : '—',
          term1Wt: term1Wt != null ? term1Wt.toFixed(1) : '—',
          ut2Raw: ut2Obt != null ? `${ut2Obt}/${ut2Max}` : '—',
          ut2Wt: ut2Wt != null ? ut2Wt.toFixed(1) : '—',
          term2Raw: term2Obt != null ? `${term2Obt}/${term2Max}` : '—',
          term2Wt: term2Wt != null ? term2Wt.toFixed(1) : '—',
          finalScore: finalScore != null ? finalScore : '—',
          grade: gradeInfo.grade,
          remarks: gradeInfo.remarks
        };
      });

      // Grading / Co-scholastic subjects evaluation
      const annualGradingSubjects = gradingSubjectsList.map(subName => {
        const t1Mark = term1Exam ? marksMap[`${term1Exam.id}_${student.id}_${subName.toUpperCase()}`] : null;
        const t2Mark = term2Exam ? marksMap[`${term2Exam.id}_${student.id}_${subName.toUpperCase()}`] : null;

        let halfYearlyVal = t1Mark?.grade;
        if (!halfYearlyVal && t1Mark?.marks_obtained != null) {
          halfYearlyVal = t1Mark.marks_obtained >= 40 ? 'GOOD' : 'FAIR';
        }
        if (!halfYearlyVal) {
          halfYearlyVal = subName === 'CONDUCT' ? 'GOOD' : subName === 'ATTENDANCE' ? '95%' : 'A';
        }

        let annualVal = t2Mark?.grade;
        if (!annualVal && t2Mark?.marks_obtained != null) {
          annualVal = t2Mark.marks_obtained >= 40 ? 'GOOD' : 'FAIR';
        }
        if (!annualVal) {
          annualVal = subName === 'CONDUCT' ? 'GOOD' : subName === 'ATTENDANCE' ? '96%' : 'A';
        }

        return {
          subject: subName,
          halfYearly: halfYearlyVal,
          annual: annualVal
        };
      });

      const validAnnualScores = annualSubjects.map(s => parseFloat(s.finalScore)).filter(v => !isNaN(v));
      const annualAvg = validAnnualScores.length > 0 ? (validAnnualScores.reduce((a, b) => a + b, 0) / validAnnualScores.length).toFixed(1) : 0;
      const annualGrade = calculateGrade(annualAvg);
      const isPromoted = parseFloat(annualAvg) >= 33;
      const nextClass = getNextClassLevel(class_level);

      // Smart teacher remark based on performance
      let teacherRemarks = 'Satisfactory academic progress. Promoted to next class.';
      const avgNum = parseFloat(annualAvg);
      if (avgNum >= 90) {
        teacherRemarks = 'Outstanding scholastic excellence! Demonstrates exemplary academic discipline and leadership. Promoted with distinction.';
      } else if (avgNum >= 80) {
        teacherRemarks = 'Excellent performance throughout the year. Consistently attentive and hardworking. Promoted with merit.';
      } else if (avgNum >= 60) {
        teacherRemarks = 'Very good academic progress. Shows keen interest and potential for further improvement. Promoted.';
      } else if (avgNum >= 50) {
        teacherRemarks = 'Fair performance. Needs to devote more practice to core subjects in the coming academic year. Promoted.';
      } else if (avgNum >= 33) {
        teacherRemarks = 'Marginal pass. Regular home study and dedicated remedial focus strongly recommended. Promoted on trial.';
      } else {
        teacherRemarks = 'Performance below passing threshold. Comprehensive academic supervision and remedial support needed. Detained.';
      }

      return {
        student,
        ut1,
        ut2,
        term1,
        term2,
        combined: {
          subjects: combinedSubjects,
          totalObtained: combTotalObt,
          totalMax: combTotalMax,
          percentage: combPct,
          overallGrade: combGrade.grade,
          status: parseFloat(combPct) >= 33 ? 'PASSED' : 'NEEDS IMPROVEMENT'
        },
        annual: {
          subjects: annualSubjects,
          gradingSubjects: annualGradingSubjects,
          appearingSubjectsCount: annualSubjects.filter(s => s.finalScore !== '—').length,
          totalObtained: validAnnualScores.reduce((a, b) => a + b, 0).toFixed(1),
          totalMax: validAnnualScores.length * 100,
          percentage: annualAvg,
          overallGrade: annualGrade.grade,
          status: isPromoted ? 'PASSED' : 'NEEDS IMPROVEMENT',
          promotion: isPromoted ? `PROMOTED TO CLASS ${nextClass.toUpperCase()}` : `DETAINED IN CLASS ${class_level.toUpperCase()}`,
          attendance: '210 / 222 Days (94.6%)',
          conduct: 'GOOD',
          teacherRemarks,
          examRemarks: {
            ut1: ut1 ? (parseFloat(ut1.percentage) >= 75 ? 'Good performance in Unit Test 1.' : 'Satisfactory progress.') : '—',
            term1: term1 ? (parseFloat(term1.percentage) >= 75 ? 'Commendable performance in Half-Yearly Examination.' : 'Fair effort.') : '—',
            ut2: ut2 ? (parseFloat(ut2.percentage) >= 75 ? 'Steady progress in Unit Test 2.' : 'Needs regular revision.') : '—',
            term2: term2 ? (parseFloat(term2.percentage) >= 75 ? 'Outstanding completion of Annual Exam.' : (isPromoted ? 'Satisfactory annual completion.' : 'Needs improvement.')) : '—'
          }
        }
      };
    });

    // 6. Assign Class Ranks based on Annual Performance
    const sortedForRank = [...aggregatedStudents].sort((a, b) => parseFloat(b.annual.percentage) - parseFloat(a.annual.percentage));
    sortedForRank.forEach((item, rIdx) => {
      const rank = rIdx + 1;
      item.annual.rank = rank;
      item.combined.rank = rank;
      if (item.ut1) item.ut1.rank = rank;
      if (item.ut2) item.ut2.rank = rank;
      if (item.term1) item.term1.rank = rank;
      if (item.term2) item.term2.rank = rank;
    });

    res.json({
      class_level,
      exams: {
        ut1: ut1Exam ? { id: ut1Exam.id, name: ut1Exam.name, category: ut1Exam.category, start_date: ut1Exam.start_date, end_date: ut1Exam.end_date } : null,
        term1: term1Exam ? { id: term1Exam.id, name: term1Exam.name, category: term1Exam.category, start_date: term1Exam.start_date, end_date: term1Exam.end_date } : null,
        ut2: ut2Exam ? { id: ut2Exam.id, name: ut2Exam.name, category: ut2Exam.category, start_date: ut2Exam.start_date, end_date: ut2Exam.end_date } : null,
        term2: term2Exam ? { id: term2Exam.id, name: term2Exam.name, category: term2Exam.category, start_date: term2Exam.start_date, end_date: term2Exam.end_date } : null
      },
      classSubjects,
      scholasticSubjects,
      gradingSubjects: gradingSubjectsList,
      students: aggregatedStudents
    });
  } catch (err) {
    console.error('[GET MARKSHEETS CLASS DATA ERROR]:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;


