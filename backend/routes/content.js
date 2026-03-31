const express = require('express');
const multer = require('multer');
const SiteContent = require('../models/SiteContent');
const { protect } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, uploadEventImages } = require('../middleware/upload');
const { uploadPdfToGithub } = require('../utils/github');
const { sendEmail } = require('../utils/mailer');

const router = express.Router();

/**
 * Simple in-memory cache for the monolithic SiteContent document.
 * In a serverless environment, this persists as long as the instance is warm.
 */
let contentCache = {
  data: null,
  lastFetched: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

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
    const now = Date.now();
    
    // Serve from cache if available and not expired
    if (contentCache.data && (now - contentCache.lastFetched < contentCache.ttl)) {
      // console.log('⚡ Serving content from cache');
      return res.json(contentCache.data);
    }

    let content = await SiteContent.findOne().lean();
    if (!content) {
      content = await SiteContent.create({});
      content = content.toObject();
    }
    
    // Update cache
    contentCache.data = content;
    contentCache.lastFetched = now;
    
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/content — protected, update site content
router.put('/', protect, async (req, res) => {
  try {
    const updateData = req.body;
    const allowedFields = ['gallery', 'events', 'highlights', 'videos', 'faculty', 'principal', 'notices', 'notificationEmail', 'banner', 'socialLinks', 'alumni', 'stats', 'schoolProfile', 'visionStatement', 'aimsAndObjectives', 'headMistress'];
    
    // Pick only allowed fields
    const safeUpdateData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Emergency validation: reject any field containing "malicious" patterns
        const contentStr = JSON.stringify(updateData[field]);
        if (/hitler/gi.test(contentStr)) {
          console.error(`[SECURITY] Blocked malicious update containing restricted keywords on field: ${field}`);
          continue; 
        }
        safeUpdateData[field] = updateData[field];
      }
    }

    let content = await SiteContent.findOne();
    if (!content) {
      content = await SiteContent.create({});
    }

    // Apply updates conservatively (atomic field updates)
    for (const key in safeUpdateData) {
      const val = safeUpdateData[key];
      
      // If it's a simple object (like schoolProfile, socialLinks, principal, headMistress)
      // we merge it to prevent blowing away existing fields if the frontend only sends a partial update.
      if (val && typeof val === 'object' && !Array.isArray(val) && ['schoolProfile', 'socialLinks', 'principal', 'headMistress'].includes(key)) {
        // Merge key-by-key into the existing Mongoose subdocument.
        // Spreading Mongoose subdocuments is unreliable for nested arrays.
        if (!content[key]) content[key] = {};
        for (const subKey of Object.keys(val)) {
          content[key][subKey] = val[subKey];
        }
        content.markModified(key);
      } else {
        // For arrays and primitives, simple assignment (replaces the whole array)
        content[key] = val;
      }
    }

    await content.save();
    content = content.toObject();

    // BUST CACHE on update so changes are visible immediately
    contentCache.data = content;
    contentCache.lastFetched = Date.now();

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
router.post('/upload', protect, (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error('[CLOUDINARY UPLOAD ERROR]:', err);
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      // req.file.path is the Cloudinary URL
      res.json({ url: req.file.path, public_id: req.file.filename });
    } catch (error) {
      console.error('[CONTROLLER ERROR]:', error);
      res.status(500).json({ message: 'Upload failed', error: error.message });
    }
  });
});

// POST /api/content/upload-pdf — protected, upload PDF to GitHub
router.post('/upload-pdf', protect, (req, res) => {
  pdfMemoryUpload(req, res, async (err) => {
    if (err) {
      console.error('[PDF MULTER ERROR]:', err);
      return res.status(500).json({ message: 'File processing failed', error: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No PDF file uploaded' });
      }
      const rawUrl = await uploadPdfToGithub(req.file.buffer, req.file.originalname);
      res.json({ url: rawUrl });
    } catch (error) {
      console.error('[PDF GITHUB UPLOAD ERROR]:', error);
      
      // Attempt to notify the administrator automatically
      try {
        const content = await SiteContent.findOne().lean();
        const adminEmail = content?.notificationEmail || process.env.EMAIL_USER;
        
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: '⚠️ Alert: PDF Notice Upload Failed',
            html: `
              <div style="font-family: Arial, sans-serif; border: 1px solid #ffcccc; border-radius: 8px; overflow: hidden; max-width: 600px;">
                <div style="background-color: #ff4444; color: white; padding: 15px; font-weight: bold; font-size: 18px;">
                  Upload Failure Alert
                </div>
                <div style="padding: 20px; background-color: #fffafb;">
                  <p>The administrative dashboard encountered a critical error while attempting to upload a new PDF notice to GitHub.</p>
                  <p><strong>Attempted File:</strong> ${req.file ? req.file.originalname : 'Unknown'}</p>
                  <div style="background-color: #fce4e4; border-left: 4px solid #cc0000; padding: 10px; margin: 15px 0;">
                    <p style="margin: 0; color: #cc0000; font-family: monospace;">${error.message}</p>
                  </div>
                  <p>This may indicate an issue with the GitHub configuration (e.g. invalid repository token) or a network service interruption. Please investigate the backend server logs.</p>
                </div>
              </div>
            `
          });
          console.log(`[PDF GITHUB UPLOAD ERROR] Alert email sent to ${adminEmail}`);
        }
      } catch (mailError) {
        console.error('[NOTIFY ADMIN ERROR]: Failed to send failure email.', mailError);
      }

      res.status(500).json({ message: 'GitHub upload failed', error: error.message });
    }
  });
});

// POST /api/content/upload-event — protected, upload multiple event images (cover + gallery)
router.post('/upload-event', protect, (req, res) => {
  uploadEventImages(req, res, (err) => {
    if (err) {
      console.error('[EVENT CLOUDINARY UPLOAD ERROR]:', err);
      return res.status(500).json({ message: 'Event upload failed', error: err.message });
    }
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
      console.error('[EVENT CONTROLLER ERROR]:', error);
      res.status(500).json({ message: 'Event upload failed', error: error.message });
    }
  });
});

module.exports = router;
