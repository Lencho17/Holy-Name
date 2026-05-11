const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const admissionsRoutes = require('./routes/admissions');
const studentsRoutes = require('./routes/students');
const inquiriesRoutes = require('./routes/inquiries');
const jobRoutes = require('./routes/jobs');
const jobApplicationRoutes = require('./routes/jobApplications');
const tenderRoutes = require('./routes/tenders');
const tenderApplicationRoutes = require('./routes/tenderApplications');
const appointmentRoutes = require('./routes/appointments');
const fileRoutes = require('./routes/files');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Trust the first proxy (e.g., Vercel, Render) for accurate rate limiting
app.set('trust proxy', 1);

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
    ? [process.env.CLIENT_URL, 'https://holy-name-liard.vercel.app', 'https://holynamehsschool.in', 'https://www.holynamehsschool.in', 'https://www.holynameschool.edu', 'https://holy-name.vercel.app'].filter(Boolean)
    : true, // allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

const { apiLimiter, authLimiter, submissionLimiter } = require('./middleware/rateLimiters');

// Request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================

// Local storage is decommissioned in favor of Supabase Storage.
// We keep /api/files/proxy for serving external assets securely.

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/request-otp', authLimiter);
app.use('/api/auth', apiLimiter, authRoutes);

app.use('/api/content', apiLimiter, contentRoutes);
app.use('/api/admissions', apiLimiter, admissionsRoutes);
app.use('/api/students', apiLimiter, studentsRoutes);
app.use('/api/inquiries', submissionLimiter, inquiriesRoutes);
app.use('/api/jobs', apiLimiter, jobRoutes);
app.use('/api/job-applications', apiLimiter, jobApplicationRoutes);
app.use('/api/share', require('./routes/share'));
app.use('/api/tenders', apiLimiter, tenderRoutes);
app.use('/api/tender-applications', apiLimiter, tenderApplicationRoutes);
app.use('/api/appointments', submissionLimiter, appointmentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);

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
// ENVIRONMENT VALIDATION
// ============================================
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// ============================================
// INITIALIZATION & EXPORT
// ============================================

/**
 * Main application entry point optimized for both long-running servers and serverless functions.
 */
const startApp = async () => {
  try {
    // 0. Validate environment
    validateEnvironment();
    console.log('✅ Environment validation completed');

    // Supabase DB is connectionless (REST-based), so no explicit connectDB() needed.

    // 1. Start listener if explicitly running as a standalone server
    if (require.main === module) {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
      
      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully...');
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      });
    }
  } catch (err) {
    console.error(`❌ Application failed to start: ${err.message}`);
    process.exit(1);
  }
};

// Start initialization
startApp();

// CRITICAL for Vercel/Serverless: Export the app object
module.exports = app;
