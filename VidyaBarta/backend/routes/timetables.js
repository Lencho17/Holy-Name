const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');


// @desc    Get all timetables for the school (used for clash detection)
// @route   GET /api/timetables/all
// @access  Private
router.get('/all', protect, async (req, res) => {
  try {
    // Note: If you have a school_id, you'd filter by it here
    const { data, error } = await supabase
      .from('class_timetable')
      .select('*');
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get timetable for a specific class & section
// @route   GET /api/timetables/:class_level/:section
// @access  Private
router.get('/:class_level/:section', protect, async (req, res) => {
  try {
    const { data: timetable, error } = await supabase
      .from('class_timetable')
      .select('*')
      .eq('class_level', req.params.class_level)
      .eq('section', req.params.section)
      .order('day_of_week', { ascending: true })
      .order('period_number', { ascending: true });
      
    if (error) throw error;
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Save/Update timetable entries
// @route   POST /api/timetables
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { class_level, section, entries } = req.body; 
    // entries: array of { day_of_week, period_number, subject, staff_id, start_time, end_time }
    
    // First, delete existing entries for this class/section to avoid duplicates during a full save
    await supabase
      .from('class_timetable')
      .delete()
      .eq('class_level', class_level)
      .eq('section', section);
      
    if (entries && entries.length > 0) {
      const insertData = entries.map(e => ({
        class_level,
        section,
        ...e
      }));
      
      const { data, error } = await supabase
        .from('class_timetable')
        .insert(insertData)
        .select();
        
      if (error) throw error;
      res.status(201).json(data);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

module.exports = router;
