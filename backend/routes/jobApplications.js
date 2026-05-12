const express = require('express');
const supabase = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiters');
const { transporter } = require('../utils/mailer');

const router = express.Router();

const sendApplicationEmail = async (appData) => {
  try {
    const { data: settings } = await supabase.from('site_settings').select('notification_email').limit(1).maybeSingle();
    const receiverEmail = settings?.notification_email || process.env.EMAIL_RECEIVER || 'office@lenchosolutions.com';

    const mailOptions = {
      from: `"Holy Name Recruitment" <${process.env.EMAIL_USER}>`,
      to: receiverEmail,
      subject: `New Job Application: ${appData.reference_number}`,
      html: `
        <h2>New Job Application Received</h2>
        <p><strong>Reference Number:</strong> ${appData.reference_number}</p>
        <p><strong>Applicant Name:</strong> ${appData.full_name}</p>
        <p><strong>Qualification:</strong> ${appData.qualification}</p>
        <p><strong>Experience:</strong> ${appData.is_experienced ? `${appData.total_experience} Years` : 'Fresher'}</p>
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

const { upload, uploadToCloudinary } = require('../middleware/upload');

// @desc    Submit a job application
// @route   POST /api/job-applications
// @access  Public
router.post('/', (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return next();
  }

  const uploadFields = upload.fields([
    { name: 'marksheet10', maxCount: 1 },
    { name: 'cert10', maxCount: 1 },
    { name: 'marksheet12', maxCount: 1 },
    { name: 'cert12', maxCount: 1 },
    { name: 'marksheetUG', maxCount: 1 },
    { name: 'certUG', maxCount: 1 },
    { name: 'marksheetPG', maxCount: 1 },
    { name: 'certPG', maxCount: 1 },
    { name: 'marksheetBEd', maxCount: 1 },
    { name: 'certBEd', maxCount: 1 },
    { name: 'marksheetDLed', maxCount: 1 },
    { name: 'certDLed', maxCount: 1 },
    { name: 'expCertificate', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'casteCertificate', maxCount: 1 }
  ]);

  uploadFields(req, res, (err) => {
    if (err) {
      console.error('Multer Upload Error:', err);
      if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Ensure files are under 5MB each.' });
      }
      return res.status(400).json({ success: false, message: 'File upload failed', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const crypto = require('crypto');
    const refNum = `JOB-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Extract file URLs from direct JSON payload
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      const urlFields = [
        'marksheet10', 'cert10', 'marksheet12', 'cert12', 'marksheetUG', 'certUG',
        'marksheetPG', 'certPG', 'marksheetBEd', 'certBEd', 'marksheetDLed', 'certDLed',
        'expCertificate', 'resume', 'photo', 'signature', 'casteCertificate'
      ];
      urlFields.forEach(field => {
        if (req.body[`${field}Url`]) {
          req.body[field] = req.body[`${field}Url`];
        }
      });
    } else {
      // Legacy multipart logic
      if (req.files) {
        const uploadPromises = Object.keys(req.files).map(async (key) => {
          const file = req.files[key][0];
          const publicUrl = await uploadToCloudinary(file, undefined, 'recruitment');
          req.body[key] = publicUrl;
        });
        await Promise.all(uploadPromises);
      }
    }

    const applicationData = {
      reference_number: refNum,
      full_name: req.body.fullName,
      dob: req.body.dob,
      age: req.body.age ? parseInt(req.body.age) : null,
      gender: req.body.gender,
      qualification: req.body.qualification,
      is_experienced: req.body.isExperienced === 'true' || req.body.isExperienced === true,
      total_experience: req.body.totalExperience ? parseFloat(req.body.totalExperience) || 0 : 0,
      udise_code: req.body.udiseCode,
      aadhar: req.body.aadhar,
      pan: req.body.pan,
      email: req.body.email,
      phone: req.body.phone,
      caste: req.body.caste,
      religion: req.body.religion,
      address: req.body.address,
      marksheet10: req.body.marksheet10,
      cert10: req.body.cert10,
      marksheet12: req.body.marksheet12,
      cert12: req.body.cert12,
      exp_certificate: req.body.expCertificate,
      resume: req.body.resume,
      photo: req.body.photo,
      signature: req.body.signature,
      caste_certificate: req.body.casteCertificate,
      status: 'pending'
    };

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) throw error;
    
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

// @desc    Export all job applications to XLS
router.get('/export', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
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
          <td class="text">${a.reference_number || ''}</td>
          <td>${a.full_name || ''}</td>
          <td>${a.dob || ''}</td>
          <td>${a.age || ''}</td>
          <td>${a.gender || ''}</td>
          <td>${a.qualification || ''}</td>
          <td>${a.is_experienced ? 'YES' : 'NO'}</td>
          <td>${a.total_experience || ''}</td>
          <td class="text">${a.udise_code || ''}</td>
          <td class="text">${a.aadhar || ''}</td>
          <td class="text">${a.pan || ''}</td>
          <td>${a.email || ''}</td>
          <td class="text">${a.phone || ''}</td>
          <td>${a.caste || ''}</td>
          <td>${a.religion || ''}</td>
          <td>${a.address || ''}</td>
          <td>${a.status || ''}</td>
          <td>${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const fileName = `job_applications_export_${new Date().toISOString().split('T')[0]}.xls`;
    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(html);
  } catch (error) {
    console.error('Export Job Applications Error:', error.message);
    res.status(500).json({ message: 'Failed to export job applications', error: error.message });
  }
});

// @desc    Track a job application by reference number (Public)
// @route   GET /api/job-applications/track/:refNumber
// @access  Public
router.get('/track/:refNumber', async (req, res) => {
  try {
    const { refNumber } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for tracking' });
    }

    const { data: application, error } = await supabase
      .from('job_applications')
      .select('reference_number, full_name, status, created_at')
      .eq('reference_number', refNumber.toUpperCase())
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;

    if (!application) {
      return res.status(404).json({ message: 'No application found with the given Reference ID and Email.' });
    }

    res.json({
      referenceNumber: application.reference_number,
      applicantName: application.full_name,
      status: application.status,
      createdAt: application.created_at
    });
  } catch (error) {
    console.error('Track Job Application Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all job applications
router.get('/', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { data: applications, error } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update application status
router.patch('/:id/status', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    const { data: application, error } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete multiple applications
router.delete('/bulk', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }
    const { error } = await supabase.from('job_applications').delete().in('id', ids);
    if (error) throw error;
    res.json({ message: `${ids.length} applications deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Bulk deletion failed', error: error.message });
  }
});

// @desc    Delete application
router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { error } = await supabase.from('job_applications').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
