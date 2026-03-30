const rateLimit = require('express-rate-limit');
require('dotenv').config();

// General API rate limiter (1000 req/min)
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect auth endpoints from brute force (10 req/15min)
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_LIMIT_MAX) || 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // MORE STRICT: Limit is per IP, but fail safer on registration
    return false;
  }
});

// Sensitive submission rate limiter (Forms/Contact) (50 req/hour)
const submissionLimiter = rateLimit({
  windowMs: parseInt(process.env.SUBMISSION_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: parseInt(process.env.SUBMISSION_LIMIT_MAX) || 50,
  message: { message: 'Too many form submissions. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin panel write operations (20 req/min per admin)
const adminLimiter = rateLimit({
  windowMs: parseInt(process.env.ADMIN_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
  max: parseInt(process.env.ADMIN_LIMIT_MAX) || 20,
  message: { message: 'Too many admin operations. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  submissionLimiter,
  adminLimiter
};
