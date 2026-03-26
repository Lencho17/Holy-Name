const express = require('express');
const multer = require('multer');
const path = require('path');
const Admission = require('../models/Admission');
const SiteContent = require('../models/SiteContent');
const { protect } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email Transporter (use Gmail/SMTP settings from .env)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service like 'outlook', 'sendgrid' etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSubmissionEmail = async (admissionData) => {
  try {
    // Fetch dynamic receiver email from SiteContent
    const siteContent = await SiteContent.findOne();
    const receiverEmail = siteContent?.notificationEmail || process.env.EMAIL_RECEIVER || 'office@lenchosolutions.com';

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: receiverEmail,
      subject: 'New Student Admission Application - Holy Name School',
      html: `
        <h2>New Admission Application Received</h2>
        <p><strong>Reference Number:</strong> ${admissionData.referenceNumber}</p>
        <p><strong>Student Name:</strong> ${admissionData.studentName}</p>
        <p><strong>Class:</strong> ${admissionData.gradeApplied}</p>
        <p><strong>Guardian Name:</strong> ${admissionData.guardianName}</p>
        <p><strong>Contact Email:</strong> ${admissionData.email}</p>
        <p><strong>Phone:</strong> ${admissionData.contactNumber}</p>
        <p>You can view the full application in the Admin Panel.</p>
        <p><a href="${process.env.CLIENT_URL}/admin">Go to Admin Dashboard</a></p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log('Admission alert email sent.');
  } catch (err) {
    console.error('Failed to send admission alert email:', err.message);
  }
};

// --- Multer config for admission documents ---
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'holyname/admissions',
      resource_type: 'auto', // Support images AND pdfs
      allowed_formats: ['jpeg', 'jpg', 'png', 'pdf'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/admissions — public, submit an application
router.post(
  '/',
  upload.fields([
    { name: 'transferCertificate', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const data = req.body;

      if (req.files) {
        if (req.files.transferCertificate) {
          data.transferCertificate = req.files.transferCertificate[0].path;
        }
        if (req.files.marksheet) {
          data.marksheet = req.files.marksheet[0].path;
        }
      }

      // Generate unique reference number
      const generateRef = () => {
        const year = new Date().getFullYear();
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `HNS-${year}-${rand}`;
      };
      data.referenceNumber = generateRef();

      const admission = await Admission.create(data);
      
      // Send background email notification
      sendSubmissionEmail(admission);

      res.status(201).json({ 
        message: 'Application submitted successfully', 
        id: admission._id,
        referenceNumber: admission.referenceNumber 
      });
    } catch (error) {
      res.status(500).json({ message: 'Submission failed', error: error.message });
    }
  }
);

// GET /api/admissions — protected, list all applications
router.get('/', protect, async (req, res) => {
  try {
    const admissions = await Admission.find().sort({ createdAt: -1 });
    res.json(admissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/admissions/:id — protected, update application status
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!admission) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
