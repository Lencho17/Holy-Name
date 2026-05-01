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
      subject: `New Job Application: ${appData.referenceNumber}`,
      html: `
        <h2>New Job Application Received</h2>
        <p><strong>Reference Number:</strong> ${appData.referenceNumber}</p>
        <p><strong>Applicant Name:</strong> ${appData.fullName}</p>
        <p><strong>Qualification:</strong> ${appData.qualification}</p>
        <p><strong>Experience:</strong> ${appData.isExperienced ? `${appData.totalExperience} Years` : 'Fresher'}</p>
        <p><strong>Contact:</strong> ${appData.phone} | ${appData.email}</p>
        <p>View all applications in the Admin Dashboard.</p>
        <p><a href="${process.env.CLIENT_URL}/admin">Go to Admin Dashboard</a></p>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send recruitment alert email:', err.message);
  }
};

// @desc    Submit a job application
// @route   POST /api/job-applications
// @access  Public
router.post('/', async (req, res) => {
  try {
    // Generate Reference Number
    const lastApp = await JobApplication.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastApp && lastApp.referenceNumber) {
      const lastNum = parseInt(lastApp.referenceNumber.split('-')[2]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const refNum = `JOB-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`;

    const application = new JobApplication({
      ...req.body,
      referenceNumber: refNum
    });

    await application.save();
    
    // Send email alert to admin
    await sendApplicationEmail(application);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      referenceNumber: refNum
    });
  } catch (error) {
    console.error('Job Submission Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @desc    Export all job applications to XLS (Must be before parameterized routes)
router.get('/export', protect, authorize('admin', 'superadmin'), async (req, res) => {
  console.log('Export Job Applications triggered (HTML Table mode)');
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          .text { mso-number-format:"\\@"; }
          th { background-color: #1e3a8a; color: white; font-weight: bold; }
          td, th { border: 0.5pt solid #ccc; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th>Reference Number</th>
            <th>Full Name</th>
            <th>Date of Birth</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Qualification</th>
            <th>Experienced</th>
            <th>Experience (Years)</th>
            <th>UDISE Code</th>
            <th>Aadhar</th>
            <th>PAN</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Caste</th>
            <th>Religion</th>
            <th>Address</th>
            <th>Status</th>
            <th>Application Date</th>
          </tr>
    `;

    applications.forEach(a => {
      html += `
        <tr>
          <td class="text">${a.referenceNumber || ''}</td>
          <td>${a.fullName || ''}</td>
          <td>${a.dob || ''}</td>
          <td>${a.age || ''}</td>
          <td>${a.gender || ''}</td>
          <td>${a.qualification || ''}</td>
          <td>${a.isExperienced ? 'YES' : 'NO'}</td>
          <td>${a.totalExperience || ''}</td>
          <td class="text">${a.udiseCode || ''}</td>
          <td class="text">${a.aadhar || ''}</td>
          <td class="text">${a.pan || ''}</td>
          <td>${a.email || ''}</td>
          <td class="text">${a.phone || ''}</td>
          <td>${a.caste || ''}</td>
          <td>${a.religion || ''}</td>
          <td>${a.address || ''}</td>
          <td>${a.status || ''}</td>
          <td>${a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const fileName = `job_applications_export_${new Date().toISOString().split('T')[0]}.xls`;
    
    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.removeHeader('ETag');

    res.send(html);
  } catch (error) {
    console.error('Export Job Applications Error:', error.message);
    res.status(500).json({ message: 'Failed to export job applications', error: error.message });
  }
});

// @desc    Get all job applications
// @route   GET /api/job-applications
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const applications = await JobApplication.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update application status
// @route   PATCH /api/job-applications/:id/status
// @access  Private (Admin)
router.patch('/:id/status', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete application
// @route   DELETE /api/job-applications/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const application = await JobApplication.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
