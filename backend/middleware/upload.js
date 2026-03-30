const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/**
 * Creates a multer storage engine for Cloudinary
 * @param {string} defaultFolder - The default folder path/name on Cloudinary
 */
const createStorage = (defaultFolder) => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      // For events, we use a dynamic subfolder
      const folder = (defaultFolder === 'school-events' && req.body.eventTitle)
        ? `${defaultFolder}/${req.body.eventTitle.replace(/\s+/g, "-").toLowerCase()}`
        : defaultFolder;

      const isPdf = file.mimetype === "application/pdf" || (file.originalname && file.originalname.toLowerCase().endsWith(".pdf"));
      const params = {
        folder,
        resource_type: isPdf ? "raw" : "auto",
        type: "upload",
      };

      if (file.mimetype.startsWith("image/")) {
        params.allowed_formats = ["jpg", "jpeg", "png", "webp"];
        params.transformation = [{ quality: "auto", fetch_format: "auto" }];
      } else if (isPdf) {
        params.public_id = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
      }

      return params;
    },
  });
};

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (allowedMimes.includes(file.mimetype) || (file.originalname && file.originalname.toLowerCase().endsWith(".pdf"))) {
    cb(null, true);
  } else {
    cb(new Error("Only image (JPG, PNG, WEBP) and PDF files are allowed."), false);
  }
};

// Default instances for general content
const contentStorage = createStorage('school-events');
const upload = multer({
  storage: contentStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Instance for PDF Notices
const pdfStorage = createStorage('school-notices');
const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter,
  limits: { fileSize: 10 * 1014 * 1024 }, // 10 MB
}).single('pdf');

const uploadSingle = upload.single("image");
const uploadMultiple = upload.array("images", 30);
const uploadEventImages = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 30 },
]);

module.exports = {
  createStorage,
  uploadSingle,
  uploadMultiple,
  uploadEventImages,
  uploadPdf,
  fileFilter
};
