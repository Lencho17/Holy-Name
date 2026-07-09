const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/holidays
router.get('/', async (req, res) => {
  try {
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('*')
      .order('holiday_date', { ascending: true });

    if (error) throw error;
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/holidays
router.post('/', protect, async (req, res) => {
  try {
    const { name, date, description } = req.body;
    
    if (!name || !date) {
      return res.status(400).json({ message: 'Name and date are required' });
    }

    const { data, error } = await supabase
      .from('holidays')
      .insert({ name, holiday_date: date, description })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/holidays/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Holiday deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
