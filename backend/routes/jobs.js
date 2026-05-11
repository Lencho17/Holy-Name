const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all job openings
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Create a job opening
// @route   POST /api/jobs
// @access  Private/Admin
router.post('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title: req.body.title,
        department: req.body.department,
        type: req.body.type || 'Full-Time',
        experience: req.body.experience,
        qualifications: req.body.qualifications || [],
        deadline: req.body.deadline || 'Open until filled'
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Update a job opening
// @route   PUT /api/jobs/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      department: req.body.department,
      type: req.body.type,
      experience: req.body.experience,
      qualifications: req.body.qualifications,
      deadline: req.body.deadline,
      updated_at: new Date()
    };

    // Remove undefined
    const cleanUpdate = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));

    const { data: job, error } = await supabase
      .from('jobs')
      .update(cleanUpdate)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc    Delete a job opening
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Job removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
