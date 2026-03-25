const express = require('express');
const multer = require('multer');
const path = require('path');
const SiteContent = require('../models/SiteContent');
const { protect } = require('../middleware/auth');

const router = express.Router();

// --- Multer config for image uploads ---
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'holyname/content',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// GET /api/content — public, fetch all site content
router.get('/', async (req, res) => {
  try {
    let content = await SiteContent.findOne();
    if (!content) {
      content = await SiteContent.create({});
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/content — protected, update site content
router.put('/', protect, async (req, res) => {
  try {
    const updateData = req.body;
    let content = await SiteContent.findOne();

    if (!content) {
      content = await SiteContent.create(updateData);
    } else {
      // Only update fields that are provided
      const allowedFields = ['gallery', 'events', 'highlights', 'videos', 'faculty', 'principal', 'notices', 'notificationEmail'];
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          content[field] = updateData[field];
        }
      });
      await content.save();
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/content/upload — protected, upload a single image
router.post('/upload', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = req.file.path; // Cloudinary secure URL
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = router;
