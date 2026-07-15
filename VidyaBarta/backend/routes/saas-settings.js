const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Public route to fetch saas settings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saas_global_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { contact_email: 'sales@vidyabarta.com', contact_phone: '+91 98765 43210', contact_address: '' });
  } catch (error) {
    console.error('Error fetching saas settings:', error.message);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update saas settings (Admin only)
router.put('/', async (req, res) => {
  try {
    const { contact_email, contact_phone, contact_address } = req.body;

    const { data, error } = await supabase
      .from('saas_global_settings')
      .update({ contact_email, contact_phone, contact_address, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Settings updated successfully', data });
  } catch (error) {
    console.error('Error updating saas settings:', error.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
