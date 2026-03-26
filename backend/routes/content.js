const express = require('express');
const multer = require('multer');
const SiteContent = require('../models/SiteContent');
const { protect } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, uploadEventImages } = require('../middleware/upload');
const { uploadPdfToGithub } = require('../utils/github');

const router = express.Router();

// Multer memory storage for PDFs (no Cloudinary — goes to GitHub)
const pdfMemoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single('pdf');

router.get('/', async (req, res) => {
  try {
    let content = await SiteContent.findOne().lean();
    if (!content) {
      content = await SiteContent.create({});
      content = content.toObject();
    }
    
    // Gallery and Events are now back in SiteContent model
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
    const allowedFields = ['gallery', 'events', 'highlights', 'videos', 'faculty', 'principal', 'notices', 'notificationEmail', 'banner', 'socialLinks', 'alumni', 'stats'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          content[field] = updateData[field];
        }
      }
      await content.save();
    }

    res.json(content);
  } catch (error) {
    console.error('PUT /api/content error:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/content/upload — protected, upload single image (Cloudinary)
router.post('/upload', protect, uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path, public_id: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// POST /api/content/upload-pdf — protected, upload PDF to GitHub
router.post('/upload-pdf', protect, pdfMemoryUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }
    const rawUrl = await uploadPdfToGithub(req.file.buffer, req.file.originalname);
    res.json({ url: rawUrl });
  } catch (error) {
    console.error('GitHub PDF upload error:', error.message);
    res.status(500).json({ message: 'PDF upload failed', error: error.message });
  }
});

// POST /api/content/upload-event — protected, upload multiple event images (cover + gallery)
router.post('/upload-event', protect, uploadEventImages, (req, res) => {
  try {
    const result = {};
    if (req.files.image) {
      result.cover = {
        url: req.files.image[0].path,
        public_id: req.files.image[0].filename
      };
    }
    if (req.files.images) {
      result.gallery = req.files.images.map(f => ({
        url: f.path,
        public_id: f.filename
      }));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Event upload failed', error: error.message });
  }
});

module.exports = router;
