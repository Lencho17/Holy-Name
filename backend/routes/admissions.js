const express = require('express');
const multer = require('multer');
const path = require('path');
const Admission = require('../models/Admission');
const Student = require('../models/Student');
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

// GET /api/admissions/status — public, check application status
router.get('/status', async (req, res) => {
  try {
    const { q } = req.query; // referenceNumber or email
    if (!q) {
      return res.status(400).json({ message: 'Query parameter required' });
    }

    const application = await Admission.findOne({
      $or: [
        { referenceNumber: q.toUpperCase() },
        { email: q.toLowerCase() }
      ]
    }).select('studentName gradeApplied status createdAt referenceNumber');

    if (!application) {
      return res.status(404).json({ message: 'No application found with these details.' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/admissions — public, submit an application
router.post(
  '/',
  upload.fields([
    { name: 'transferCertificate', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
    { name: 'aadharVidOrReceipt', maxCount: 1 },
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
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
        if (req.files.aadharVidOrReceipt) {
          data.aadharVidOrReceipt = req.files.aadharVidOrReceipt[0].path;
        }
        if (req.files.studentPhoto) {
          data.studentPhoto = req.files.studentPhoto[0].path;
        }
        if (req.files.birthCertificate) {
          data.birthCertificate = req.files.birthCertificate[0].path;
        }
      }

      if (!data.fatherName && !data.motherName && !data.guardianName) {
        return res.status(400).json({ message: 'At least one of Father, Mother, or Guardian name is required.' });
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

    // If application is accepted, create a student record if it doesn't exist
    if (status === 'accepted') {
      const existingStudent = await Student.findOne({ admissionId: admission._id });
      if (!existingStudent) {
        await Student.create({
          studentName: admission.studentName,
          dateOfBirth: admission.dateOfBirth,
          gender: admission.gender,
          grade: admission.gradeApplied,
          guardianName: admission.guardianName,
          contactNumber: admission.contactNumber,
          email: admission.email,
          address: admission.address,
          admissionId: admission._id,
        });
      }
    }
    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
