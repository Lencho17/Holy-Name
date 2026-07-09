const express = require('express');
const router = express.Router();
const axios = require('axios');
const cloudinary = require('../config/cloudinary');

// @desc    Proxy file requests to avoid CORS and force proper delivery
// @route   GET /api/files/proxy
// @access  Public (or Protected if needed)
router.get('/proxy', async (req, res) => {
  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    // Only allow proxying from trusted domains (Cloudinary or Supabase)
    const isTrusted = url.includes('cloudinary.com') || url.includes('supabase.co');
    if (!isTrusted) {
      return res.status(403).json({ success: false, message: 'URL domain is not trusted' });
    }

    let fetchUrl = url;

    // For Cloudinary files that return 401 (strict transformations enabled),
    // generate a signed URL using the Cloudinary SDK
    if (url.includes('cloudinary.com')) {
      try {
        // Extract public_id and resource_type from the Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/<public_id>.<ext>
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        
        // Find the index of 'upload' in the path
        const uploadIdx = pathParts.indexOf('upload');
        if (uploadIdx !== -1) {
          // Resource type is 2 segments before 'upload' (e.g., /image/upload/ or /raw/upload/)
          const resourceType = pathParts[uploadIdx - 1] || 'image';
          
          // Public ID is everything after 'upload' (skip the version segment starting with 'v')
          let publicIdParts = pathParts.slice(uploadIdx + 1);
          // Remove version segment (starts with 'v' followed by digits)
          if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) {
            publicIdParts = publicIdParts.slice(1);
          }
          const publicIdWithExt = publicIdParts.join('/');
          // Remove file extension for public_id
          const lastDot = publicIdWithExt.lastIndexOf('.');
          const publicId = lastDot !== -1 ? publicIdWithExt.substring(0, lastDot) : publicIdWithExt;
          const ext = lastDot !== -1 ? publicIdWithExt.substring(lastDot + 1) : '';

          // Generate a signed URL
          fetchUrl = cloudinary.url(publicId, {
            resource_type: resourceType,
            type: 'upload',
            sign_url: true,
            format: ext || undefined,
            flags: filename ? 'attachment' : undefined,
          });
        }
      } catch (parseErr) {
        console.warn('Could not parse Cloudinary URL for signing, using original:', parseErr.message);
        fetchUrl = url;
      }
    }

    const response = await axios({
      url: fetchUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 15000
    });

    // Forward the content type from the source
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType || 'application/pdf');

    // If filename is provided, force download
    if (filename) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      // For viewing PDFs in browser
      res.setHeader('Content-Disposition', 'inline');
    }

    // Pipe the data to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('File Proxy Error:', error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ success: false, message: 'Failed to proxy file', error: error.message });
  }
});

module.exports = router;
