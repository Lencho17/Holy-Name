const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET all tenders (public)
router.get('/', async (req, res) => {
  try {
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('*')
      .order('publish_date', { ascending: false });
    
    if (error) throw error;
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single tender (public)
router.get('/:id', async (req, res) => {
  try {
    const { data: tender, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !tender) return res.status(404).json({ message: 'Tender not found' });
    res.json(tender);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new tender (admin)
router.post('/', protect, async (req, res) => {
  try {
    const { data: newTender, error } = await supabase
      .from('tenders')
      .insert({
        tender_number: req.body.tenderNumber,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        closing_date: req.body.closingDate,
        estimated_value: req.body.estimatedValue,
        document_url: req.body.documentUrl,
        status: req.body.status || 'Active'
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newTender);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update tender (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = {
      tender_number: req.body.tenderNumber,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      closing_date: req.body.closingDate,
      estimated_value: req.body.estimatedValue,
      document_url: req.body.documentUrl,
      status: req.body.status,
      updated_at: new Date()
    };

    // Remove undefined
    const cleanUpdate = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));

    const { data: updatedTender, error } = await supabase
      .from('tenders')
      .update(cleanUpdate)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedTender);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE tender (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('tenders').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Tender deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
