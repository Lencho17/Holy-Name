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
const Admin = require('./models/Admin');
const SiteContent = require('./models/SiteContent');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const admissionsRoutes = require('./routes/admissions');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to load from frontend
  contentSecurityPolicy: false, // disable for dev flexibility; tighten in production
}));

// CORS — restrict in production, open in dev
const corsOptions = {
  origin: isProduction
    ? [process.env.CLIENT_URL, 'https://www.holynameschool.edu'].filter(Boolean)
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

// Gzip compression for responses
app.use(compression());

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

[uploadsDir, contentUploadsDir, admissionsUploadsDir].forEach((dir) => {
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
app.use('/api/admissions', apiLimiter, admissionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() });
});

// ============================================
// API ROOT
// ============================================

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
// SEED DATA
// ============================================

const defaultSiteContent = {
  gallery: [
    { id: 1, category: "Academic Events", title: "Science Exhibition 2023", src: "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800&auto=format&fit=crop&q=60", featured: true, description: "Students demonstrating their innovative physics projects to visitors." },
    { id: 2, category: "Sports", title: "Annual Sports Day", src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60", featured: false, description: "A high-energy day of track and field events with full student participation." },
    { id: 3, category: "Campus Life", title: "Morning Assembly", src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=60", featured: true, description: "Starting our day with prayer, discipline, and important school announcements." },
    { id: 4, category: "Cultural Programs", title: "Foundation Day Celebration", src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60", featured: false, description: "Celebrating our school's legacy with vibrant dance and music performances." },
  ],
  events: [
    { id: 1, title: "Teachers Day Celebration", date: "Sept 5, 2025", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600", description: "A day dedicated to honoring our mentors with heartfelt performances and special tokens of appreciation." },
    { id: 2, title: "Lachit Diwas", date: "Nov 24, 2025", image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600", description: "Celebrating the bravery of the legendary Ahom General Lachit Borphukan with patriotic songs and speeches." },
    { id: 3, title: "Independence Day", date: "Aug 15, 2025", image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=600", description: "The tricolor flies high as we celebrate our nation's freedom with parades and cultural programs." },
    { id: 4, title: "Republic Day", date: "Jan 26, 2026", image: "https://images.unsplash.com/photo-1599508704512-2f19fe9191d8?w=600", description: "Honoring our constitution with a grand flag hoisting ceremony and traditional dance performances." },
  ],
  highlights: [
    { id: 1, title: "Annual Science Exhibition 2026", date: "March 15, 2026", category: "Academic", image: "/Pictures/1.JPG", description: "Students showcased groundbreaking projects in robotics, green energy, and biotechnology." },
    { id: 2, title: "State Level Sports Championship", date: "February 28, 2026", category: "Sports", image: "/Pictures/2.JPG", description: "Our school team won the overall championship trophy with 15 gold medals." },
    { id: 3, title: "Cultural Fest 'Symphony'", date: "January 20, 2026", category: "Cultural", image: "/Pictures/3.JPG", description: "A mesmerizing evening of classical dance, music, and theatrical performances." },
  ],
  videos: [],
  faculty: {
    Guest: [
      { id: 1, name: "John Doe", title: "Visiting Professor", EduQua: "PhD", Subject: "Guest Lectures", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop" },
    ],
    Science: [
      { id: 2, name: "Mrs. Dristiraj Das", title: "6+ yrs exp", EduQua: "MSc Physics", Subject: "Physics", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop" },
    ],
    Arts: [
      { id: 10, name: "Mrs. Labhinaa Chutia", title: "6+ yrs exp", EduQua: "MA", Subject: "Geography", photo: "https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=300&auto=format&fit=crop" },
    ],
  },
  principal: {
    name: "Fr. Hemanta Pegu",
    title: "Principal",
    introQuote: "Flowers leave part of their fragrance in the hand that bestows them",
    message: "Holy Name HS School, Cherekapar Sivasagar, has been renowned not only for its academic excellence but also for its focus on moral and character development.",
    closingQuote: "Aristotle once said, \"Educating the mind without educating the heart is no education at all.\"",
    photo: "",
    signature: "https://via.placeholder.com/150x50",
  },
};

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  await connectDB();

  // Seed default admin
  // Seed default superadmin if no admins or if this specific account is missing/not superadmin
  const defaultEmail = 'narayanphukan30@gmail.com';
  let defaultAdmin = await Admin.findOne({ email: defaultEmail });
  
  if (!defaultAdmin) {
    await Admin.create({
      email: defaultEmail,
      password: 'admin123',
      name: 'Super Admin',
      role: 'superadmin'
    });
    console.log(`🔐 Default Super Admin created: ${defaultEmail} / admin123`);
  } else if (defaultAdmin.role !== 'superadmin') {
    await Admin.updateOne(
      { email: defaultEmail },
      { $set: { role: 'superadmin' } }
    );
    console.log(`🔐 Elevated ${defaultEmail} to Super Admin`);
  }

  // Seed default site content
  const contentCount = await SiteContent.countDocuments();
  if (contentCount === 0) {
    await SiteContent.create(defaultSiteContent);
    console.log('📦 Default site content seeded');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} host 0.0.0.0`);
  });
};

startServer();
