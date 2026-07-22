const express = require('express');
const router = express.Router();
const { protect, protectAnyStaff } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Get all exams (scoped by school_id)
router.get('/', protectAnyStaff, async (req, res) => {
  try {
    const { school_id } = req.user;
    let query = supabase.from('exams').select('*');
    
    if (school_id) {
      query = query.eq('school_id', school_id);
    }
    
    const { data: exams, error } = await query;
      
    if (error) throw error;
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new exam (admin only, attaches school_id)
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, class_levels, class_level, start_date, end_date } = req.body;
    const { school_id } = req.user;
    
    const classes = class_levels || [class_level];
    
    const inserts = classes.map(c => ({
      name, type, class_level: c, start_date, end_date, school_id
    }));
    
    const { data: exams, error } = await supabase
      .from('exams')
      .insert(inserts)
      .select();

    if (error) throw error;
    res.status(201).json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error', details: err });
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


// Get exam timetable
router.get('/:id/timetable', protectAnyStaff, async (req, res) => {
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

// Save exam timetable (Bulk)
router.post('/:id/timetable', protect, async (req, res) => {
  try {
    const { timetableData } = req.body;
    const { school_id } = req.user;
    
    // First, delete existing timetable for this exam
    await supabase.from('exam_timetable').delete().eq('exam_id', req.params.id);
    
    if (timetableData && timetableData.length > 0) {
      const inserts = timetableData.map(t => ({
        exam_id: req.params.id,
        school_id,
        class_level: t.class_level,
        subject: t.subject,
        sub_subject: t.sub_subject || null,
        exam_date: t.exam_date || null,
        start_time: t.start_time || null,
        end_time: t.end_time || null,
        total_marks: t.total_marks || 100,
        passing_marks: t.passing_marks || 30,
        has_practical: t.has_practical || false,
        theory_marks: t.theory_marks || null,
        practical_marks: t.practical_marks || null,
        room_number: t.room_number || null
      }));
      
      const { error } = await supabase.from('exam_timetable').insert(inserts);
      if (error) throw error;
    }
    
    res.json({ message: 'Timetable saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
