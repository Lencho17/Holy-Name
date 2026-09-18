const express = require('express');
const router = express.Router();
const {
  previewRecipients,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, protectAnyStaff } = require('../middleware/auth');

// @route   GET /api/announcements/preview-recipients
router.get('/preview-recipients', protectAnyStaff, previewRecipients);

// @route   GET /api/announcements
// @route   POST /api/announcements
router.route('/')
  .get(protectAnyStaff, getAnnouncements)
  .post(protect, createAnnouncement);

// @route   DELETE /api/announcements/:id
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
