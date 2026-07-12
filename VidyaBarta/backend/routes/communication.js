const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const supabase = require('../config/supabase');

// @desc    Get communication logs
// @route   GET /api/communication
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('communication_logs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Send a communication (WhatsApp/SMS mock)
// @route   POST /api/communication
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
  try {
    const { audience, channel, message } = req.body;
    
    // In a real app, here you would call Twilio, WhatsApp Business API, MSG91, etc.
    // For now, we simulate the API call and log the successful send.
    
    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data, error } = await supabase
      .from('communication_logs')
      .insert([{ 
        audience, 
        channel, 
        message,
        sent_by: req.user.id,
        status: 'sent'
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

module.exports = router;
