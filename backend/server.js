const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const seedData = require('./utils/seed');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const admissionsRoutes = require('./routes/admissions');
const studentsRoutes = require('./routes/students');
const inquiriesRoutes = require('./routes/inquiries');
const jobRoutes = require('./routes/jobs');
const jobApplicationRoutes = require('./routes/jobApplications');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================

// Gzip compression for all responses — move to the top for maximum benefit
app.use(compression());

// HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to load from frontend
  contentSecurityPolicy: false, // disable for dev flexibility; tighten in production
}));

// CORS — restrict in production, open in dev
const corsOptions = {
  origin: isProduction
    ? [process.env.CLIENT_URL, 'https://www.holynameschool.edu', 'https://holy-name.vercel.app'].filter(Boolean)
    : true, // allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting — protect auth endpoints from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================

const uploadsDir = path.join(__dirname, 'uploads');
const contentUploadsDir = path.join(uploadsDir, 'content');
const admissionsUploadsDir = path.join(uploadsDir, 'admissions');
const jobApplicationsUploadsDir = path.join(uploadsDir, 'job-applications');

[uploadsDir, contentUploadsDir, admissionsUploadsDir, jobApplicationsUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/uploads', express.static(uploadsDir, {
  maxAge: isProduction ? '7d' : 0, // cache uploaded files for 7 days in prod
}));

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/request-otp', authLimiter);
app.use('/api/auth', apiLimiter, authRoutes);

app.use('/api/content', apiLimiter, contentRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/job-applications', jobApplicationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Holy Name School API is running successfully. Please visit the frontend via Vercel.');
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({
    message: isProduction ? 'Internal server error' : err.message,
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error(`[UNHANDLED REJECTION] ${err.message}`);
  if (isProduction) process.exit(1);
});

// ============================================
// INITIALIZATION & EXPORT
// ============================================

/**
 * Main application entry point optimized for both long-running servers and serverless functions.
 */
const startApp = async () => {
  try {
    // 1. Establish database connection (cached)
    await connectDB();

    // 2. Perform background seeding non-blockingly (don't await)
    // This removes seeding overhead from the request critical path
    seedData().catch(e => console.error('Background seed failed:', e.message));

    // 3. Start listener if explicitly running as a standalone server
    if (require.main === module) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error(`❌ Application failed to start: ${err.message}`);
  }
};

// Start initialization
startApp();

// CRITICAL for Vercel/Serverless: Export the app object
module.exports = app;
