const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { protect } = require('../middleware/auth');

// @route   POST /api/inquiries
// @desc    Submit a new inquiry (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, type, subject, message, userType, isAnonymous, className, section } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: 'Please provide type, subject, and message.' });
    }

    if (!isAnonymous && (type === 'Suggestion' || type === 'Complain') && (!name || !email)) {
       return res.status(400).json({ message: 'Name and email are required unless anonymous.' });
    }

    // Generate Tracking Number: HNS/TYPE/YEAR/SEQUENCE
    const year = new Date().getFullYear();
    const typeCode = type === 'Suggestion' ? 'SUG' : type === 'Complain' ? 'COM' : 'INQ';
    const count = await Inquiry.countDocuments({ 
      type, 
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    const trackingNumber = `HNS/${typeCode}/${year}/${(count + 1).toString().padStart(3, '0')}`;

    const newInquiry = new Inquiry({
      name: isAnonymous ? 'Anonymous User' : name,
      email: isAnonymous ? '' : email,
      phone: isAnonymous ? '' : phone,
      type,
      subject,
      userType,
      isAnonymous,
      className,
      section,
      message,
      trackingNumber
    });

    await newInquiry.save();
    res.status(201).json({ message: 'Inquiry submitted successfully.', inquiry: newInquiry });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ message: 'Server error while submitting inquiry.' });
  }
});

// @route   GET /api/inquiries
// @desc    Get all inquiries (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Server error while fetching inquiries.' });
  }
});

// @route   PATCH /api/inquiries/:id/read
// @desc    Toggle isRead status (Protected)
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    inquiry.isRead = !inquiry.isRead;
    await inquiry.save();

    res.json({ message: `Inquiry marked as ${inquiry.isRead ? 'read' : 'unread'}.`, inquiry });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
});

// @route   DELETE /api/inquiries/:id
// @desc    Delete an inquiry (Protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found.' });
    }

    await Inquiry.deleteOne({ _id: req.params.id });
    res.json({ message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ message: 'Server error while deleting inquiry.' });
  }
});

module.exports = router;
