const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// @desc    Get exam duties for a specific exam date or all
// @route   GET /api/exam-duties
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { date } = req.query;
    
    let query = supabase.from('staff_exam_duties').select('*').order('exam_date', { ascending: false });
    
    if (date) {
      query = query.eq('exam_date', date);
    }
    
    const { data: duties, error } = await query;
      
    if (error) throw error;
    res.json(duties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Assign a staff member to an exam duty
// @route   POST /api/exam-duties
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { staff_id, exam_date, start_time, end_time, room_no, role, venue } = req.body;
    
    const { data: duty, error } = await supabase
      .from('staff_exam_duties')
      .insert([{ staff_id, exam_date, start_time, end_time, room_no, role, venue }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(duty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @desc    Delete an exam duty
// @route   DELETE /api/exam-duties/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('staff_exam_duties')
      .delete()
      .eq('id', req.params.id);
      
    if (error) throw error;
    res.json({ message: 'Duty deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
