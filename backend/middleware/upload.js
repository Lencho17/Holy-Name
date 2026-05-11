const multer = require("multer");
const path = require("path");
const supabase = require("../config/supabase");

// Use memory storage for Supabase (we need the buffer)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (allowedMimes.includes(file.mimetype) || (file.originalname && file.originalname.toLowerCase().endsWith(".pdf"))) {
    cb(null, true);
  } else {
    cb(new Error("Only image (JPG, PNG, WEBP) and PDF files are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const cloudinary = require('../config/cloudinary');

/**
 * Helper to upload a file buffer to Cloudinary
 * @param {Object} file - The file object from multer (req.file or req.files[key][0])
 * @param {string} bucket - (Ignored for Cloudinary, kept for signature compatibility)
 * @param {string} folder - The folder path within Cloudinary
 */
const uploadToCloudinary = (file, bucket, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // Use 'raw' for PDFs so Cloudinary returns a /raw/upload/ URL that's directly accessible
    const isPdf = file.mimetype === 'application/pdf' || 
                  (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
    const resourceType = isPdf ? 'raw' : 'auto';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(new Error('Failed to upload to Cloudinary'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const uploadPdf = upload.single('pdf');
const uploadSingle = upload.single("image");
const uploadMultiple = upload.array("images", 30);
const uploadEventImages = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 30 },
]);

module.exports = {
  upload,
  uploadToCloudinary,
  uploadSingle,
  uploadMultiple,
  uploadEventImages,
  uploadPdf,
  fileFilter
};
