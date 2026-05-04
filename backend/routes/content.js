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
  ttl: 30 * 1000, // 30 seconds
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

    let content = await SiteContent.findOne();
    if (!content) {
      content = await SiteContent.create({});
    }

    // Auto-populate default admission fields if empty
    if (!content.admissionFields || content.admissionFields.length === 0) {
      const defaultFields = [
        // Section: Student Information
        { name: 'studentName', label: 'Student Name (As per Aadhaar)', type: 'text', required: true, section: 'Student Information', order: 1, isSystemField: true },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, section: 'Student Information', order: 2, isSystemField: true },
        { name: 'AadhaarNumber', label: 'Aadhaar Number', type: 'text', required: false, section: 'Student Information', order: 3, isSystemField: true, placeholder: '12-DIGIT AADHAAR NUMBER' },
        { name: 'placeOfBirth', label: 'Place of Birth', type: 'text', required: false, section: 'Student Information', order: 4, isSystemField: true },
        { name: 'gender', label: 'Gender', type: 'select', required: true, section: 'Student Information', order: 5, options: ['MALE', 'FEMALE', 'OTHER'], isSystemField: true },
        { name: 'bloodGroup', label: 'Blood Group', type: 'select', required: false, section: 'Student Information', order: 6, options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], isSystemField: true },
        { name: 'religion', label: 'Religion', type: 'select', required: false, section: 'Student Information', order: 7, options: ['HINDUISM', 'ISLAM', 'CHRISTIANITY', 'SIKHISM', 'BUDDHISM', 'JAINISM', 'OTHER'], isSystemField: true },
        { name: 'caste', label: 'Caste', type: 'select', required: true, section: 'Student Information', order: 8, options: ['GENERAL', 'OBC', 'SC', 'ST', 'MOBC'], isSystemField: true },
        { name: 'gradeApplied', label: 'Grade/Class Applied For', type: 'select', required: true, section: 'Student Information', order: 9, options: ['PRE-NURSERY', 'KG I (LKG)', 'KG II (UKG)', 'CLASS I', 'CLASS II', 'CLASS III', 'CLASS IV', 'CLASS V', 'CLASS VI', 'CLASS VII', 'CLASS VIII', 'CLASS IX', 'CLASS X', 'CLASS XI', 'CLASS XII'], isSystemField: true },
        
        // Section: Parent/Guardian Info
        { name: 'fatherName', label: "Father's Name", type: 'text', required: false, section: 'Parent/Guardian Info', order: 10, isSystemField: true },
        { name: 'fatherOccupation', label: "Father's Occupation", type: 'text', required: false, section: 'Parent/Guardian Info', order: 11, isSystemField: true },
        { name: 'motherName', label: "Mother's Name", type: 'text', required: false, section: 'Parent/Guardian Info', order: 12, isSystemField: true },
        { name: 'motherOccupation', label: "Mother's Occupation", type: 'text', required: false, section: 'Parent/Guardian Info', order: 13, isSystemField: true },
        { name: 'guardianName', label: "Guardian's Full Name", type: 'text', required: false, section: 'Parent/Guardian Info', order: 14, isSystemField: true },
        { name: 'relationship', label: "Relationship to Student", type: 'text', required: false, section: 'Parent/Guardian Info', order: 15, isSystemField: true },
        { name: 'contactNumber', label: "Contact Number", type: 'text', required: true, section: 'Parent/Guardian Info', order: 16, isSystemField: true, placeholder: '10-DIGIT PHONE NUMBER' },
        { name: 'email', label: "Email Address", type: 'email', required: true, section: 'Parent/Guardian Info', order: 17, isSystemField: true },
        
        // Section: Address Details
        { name: 'address', label: 'Residential Address', type: 'textarea', required: true, section: 'Address Details', order: 18, isSystemField: true },
        { name: 'po', label: 'Post Office (PO)', type: 'text', required: true, section: 'Address Details', order: 19, isSystemField: true },
        { name: 'ps', label: 'Police Station (PS)', type: 'text', required: true, section: 'Address Details', order: 20, isSystemField: true },
        { name: 'pincode', label: 'Pincode', type: 'text', required: true, section: 'Address Details', order: 21, isSystemField: true },
        
        // Section: Academic Background
        { name: 'previousSchool', label: 'Previous School Attended', type: 'text', required: false, section: 'Academic Background', order: 22, isSystemField: true },
        { name: 'penNumber', label: 'PEN (Permanent Education Number)', type: 'text', required: false, section: 'Academic Background', order: 23, isSystemField: true },
        { name: 'boardMarks', label: 'Total Marks Obtained (Class X)', type: 'number', required: false, section: 'Academic Background', order: 24, isSystemField: true },
        { name: 'darpanId', label: 'DARPAN ID', type: 'text', required: false, section: 'Academic Background', order: 25, isSystemField: true },
        
        // Section: Documents
        { name: 'studentPhoto', label: 'Student Passport Photo', type: 'file', required: true, section: 'Documents', order: 26, isSystemField: true },
        { name: 'birthCertificate', label: 'Birth Certificate', type: 'file', required: true, section: 'Documents', order: 27, isSystemField: true },
        { name: 'transferCertificate', label: 'Transfer Certificate', type: 'file', required: false, section: 'Documents', order: 28, isSystemField: true },
        { name: 'marksheet', label: 'Previous Class Marksheet', type: 'file', required: false, section: 'Documents', order: 29, isSystemField: true },
        { name: 'casteCertificate', label: 'Caste Certificate', type: 'file', required: false, section: 'Documents', order: 30, isSystemField: true },
        { name: 'AadhaarVidOrReceipt', label: 'Aadhaar Card / VID Photo', type: 'file', required: false, section: 'Documents', order: 31, isSystemField: true },
      ];
      content.admissionFields = defaultFields;
      await content.save();
    }
    
    // Update cache
    contentCache.data = content.toObject();
    contentCache.lastFetched = now;
    
    res.json(contentCache.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/content — protected, update site content
router.put('/', protect, async (req, res) => {
  try {
    const updateData = req.body;
    const allowedFields = ['gallery', 'events', 'highlights', 'videos', 'faculty', 'principal', 'notices', 'notificationEmail', 'banner', 'socialLinks', 'alumni', 'stats', 'faqs', 'emeritus', 'centerOfExcellence', 'schoolProfile', 'visionStatement', 'aimsAndObjectives', 'headMistress', 'coursesPage', 'admissionFields'];
    
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
      if (val && typeof val === 'object' && !Array.isArray(val) && ['schoolProfile', 'socialLinks', 'principal', 'headMistress', 'coursesPage', 'faculty'].includes(key)) {
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
      let msg = 'Event upload failed';
      if (err.message && err.message.includes('Resource is invalid')) {
        msg = 'Upload rejected by Cloudinary: One or more selected files are invalid, corrupted, or 0 bytes.';
      }
      return res.status(500).json({ message: msg, error: err.message });
    }
    try {
      const result = {};
      if (req.files && req.files.image && req.files.image.length > 0) {
        result.cover = {
          url: req.files.image[0].path,
          public_id: req.files.image[0].filename
        };
      }
      if (req.files && req.files.images && req.files.images.length > 0) {
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

// POST /api/content/gallery-view — public, increment view count for gallery items
router.post('/gallery-view', async (req, res) => {
  try {
    const { ids } = req.body; // array of gallery item _id values
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array required' });
    }

    // Increment views for all matching gallery sub-documents atomically
    await SiteContent.updateOne(
      {},
      { $inc: Object.fromEntries(ids.slice(0, 50).map((id, i) => {
        // Find index is unreliable, use positional filtered update
        return [`gallery.$[elem${i}].views`, 1];
      })) },
      { arrayFilters: ids.slice(0, 50).map((id, i) => ({ [`elem${i}._id`]: id })) }
    );

    // Bust cache so views are reflected
    contentCache.data = null;
    contentCache.lastFetched = 0;

    res.json({ success: true });
  } catch (error) {
    console.error('Gallery view error:', error.message);
    res.status(500).json({ message: 'Error tracking view' });
  }
});

module.exports = router;
