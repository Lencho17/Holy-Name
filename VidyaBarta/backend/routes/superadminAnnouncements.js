const express = require('express');
const router = express.Router();
const {
  previewSchoolRecipients,
  publishPlatformAnnouncement,
  getPlatformAnnouncements,
  deletePlatformAnnouncement
} = require('../controllers/superadminAnnouncementController');
const { protect } = require('../middleware/auth');

// @route   GET /api/superadmin/announcements/preview-recipients
router.get('/preview-recipients', protect, previewSchoolRecipients);

// @route   GET /api/superadmin/announcements
// @route   POST /api/superadmin/announcements
router.route('/')
  .get(protect, getPlatformAnnouncements)
  .post(protect, publishPlatformAnnouncement);

// @route   DELETE /api/superadmin/announcements/:id
router.delete('/:id', protect, deletePlatformAnnouncement);

module.exports = router;
