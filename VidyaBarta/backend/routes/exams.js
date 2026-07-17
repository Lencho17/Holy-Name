const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// Get all exams
router.get('/', protect, async (req, res) => {
  try {
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new exam
router.post('/', protect, async (req, res) => {
  try {
    const { name, type, class_level, start_date, end_date } = req.body;
    
    const { data: exam, error } = await supabase
      .from('exams')
      .insert([{ name, type, class_level, start_date, end_date }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error', details: err });
  }
});

// Get marks for an exam
router.get('/:id/marks', protect, async (req, res) => {
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
router.post('/:id/marks/subject-teacher', protect, async (req, res) => {
  try {
    const { marks } = req.body; // Array of { student_id, subject, marks_obtained, max_marks }
    const staff_id = req.admin.id; // Or req.user.id depending on auth middleware

    // We process each mark
    for (let mark of marks) {
      const { data: existingMark } = await supabase
        .from('marks')
        .select('*')
        .eq('exam_id', req.params.id)
        .eq('student_id', mark.student_id)
        .eq('subject', mark.subject)
        .single();
        
      if (existingMark) {
        // Only update if not finalized
        if (existingMark.status !== 'finalized') {
           await supabase.from('marks').update({
             marks_obtained: mark.marks_obtained,
             max_marks: mark.max_marks,
             status: 'submitted_by_subject_teacher'
           }).eq('id', existingMark.id);
        }
      } else {
        await supabase.from('marks').insert({
          exam_id: req.params.id,
          student_id: mark.student_id,
          subject: mark.subject,
          marks_obtained: mark.marks_obtained,
          max_marks: mark.max_marks,
          staff_id,
          status: 'submitted_by_subject_teacher'
        });
      }
    }

    res.json({ message: 'Marks submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Class Teacher review marks
router.post('/:id/marks/class-teacher-review', protect, async (req, res) => {
  try {
    // modifications is array of { mark_id, marks_obtained, reason }
    const { modifications } = req.body; 
    const staff_id = req.admin.id;

    for (let mod of modifications) {
      const { data: existingMark } = await supabase
        .from('marks')
        .select('*')
        .eq('id', mod.mark_id)
        .single();
        
      if (existingMark) {
        if (existingMark.marks_obtained !== mod.marks_obtained) {
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
    
    // Update exam status if all marks are reviewed (Optional depending on how strict workflow is)
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

    if (new Date() < new Date(exam.grievance_deadline)) {
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

module.exports = router;
