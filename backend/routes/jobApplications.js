const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const JobApplication = require('../models/JobApplication');
const SiteContent = require('../models/SiteContent');
const { protect, authorize } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiters');
const { transporter } = require('../utils/mailer');

const router = express.Router();

const sendApplicationEmail = async (appData) => {
  try {
    const siteContent = await SiteContent.findOne();
    const receiverEmail = siteContent?.notificationEmail || process.env.EMAIL_RECEIVER || 'office@lenchosolutions.com';

    const mailOptions = {
      from: `"Holy Name Recruitment" <${process.env.EMAIL_USER}>`,
      to: receiverEmail,
      subject: `New Job Application: ${appData.fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #1e40af;">New Job Application Received</h2>
          <p><strong>Reference:</strong> ${appData.referenceNumber}</p>
          <p><strong>Name:</strong> ${appData.fullName}</p>
          <p><strong>Qualification:</strong> ${appData.qualification}</p>
          <p><strong>Experience:</strong> ${appData.totalExperience}</p>
          <p><strong>Email:</strong> ${appData.email}</p>
          <p><strong>Phone:</strong> ${appData.phone}</p>
          <br/>
          <p><a href="${process.env.CLIENT_URL}/admin" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send application alert email:', err.message);
  }
};

const sendApplicantConfirmationEmail = async (appData) => {
  try {
    const siteContent = await SiteContent.findOne();
    const schoolLogo = siteContent?.schoolProfile?.logo || 'https://holynamehsschool.in/logo.png';
    const schoolName = siteContent?.schoolProfile?.name || 'Holy Name High School';
    const schoolTagline = siteContent?.schoolProfile?.punchLine || 'Excellence in Education';

    const mailOptions = {
      from: `"${schoolName}" <${process.env.EMAIL_USER}>`,
      to: appData.email,
      subject: `Application Received: ${appData.referenceNumber}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #1e3a8a; color: white; padding: 30px; text-align: center;">
            ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 80px; margin-bottom: 15px; border-radius: 8px;">` : ''}
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">${schoolName}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-style: italic;">${schoolTagline}</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e3a8a; margin-top: 0; text-align: center;">Recruitment Acknowledgment</h2>
            <p>Dear <strong>${appData.fullName}</strong>,</p>
            <p>We have successfully received your job application at <strong>${schoolName}</strong>. Thank you for your interest in joining our academic community.</p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: bold;">Your Reference Number</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; color: #1e293b; font-weight: bold; font-family: monospace;">${appData.referenceNumber}</p>
            </div>

            <p>Our recruitment team will review your qualifications and experience. If your profile matches our requirements, we will contact you for a demo class and interview.</p>
            
            <p>In the meantime, feel free to visit our <a href="${process.env.CLIENT_URL || 'https://holynamehsschool.in'}" style="color: #2563eb;">official website</a> to learn more about our school's culture and values.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
            
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              This is an automated confirmation. Please do not reply to this email.<br/>
              &copy; ${new Date().getFullYear()} ${schoolName}, Sivasagar.
            </p>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${appData.email}`);
  } catch (err) {
    console.error('Failed to send applicant confirmation email:', err.message);
  }
};

// Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'holyname/recruitment',
      resource_type: 'auto',
      allowed_formats: ['jpeg', 'jpg', 'png', 'pdf'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for resumes
});

// @desc    Submit job application
// @route   POST /api/job-applications
// @access  Public
router.post(
  '/',
  submissionLimiter,
  upload.fields([
    { name: 'marksheet10', maxCount: 1 }, { name: 'cert10', maxCount: 1 },
    { name: 'marksheet12', maxCount: 1 }, { name: 'cert12', maxCount: 1 },
    { name: 'marksheetUG', maxCount: 1 }, { name: 'certUG', maxCount: 1 },
    { name: 'marksheetPG', maxCount: 1 }, { name: 'certPG', maxCount: 1 },
    { name: 'marksheetBEd', maxCount: 1 }, { name: 'certBEd', maxCount: 1 },
    { name: 'marksheetDLed', maxCount: 1 }, { name: 'certDLed', maxCount: 1 },
    { name: 'expCertificate', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'casteCertificate', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const data = { ...req.body };
      
      // Map file paths
      if (req.files) {
        Object.keys(req.files).forEach(key => {
          data[key] = req.files[key][0].path;
        });
      }

      // Generate Reference
      const year = new Date().getFullYear();
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      data.referenceNumber = `JOB-${year}-${rand}`;

      const application = await JobApplication.create(data);
      
      // Notify Admin & Applicant
      sendApplicationEmail(application);
      sendApplicantConfirmationEmail(application);

      res.status(201).json({ 
        message: 'Application submitted successfully', 
        referenceNumber: application.referenceNumber 
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: err.message });
    }
  }
);

// @desc    Track application status
// @route   GET /api/job-applications/track/:referenceNumber
// @access  Public
router.get('/track/:referenceNumber', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required for tracking.' });
    }

    const application = await JobApplication.findOne({ 
      referenceNumber: req.params.referenceNumber,
      email: email.toLowerCase()
    }).populate('appliedFor', 'title');

    if (!application) {
      return res.status(404).json({ message: 'Application not found with provided Reference Number and Email.' });
    }

    res.json({
      fullName: application.fullName,
      status: application.status,
      appliedForTitle: application.appliedFor?.title || 'General Application',
      createdAt: application.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while tracking application.' });
  }
});

// @desc    Get all applications
// @route   GET /api/job-applications
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update application status
// @route   PATCH /api/job-applications/:id
// @access  Private (Admin)
router.patch('/:id/status', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) return res.status(404).json({ message: 'Not found' });
    res.json(application);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
