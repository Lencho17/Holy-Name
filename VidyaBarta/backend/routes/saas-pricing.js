const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Public route to fetch pricing plans
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saas_pricing_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching pricing plans:', error.message);
    res.status(500).json({ error: 'Failed to fetch pricing plans' });
  }
});

// Create new pricing plan (Admin only)
router.post('/', async (req, res) => {
  try {
    // In a real app we would verify req.admin
    const { name, description, price, interval, features, is_popular, button_text, button_link, sort_order } = req.body;
    
    const { data, error } = await supabase
      .from('saas_pricing_plans')
      .insert([{
        name, description, price, interval, features, is_popular, button_text, button_link, sort_order
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Plan created successfully', data });
  } catch (error) {
    console.error('Error creating pricing plan:', error.message);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Update pricing plan (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, interval, features, is_popular, button_text, button_link, sort_order } = req.body;

    const { data, error } = await supabase
      .from('saas_pricing_plans')
      .update({ name, description, price, interval, features, is_popular, button_text, button_link, sort_order })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Plan updated successfully', data });
  } catch (error) {
    console.error('Error updating pricing plan:', error.message);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete pricing plan (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('saas_pricing_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error.message);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;
