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

// Get all SaaS FAQs
router.get('/faqs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saas_faqs')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching FAQs:', error.message);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Add FAQ
router.post('/faqs', async (req, res) => {
  try {
    const { question, answer, order_index } = req.body;
    const { data, error } = await supabase
      .from('saas_faqs')
      .insert([{ question, answer, order_index: order_index || 0 }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding FAQ:', error.message);
    res.status(500).json({ error: 'Failed to add FAQ' });
  }
});

// Update FAQ
router.put('/faqs/:id', async (req, res) => {
  try {
    const { question, answer, order_index } = req.body;
    const { data, error } = await supabase
      .from('saas_faqs')
      .update({ question, answer, order_index, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating FAQ:', error.message);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// Delete FAQ
router.delete('/faqs/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('saas_faqs')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error.message);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// Get all SaaS Features
router.get('/features', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saas_features')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching features:', error.message);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

// Add Feature
router.post('/features', async (req, res) => {
  try {
    const { icon, title, description, order_index } = req.body;
    const { data, error } = await supabase
      .from('saas_features')
      .insert([{ icon: icon || 'FiMonitor', title, description, order_index: order_index || 0 }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding feature:', error.message);
    res.status(500).json({ error: 'Failed to add feature' });
  }
});

// Update Feature
router.put('/features/:id', async (req, res) => {
  try {
    const { icon, title, description, order_index } = req.body;
    const { data, error } = await supabase
      .from('saas_features')
      .update({ icon, title, description, order_index, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error updating feature:', error.message);
    res.status(500).json({ error: 'Failed to update feature' });
  }
});

// Delete Feature
router.delete('/features/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('saas_features')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature:', error.message);
    res.status(500).json({ error: 'Failed to delete feature' });
  }
});

module.exports = router;
