const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// @desc    Get all concessions/extensions
// @route   GET /api/concessions
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { data: concessions, error } = await supabase
      .from('fee_concessions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(concessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create a concession request
// @route   POST /api/concessions
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { student_id, type, document_url, discount_amount, extension_date } = req.body;
    
    const { data: concession, error } = await supabase
      .from('fee_concessions')
      .insert([{ student_id, type, document_url, discount_amount, extension_date }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(concession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Approve or reject a concession request
// @route   PUT /api/concessions/:id/status
// @access  Private (Admin)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    const { data: concession, error } = await supabase
      .from('fee_concessions')
      .update({ status, approved_by: req.user.id, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(concession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get Admit Cards for an exam
// @route   GET /api/concessions/admit-cards/:examId
// @access  Private (Admin)
router.get('/admit-cards/:examId', protect, async (req, res) => {
  try {
    const { data: admitCards, error } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('exam_id', req.params.examId);
      
    if (error) throw error;
    res.json(admitCards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Release/Block Admit Card
// @route   PUT /api/concessions/admit-cards/:examId/release
// @access  Private (Admin)
router.put('/admit-cards/:examId/release', protect, async (req, res) => {
  try {
    const { student_id, status } = req.body; // 'released' or 'blocked'
    const release_date = status === 'released' ? new Date().toISOString() : null;
    
    // Upsert equivalent: check if exists, then update or insert
    const { data: existing, error: findError } = await supabase
      .from('admit_cards')
      .select('*')
      .eq('exam_id', req.params.examId)
      .eq('student_id', student_id)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('admit_cards')
        .update({ status, release_date })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('admit_cards')
        .insert([{ exam_id: req.params.examId, student_id, status, release_date }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
