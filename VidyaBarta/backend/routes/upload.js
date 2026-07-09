const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary'); // Use existing cloudinary config if available, otherwise fallback

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    // Use upload_stream to upload a file buffer directly to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto', // CRITICAL: 'auto' handles both Images and PDFs properly
        upload_preset: 'ml_default', // Use your signed upload preset
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return res.status(500).json({ success: false, message: 'Upload failed', error });
        }
        
        // Return the secure URL to the frontend
        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          url: result.secure_url,
          format: result.format,
          public_id: result.public_id
        });
      }
    );

    // End the stream with the buffer from Multer
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ success: false, message: 'Server processing error' });
  }
});

// ============================================
// CLOUDINARY SIGNED UPLOAD PARAMS
// ============================================
// This endpoint generates signed upload parameters so the frontend can upload
// files directly to Cloudinary, bypassing the Vercel 4.5MB body size limit.
router.get('/sign', (req, res) => {
  try {
    const folder = req.query.folder || 'admissions';
    const timestamp = Math.round(Date.now() / 1000);

    // Build the params to sign
    const paramsToSign = {
      timestamp,
      folder,
    };

    // Generate the signature using the Cloudinary API secret
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error('Cloudinary Sign Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate upload signature' });
  }
});

module.exports = router;
