const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinary");

// Storage config — images land in the "school-events" folder on Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Dynamic folder based on eventTitle if available, otherwise general
    const folder = req.body.eventTitle
      ? `school-events/${req.body.eventTitle.replace(/\s+/g, "-").toLowerCase()}`
      : "school-events/general";

    const isPdf = file.mimetype === "application/pdf" || (file.originalname && file.originalname.toLowerCase().endsWith(".pdf"));
    const params = {
      folder,
      resource_type: isPdf ? "raw" : "auto",
      type: "upload", // Ensure it's a public asset
    };

    if (file.mimetype.startsWith("image/")) {
      params.allowed_formats = ["jpg", "jpeg", "png", "webp"];
      params.transformation = [{ quality: "auto", fetch_format: "auto" }];
    } else if (isPdf) {
      // For raw files, we include the original name and a timestamp to avoid collisions
      params.public_id = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    }

    return params;
  },
});

// File filter — only images allowed
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed."), false);
  }
};

// Single image upload (e.g. for individual cover images or gallery items)
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("image");

// Multi-image upload (e.g. for bulk gallery additions — up to 30 images)
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array("images", 30);

// Mixed upload: one cover ('image') + many gallery photos ('images')
const uploadEventImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: "image", maxCount: 1 },      // cover image
  { name: "images", maxCount: 30 },    // gallery images
]);

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadEventImages,
};
