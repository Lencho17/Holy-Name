const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private (Admin)
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

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Admin)
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

// @desc    Get marks for an exam
// @route   GET /api/exams/:id/marks
// @access  Private (Admin)
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

// @desc    Update marks for an exam
// @route   POST /api/exams/:id/marks
// @access  Private (Admin)
router.post('/:id/marks', protect, async (req, res) => {
  try {
    const { marks } = req.body; // Array of { student_id, subject, marks_obtained, max_marks }
    
    const upsertData = marks.map(m => ({
      ...m,
      exam_id: req.params.id,
    }));
    
    // In Supabase, upsert requires a unique constraint. We assume id is unique if passed, or it will create new.
    // For simplicity, we just delete existing marks for this exam and re-insert.
    if (upsertData.length > 0) {
      await supabase.from('marks').delete().eq('exam_id', req.params.id);
      const { data: updatedMarks, error } = await supabase.from('marks').insert(upsertData).select();
      if (error) throw error;
      res.json(updatedMarks);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Toggle withhold status for a student's result
// @route   PUT /api/exams/:id/marks/:studentId/withhold
// @access  Private (Admin)
router.put('/:id/marks/:studentId/withhold', protect, async (req, res) => {
  try {
    const { subject, withheld } = req.body;
    
    const { data: mark, error } = await supabase
      .from('marks')
      .update({ withheld })
      .eq('exam_id', req.params.id)
      .eq('student_id', req.params.studentId)
      .eq('subject', subject)
      .select()
      .single();
      
    if (error) throw error;
    res.json(mark);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
