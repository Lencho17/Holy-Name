const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// @desc    Get issued certificates
// @route   GET /api/certificates
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { data: certs, error } = await supabase
      .from('certificates_issued')
      .select('*, students(student_name, admission_id)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Record an issued certificate
// @route   POST /api/certificates
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { student_id, certificate_type, issue_date, remarks } = req.body;
    
    const { data, error } = await supabase
      .from('certificates_issued')
      .insert([{ 
        student_id, 
        certificate_type, 
        issue_date: issue_date || new Date().toISOString(), 
        remarks,
        issued_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @desc    Delete an issued certificate record
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('certificates_issued')
      .delete()
      .eq('id', req.params.id);
      
    if (error) throw error;
    res.json({ message: 'Certificate record deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
