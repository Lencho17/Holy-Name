const express = require('express');
const multer = require('multer');
const path = require('path');
const Admission = require('../models/Admission');
const Student = require('../models/Student');
const SiteContent = require('../models/SiteContent');
const { protect } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiters');
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

const sendApplicantConfirmationEmail = async (admissionData) => {
  try {
    const mailOptions = {
      from: `"Holy Name School" <${process.env.EMAIL_USER}>`,
      to: admissionData.email,
      subject: `Admission Application Received: ${admissionData.referenceNumber}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; max-width: 600px; margin: auto; border: 1px solid #1e3a8a; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #1e3a8a; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Holy Name High School</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-style: italic;">Excellence in Education</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Application Received!</h2>
            <p>Dear Parent/Guardian of <strong>${admissionData.studentName}</strong>,</p>
            <p>We are pleased to inform you that we have successfully received your admission application for <strong>${admissionData.gradeApplied.toUpperCase()}</strong> at Holy Name High School.</p>
            
            <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; padding: 20px; margin: 25px 0; text-align: center; border-radius: 10px;">
              <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #1e40af; font-weight: bold; letter-spacing: 1px;">Application Reference Number</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; color: #1e3a8a; font-weight: 900; font-family: 'Courier New', Courier, monospace;">${admissionData.referenceNumber}</p>
            </div>

            <h3 style="color: #1e3a8a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Next Steps:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 10px;">Our admissions team will review the submitted documents.</li>
              <li style="margin-bottom: 10px;">You will receive a notification regarding the entrance test/interview date via email or phone.</li>
              <li>Please keep a printed copy of your acknowledgement receipt for future verification.</li>
            </ul>
            
            <p style="margin-top: 30px;">If you have any urgent queries, please contact our office at <strong>${process.env.OFFICE_PHONE || 'the school office number'}</strong>.</p>
            
            <p style="margin-bottom: 0;">Warm regards,<br/><strong>Admissions Office</strong><br/>Holy Name High School</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              This is an automated message. Please do not reply to this email.<br/>
              &copy; ${new Date().getFullYear()} Holy Name School, Sivasagar.
            </p>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Admission confirmation email sent to ${admissionData.email}`);
  } catch (err) {
    console.error('Failed to send admission confirmation email:', err.message);
  }
};

// --- Multer config for admission documents ---
const { createStorage, getFileUrl, fileFilter } = require('../middleware/upload');

const admissionStorage = createStorage('admissions');
const upload = multer({
  storage: admissionStorage,
  fileFilter,
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
  submissionLimiter,
  upload.fields([
    { name: 'transferCertificate', maxCount: 1 },
    { name: 'marksheet', maxCount: 1 },
    { name: 'aadharVidOrReceipt', maxCount: 1 },
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'casteCertificate', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const validation = require('../utils/validation');
      const data = req.body;

      // Validate required fields
      if (!data.studentName || !data.dateOfBirth || !data.gender || !data.gradeApplied || !data.contactNumber || !data.email || !data.address) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate data formats
      if (!validation.validateEmail(data.email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      if (!validation.validatePhone(data.contactNumber)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }
      if (!validation.validateDateOfBirth(data.dateOfBirth)) {
        return res.status(400).json({ message: 'Invalid date of birth or age out of range' });
      }
      if (!validation.validateGrade(data.gradeApplied)) {
        return res.status(400).json({ message: 'Invalid grade' });
      }
      if (!validation.validateGender(data.gender)) {
        return res.status(400).json({ message: 'Invalid gender' });
      }

      // Sanitize string inputs
      data.studentName = validation.sanitizeString(data.studentName);
      data.address = validation.sanitizeString(data.address);
      data.email = data.email.toLowerCase().trim();
      
      // Validate pincode if provided
      if (data.pincode && !validation.validatePincode(data.pincode)) {
        return res.status(400).json({ message: 'Invalid pincode' });
      }

      // Validate aadhar if provided
      if (data.aadharNumber && !validation.validateAadhar(data.aadharNumber)) {
        return res.status(400).json({ message: 'Invalid Aadhar number' });
      }

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
        if (req.files.casteCertificate) {
          data.casteCertificate = req.files.casteCertificate[0].path;
        }
      }

      if (!data.fatherName && !data.motherName && !data.guardianName) {
        return res.status(400).json({ message: 'At least one of Father, Mother, or Guardian name is required.' });
      }

      // Generate unique reference number using secure random
      const generateRef = () => {
        const year = new Date().getFullYear();
        const crypto = require('crypto');
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `HNS-${year}-${rand}`;
      };
      data.referenceNumber = generateRef();

      const admission = await Admission.create(data);
      
      // Send background email notifications (fire and forget, not blocking)
      Promise.all([
        sendSubmissionEmail(admission),
        sendApplicantConfirmationEmail(admission)
      ]).catch(err => console.error('Email sending failed (non-blocking):', err.message));

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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20); // Max 100 per page
    const skip = (page - 1) * limit;
    const status = req.query.status; // Optional filter
    const search = req.query.search; // Optional search

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const admissions = await Admission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Admission.countDocuments(query);
    
    // Summary Stats
    const totalAccepted = await Admission.countDocuments({ ...query, status: 'accepted' });
    const totalPending = await Admission.countDocuments({ ...query, status: 'pending' });
    
    res.json({
      data: admissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        accepted: totalAccepted,
        pending: totalPending
      }
    });
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
          penNumber: admission.penNumber,
          aadharNumber: admission.aadharNumber,
        });
      }
    }
    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
