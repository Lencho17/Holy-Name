const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

// Get all grievances for a school (Admin View)
router.get('/', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    let query = supabase
      .from('result_grievances')
      .select(`
        *,
        exam:exams (id, name, class_level),
        student:students (id, name, roll_number)
      `)
      .order('created_at', { ascending: false });
    
    if (school_id) {
      query = query.eq('school_id', school_id);
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ message: 'Server error fetching grievances' });
  }
});

// Update grievance status (Admin action)
router.patch('/:id/resolve', protect, async (req, res) => {
  try {
    const { school_id } = req.user;
    const { id } = req.params;
    const { status, admin_reply } = req.body;

    const { data, error } = await supabase
      .from('result_grievances')
      .update({
        status: status || 'Resolved',
        admin_reply,
        resolved_at: new Date()
      })
      .eq('id', id)
      .eq('school_id', school_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Grievance updated', data });
  } catch (error) {
    console.error('Error updating grievance:', error);
    res.status(500).json({ message: 'Server error updating grievance' });
  }
});

// Student submitting a grievance (Need to use student auth here - this assumes studentAuth middleware or checking token)
// Typically, we might pass studentAuth middleware, but we'll export it for both or assume auth middleware can decode student token
// We will export a separate route block for student APIs if needed, but for now we will just use a generic token check
const { protectStudent } = require('../middleware/auth');

router.post('/submit', protectStudent, async (req, res) => {
  try {
    const { school_id, student_id } = req.student;
    const { exam_id, subject, complaint } = req.body;

    // Check if exam allows grievance (is published and within 7 day window)
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('workflow_status, grievance_deadline')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) return res.status(404).json({ message: 'Exam not found' });
    
    if (exam.workflow_status !== 'Published') {
      return res.status(400).json({ message: 'Results are not published yet, or are already finalized.' });
    }

    if (new Date() > new Date(exam.grievance_deadline)) {
      return res.status(400).json({ message: 'The 7-day grievance window has expired for this exam.' });
    }

    const { data, error } = await supabase
      .from('result_grievances')
      .insert({
        school_id,
        exam_id,
        student_id,
        subject,
        complaint
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Grievance submitted successfully!', data });
  } catch (error) {
    console.error('Error submitting grievance:', error);
    res.status(500).json({ message: 'Server error submitting grievance' });
  }
});

// Student fetching their own grievances
router.get('/my-grievances', protectStudent, async (req, res) => {
  try {
    const { student_id } = req.student;
    const { data, error } = await supabase
      .from('result_grievances')
      .select('*, exam:exams(name)')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching student grievances:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
