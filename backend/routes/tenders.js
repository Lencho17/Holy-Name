const express = require('express');
const Tender = require('../models/Tender');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET all tenders (public)
router.get('/', async (req, res) => {
  try {
    const tenders = await Tender.find().sort({ publishDate: -1 });
    res.json(tenders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single tender (public)
router.get('/:id', async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    if (!tender) return res.status(404).json({ message: 'Tender not found' });
    res.json(tender);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new tender (admin)
router.post('/', protect, async (req, res) => {
  try {
    const tender = new Tender(req.body);
    const newTender = await tender.save();
    res.status(201).json(newTender);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update tender (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const updatedTender = await Tender.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTender);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE tender (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Tender.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tender deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
