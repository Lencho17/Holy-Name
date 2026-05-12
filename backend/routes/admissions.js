const express = require('express');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');
const { submissionLimiter } = require('../middleware/rateLimiters');
const { transporter } = require('../utils/mailer');
const { upload, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

const sendSubmissionEmail = async (admissionData) => {
  try {
    const { data: settings } = await supabase.from('site_settings').select('notification_email').single();
    const receiverEmail = settings?.notification_email || process.env.EMAIL_RECEIVER || 'office@lenchosolutions.com';

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: receiverEmail,
      subject: 'New Student Admission Application - Holy Name School',
      html: `
        <h2>New Admission Application Received</h2>
        <p><strong>Reference Number:</strong> ${admissionData.reference_number}</p>
        <p><strong>Student Name:</strong> ${admissionData.student_name}</p>
        <p><strong>Class:</strong> ${admissionData.grade_applied}</p>
        <p><strong>Guardian Name:</strong> ${admissionData.guardian_name}</p>
        <p><strong>Contact Email:</strong> ${admissionData.email}</p>
        <p><strong>Phone:</strong> ${admissionData.contact_number}</p>
        <p>You can view the full application in the Admin Panel.</p>
        <p><a href="${process.env.CLIENT_URL}/admin">Go to Admin Dashboard</a></p>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send admission alert email:', err.message);
  }
};

const sendApplicantConfirmationEmail = async (admissionData) => {
  try {
    const { data: settings } = await supabase.from('site_settings').select('school_name, school_logo, school_tagline').single();
    const schoolLogo = settings?.school_logo || 'https://holynamehsschool.in/logo.png';
    const schoolName = settings?.school_name || 'Holy Name High School';
    const schoolTagline = settings?.school_tagline || 'Excellence in Education';

    const mailOptions = {
      from: `"${schoolName}" <${process.env.EMAIL_USER}>`,
      to: admissionData.email,
      subject: `Admission Application Received: ${admissionData.reference_number}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; max-width: 600px; margin: auto; border: 1px solid #1e3a8a; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #1e3a8a; color: white; padding: 30px; text-align: center;">
            ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 80px; margin-bottom: 15px; border-radius: 8px;">` : ''}
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">${schoolName}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-style: italic;">${schoolTagline}</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Application Received!</h2>
            <p>Dear Parent/Guardian of <strong>${admissionData.student_name}</strong>,</p>
            <p>We are pleased to inform you that we have successfully received your admission application for <strong>${admissionData.grade_applied?.toUpperCase()}</strong> at ${schoolName}.</p>
            
            <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; padding: 20px; margin: 25px 0; text-align: center; border-radius: 10px;">
              <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #1e40af; font-weight: bold; letter-spacing: 1px;">Application Reference Number</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; color: #1e3a8a; font-weight: 900; font-family: 'Courier New', Courier, monospace;">${admissionData.reference_number}</p>
            </div>

            <h3 style="color: #1e3a8a; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Next Steps:</h3>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 10px;">Our admissions team will review the submitted documents.</li>
              <li style="margin-bottom: 10px;">You will receive a notification regarding the entrance test/interview date via email or phone.</li>
              <li>Please keep a printed copy of your acknowledgement receipt for future verification.</li>
            </ul>
            
            <p style="margin-top: 30px;">Warm regards,<br/><strong>Admissions Office</strong><br/>${schoolName}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              This is an automated message. Please do not reply to this email.<br/>
              &copy; ${new Date().getFullYear()} ${schoolName}, Sivasagar.
            </p>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send admission confirmation email:', err.message);
  }
};

const sendStatusUpdateEmail = async (admissionData, newStatus) => {
  try {
    const { data: settings } = await supabase.from('site_settings').select('school_name, school_logo, school_tagline').single();
    const schoolLogo = settings?.school_logo || 'https://holynamehsschool.in/logo.png';
    const schoolName = settings?.school_name || 'Holy Name High School';
    const schoolTagline = settings?.school_tagline || 'Excellence in Education';

    const statusLabels = {
      'entrance-exam': 'Entrance Exam Scheduled',
      'interview': 'Interview Scheduled',
      'accepted': 'Application Accepted',
      'rejected': 'Application Update'
    };

    const statusMessages = {
      'entrance-exam': `We are pleased to inform you that your application has been shortlisted for the <strong>Entrance Examination</strong>. Our office will contact you shortly with the date, time, and venue details.`,
      'interview': `Congratulations! Your ward has cleared the initial assessment and is now invited for a <strong>Personal Interview</strong>. Please ensure both parents attend along with the student and all original documents.`,
      'accepted': `We are delighted to welcome you to the ${schoolName} family! Your admission application has been <strong>Accepted</strong>. Please visit the school office within the next 3 working days to complete the enrollment formalities and fee payment.`,
      'rejected': `Thank you for your interest in ${schoolName}. After careful review, we regret to inform you that we are unable to offer admission at this time. We wish you the very best in your future academic endeavors.`
    };

    const mailOptions = {
      from: `"${schoolName} Admissions" <${process.env.EMAIL_USER}>`,
      to: admissionData.email,
      subject: `Application Update: ${admissionData.reference_number} - ${statusLabels[newStatus] || 'Holy Name School'}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #444; max-width: 600px; margin: auto; border: 1px solid #1e3a8a; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #1e3a8a; color: white; padding: 30px; text-align: center;">
            ${schoolLogo ? `<img src="${schoolLogo}" alt="${schoolName}" style="max-height: 80px; margin-bottom: 15px; border-radius: 8px;">` : ''}
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">${schoolName}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-style: italic;">${schoolTagline}</p>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e3a8a; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Application Status Updated</h2>
            <p>Dear Parent/Guardian of <strong>${admissionData.student_name}</strong>,</p>
            <p>This is to inform you that there has been an update to your admission application (Ref: <strong>${admissionData.reference_number}</strong>).</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 20px; margin: 25px 0; border-radius: 0 10px 10px 0;">
              <p style="margin: 0; font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Current Status:</p>
              <p style="margin: 5px 0 10px 0; font-size: 20px; font-weight: 800; color: #111;">${statusLabels[newStatus]?.toUpperCase() || newStatus.toUpperCase()}</p>
              <p style="margin: 0; font-size: 15px; color: #4b5563;">${statusMessages[newStatus] || 'Your application is currently being processed.'}</p>
              
              ${admissionData.status_date ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 11px;">Scheduled Date & Time:</p>
                  <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 700;">${admissionData.status_date}</p>
                </div>
              ` : ''}

              ${admissionData.status_remark ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-weight: bold; color: #1e3a8a; text-transform: uppercase; font-size: 11px;">Note / Remark:</p>
                  <p style="margin: 5px 0 0 0; font-size: 15px; color: #4b5563; font-style: italic;">"${admissionData.status_remark}"</p>
                </div>
              ` : ''}
            </div>

            <p>Sincerely,<br/><strong>Admissions Department</strong><br/>${schoolName}</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              &copy; ${new Date().getFullYear()} ${schoolName}, Sivasagar. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send status update email:', err.message);
  }
};

// --- Admission Routes ---

// GET /api/admissions/export — protected, export applications to XLS (supports class & status filters)
router.get('/export', protect, async (req, res) => {
  try {
    const { class: classFilter, status: statusFilter } = req.query;
    let query = supabase.from('admissions').select('*');

    if (classFilter && classFilter !== 'All') {
      query = query.ilike('grade_applied', `${classFilter}%`);
    }
    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }

    const { data: applications, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    const classLabel = classFilter && classFilter !== 'All' ? `_${classFilter}` : '_ALL';
    const statusLabel = statusFilter && statusFilter !== 'All' ? `_${statusFilter}` : '';
    const fileName = `admissions${classLabel}${statusLabel}_${new Date().toISOString().split('T')[0]}.xls`;

    // Create HTML Table for Excel
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
            <th>Student Name</th>
            <th>Date of Birth</th>
            <th>Class Applied</th>
            <th>Gender</th>
            <th>Religion</th>
            <th>Caste</th>
            <th>Previous School</th>
            <th>Prev Marks Obtained</th>
            <th>Last Attended Exam</th>
            <th>Prev Percentage</th>
            <th>Father Name</th>
            <th>Father Occupation</th>
            <th>Mother Name</th>
            <th>Mother Occupation</th>
            <th>Guardian Name</th>
            <th>Contact Number</th>
            <th>Email</th>
            <th>Address</th>
            <th>PO</th>
            <th>PS</th>
            <th>Pincode</th>
            <th>Aadhar Number</th>
            <th>PEN Number</th>
            <th>Stream</th>
            <th>Elective Subjects</th>
            <th>MIL</th>
            <th>DARPAN ID</th>
            <th>Board Marks</th>
            <th>Board Percentage</th>
            <th>Board Division</th>
            <th>NCC Interest</th>
            <th>Sports Active</th>
            <th>Sports Type</th>
            <th>Status</th>
            <th>Application Date</th>
          </tr>
    `;

    applications.forEach(a => {
      html += `
        <tr>
          <td class="text">${a.reference_number || ''}</td>
          <td>${a.student_name || ''}</td>
          <td>${a.date_of_birth || ''}</td>
          <td>${(a.grade_applied || '').toUpperCase()}</td>
          <td>${a.gender || ''}</td>
          <td>${a.religion || ''}</td>
          <td>${a.caste || ''}</td>
          <td>${a.previous_school || ''}</td>
          <td>${a.prev_marks_obtained || ''}</td>
          <td>${a.last_attended_exam || ''}</td>
          <td>${a.prev_percentage || ''}</td>
          <td>${a.father_name || ''}</td>
          <td>${a.father_occupation || ''}</td>
          <td>${a.mother_name || ''}</td>
          <td>${a.mother_occupation || ''}</td>
          <td>${a.guardian_name || ''}</td>
          <td class="text">${a.contact_number || ''}</td>
          <td>${a.email || ''}</td>
          <td>${a.address || ''}</td>
          <td>${a.po || ''}</td>
          <td>${a.ps || ''}</td>
          <td class="text">${a.pincode || ''}</td>
          <td class="text">${a.aadhar_number || ''}</td>
          <td class="text">${a.pen_number || ''}</td>
          <td>${a.stream || ''}</td>
          <td>${(a.selected_subjects || []).join(', ')}</td>
          <td>${a.mil || ''}</td>
          <td class="text">${a.darpan_id || ''}</td>
          <td>${a.board_marks || ''}</td>
          <td>${a.board_percentage || ''}</td>
          <td>${a.board_division || ''}</td>
          <td>${a.ncc_interest ? 'Yes' : 'No'}</td>
          <td>${a.sports_active ? 'Yes' : 'No'}</td>
          <td>${a.sports_type || ''}</td>
          <td>${a.status || ''}</td>
          <td>${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    res.set('Content-Type', 'application/vnd.ms-excel');
    res.set('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(html);
  } catch (error) {
    console.error('Export Admissions Error:', error.message);
    res.status(500).json({ message: 'Failed to export admissions', error: error.message });
  }
});

// GET /api/admissions/status — public, check application status
router.get('/status', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter required' });

    const { data: application, error } = await supabase
      .from('admissions')
      .select('*')
      .or(`reference_number.eq.${q.toUpperCase()},email.eq.${q.toLowerCase()}`)
      .maybeSingle();

    if (error || !application) {
      return res.status(404).json({ message: 'No application found with these details.' });
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============================================
// SHARED: Build the database record from input
// ============================================
const buildAdmissionRecord = (input, filesData = {}) => {
  // Define standard fields we expect
  const standardFields = [
    'studentName', 'dateOfBirth', 'placeOfBirth', 'gender', 'religion', 'bloodGroup',
    'caste', 'previousSchool', 'prevMarksObtained', 'lastAttendedExam', 'prevPercentage',
    'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation', 'guardianName',
    'relationship', 'contactNumber', 'email', 'address', 'po', 'ps', 'pincode',
    'aadharNumber', 'AadhaarNumber', 'penNumber', 'gradeApplied', 'stream', 'elective',
    'selectedSubjects', 'mil', 'darpanId', 'boardMarks', 'boardPercentage',
    'boardDivision', 'nccInterest', 'sportsActive', 'sportsType', 'upiTransactionId',
    // Document URL fields (sent by direct-upload flow)
    'transferCertificateUrl', 'marksheetUrl', 'AadhaarVidOrReceiptUrl',
    'studentPhotoUrl', 'birthCertificateUrl', 'casteCertificateUrl',
    'paymentReceiptUrl', 'admitCardUrl', 'registrationCardUrl'
  ];

  // Collect any "Dynamic" fields (anything not in standardFields)
  const additionalInfo = {};
  Object.keys(input).forEach(key => {
    if (!standardFields.includes(key)) {
      additionalInfo[key] = input[key];
    }
  });

  return {
    reference_number: `HNS-${new Date().getFullYear()}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`,
    student_name: (input.studentName || '').toUpperCase().trim(),
    date_of_birth: input.dateOfBirth,
    place_of_birth: (input.placeOfBirth || '').toUpperCase().trim(),
    gender: (input.gender || '').toUpperCase(),
    religion: (input.religion || '').toUpperCase().trim(),
    blood_group: (input.bloodGroup || '').toUpperCase().trim(),
    caste: (input.caste || '').toUpperCase().trim(),
    previous_school: (input.previousSchool || '').toUpperCase().trim(),
    prev_marks_obtained: input.prevMarksObtained,
    last_attended_exam: (input.lastAttendedExam || '').toUpperCase().trim(),
    prev_percentage: input.prevPercentage,
    father_name: (input.fatherName || '').toUpperCase().trim(),
    father_occupation: (input.fatherOccupation || '').toUpperCase().trim(),
    mother_name: (input.motherName || '').toUpperCase().trim(),
    mother_occupation: (input.motherOccupation || '').toUpperCase().trim(),
    guardian_name: (input.guardianName || '').toUpperCase().trim(),
    relationship: (input.relationship || '').toUpperCase().trim(),
    contact_number: input.contactNumber,
    email: (input.email || '').toLowerCase().trim(),
    address: (input.address || '').toUpperCase().trim(),
    po: (input.po || '').toUpperCase().trim(),
    ps: (input.ps || '').toUpperCase().trim(),
    pincode: input.pincode,
    aadhar_number: input.AadhaarNumber || input.aadharNumber,
    pen_number: (input.penNumber || '').toUpperCase().trim(),
    grade_applied: (input.gradeApplied || '').toUpperCase(),
    stream: (input.stream || '').toUpperCase(),
    elective: (input.elective || '').toUpperCase(),
    selected_subjects: Array.isArray(input.selectedSubjects)
      ? input.selectedSubjects.map(s => s.toUpperCase())
      : input.selectedSubjects,
    mil: (input.mil || '').toUpperCase(),
    darpan_id: (input.darpanId || '').toUpperCase().trim(),
    board_marks: input.boardMarks,
    board_percentage: input.boardPercentage,
    board_division: (input.boardDivision || '').toUpperCase().trim(),
    ncc_interest: input.nccInterest === 'true' || input.nccInterest === true,
    sports_active: input.sportsActive === 'true' || input.sportsActive === true,
    sports_type: (input.sportsType || '').toUpperCase().trim(),
    upi_transaction_id: (input.upiTransactionId || '').toUpperCase().trim(),
    status: 'pending',
    additional_info: additionalInfo,
    // Merge file URLs (from either multipart or direct-upload)
    ...filesData
  };
};

// Validate required admission fields
const validateAdmissionInput = (input) => {
  const missingFields = [];
  if (!input.studentName) missingFields.push('studentName');
  if (!input.dateOfBirth) missingFields.push('dateOfBirth');
  if (!input.gender) missingFields.push('gender');
  if (!input.gradeApplied) missingFields.push('gradeApplied');
  if (!input.contactNumber) missingFields.push('contactNumber');
  if (!input.email) missingFields.push('email');
  if (!input.address) missingFields.push('address');
  return missingFields;
};

// POST /api/admissions — public, submit an application
// Supports TWO modes:
//   1. multipart/form-data (legacy) — files uploaded through server → Cloudinary
//   2. application/json (new) — files pre-uploaded to Cloudinary by frontend, URLs sent as JSON
router.post(
  '/',
  submissionLimiter,
  (req, res, next) => {
    // If the request is JSON (direct-upload flow), skip multer entirely
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      return next();
    }

    // Legacy multipart flow: wrap multer to catch upload errors gracefully
    const uploadFields = upload.fields([
      { name: 'transferCertificate', maxCount: 1 },
      { name: 'marksheet', maxCount: 1 },
      { name: 'AadhaarVidOrReceipt', maxCount: 1 },
      { name: 'studentPhoto', maxCount: 1 },
      { name: 'birthCertificate', maxCount: 1 },
      { name: 'casteCertificate', maxCount: 1 },
      { name: 'paymentReceipt', maxCount: 1 },
      { name: 'admitCard', maxCount: 1 },
      { name: 'registrationCard', maxCount: 1 }
    ]);
    uploadFields(req, res, (err) => {
      if (err) {
        console.error('[Upload Error]:', err.message);
        if (err.name === 'MulterError') {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Please ensure files are under 5MB each.' });
          }
          return res.status(400).json({ message: `File upload error: ${err.message}` });
        }
        return res.status(400).json({ message: `Document upload failed: ${err.message}` });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const input = req.body;

      // Validate required fields
      const missingFields = validateAdmissionInput(input);
      if (missingFields.length > 0) {
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}`, fields: missingFields });
      }

      // Build file URLs map
      const filesData = {};

      // Check if this is a JSON request with pre-uploaded Cloudinary URLs
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        // Direct-upload flow: extract URLs from the JSON body
        const urlFieldMap = {
          'transferCertificateUrl': 'transfer_certificate',
          'marksheetUrl': 'marksheet',
          'AadhaarVidOrReceiptUrl': 'aadhar_vid_or_receipt',
          'studentPhotoUrl': 'student_photo',
          'birthCertificateUrl': 'birth_certificate',
          'casteCertificateUrl': 'caste_certificate',
          'paymentReceiptUrl': 'payment_receipt',
          'admitCardUrl': 'admit_card',
          'registrationCardUrl': 'registration_card'
        };
        Object.entries(urlFieldMap).forEach(([jsonKey, dbKey]) => {
          if (input[jsonKey]) {
            filesData[dbKey] = input[jsonKey];
          }
        });
      } else if (req.files) {
        // Legacy multipart flow: upload files through server to Cloudinary
        const uploadPromises = Object.keys(req.files).map(async (key) => {
          const file = req.files[key][0];
          const publicUrl = await uploadToCloudinary(file, undefined, 'admissions');
          const mappedKey = {
            'transferCertificate': 'transfer_certificate',
            'marksheet': 'marksheet',
            'AadhaarVidOrReceipt': 'aadhar_vid_or_receipt',
            'studentPhoto': 'student_photo',
            'birthCertificate': 'birth_certificate',
            'casteCertificate': 'caste_certificate',
            'paymentReceipt': 'payment_receipt',
            'admitCard': 'admit_card',
            'registrationCard': 'registration_card'
          }[key] || key;
          filesData[mappedKey] = publicUrl;
        });
        await Promise.all(uploadPromises);
      }

      // Build and insert the record
      const data = buildAdmissionRecord(input, filesData);

      const { data: admission, error: insertError } = await supabase
        .from('admissions')
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      // Notifications (fire-and-forget)
      Promise.all([
        sendSubmissionEmail(admission),
        sendApplicantConfirmationEmail(admission)
      ]).catch(err => console.error('Email sending failed:', err.message));

      res.status(201).json({
        message: 'Application submitted successfully',
        id: admission.id,
        referenceNumber: admission.reference_number
      });
    } catch (error) {
      console.error('Submission Error:', error);
      res.status(500).json({ message: 'Submission failed', error: error.message });
    }
  }
);

// PATCH /api/admissions/:id/status — protected, update application status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, statusRemark, statusDate } = req.body;
    const { data: admission, error } = await supabase
      .from('admissions')
      .update({ 
        status, 
        status_remark: statusRemark, 
        status_date: statusDate 
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !admission) {
      return res.status(404).json({ message: 'Application not found' });
    }

    sendStatusUpdateEmail(admission, status);

    if (status === 'accepted') {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('admission_id', admission.id)
        .maybeSingle();

      if (!existingStudent) {
        await supabase.from('students').insert({
          student_name: admission.student_name,
          date_of_birth: admission.date_of_birth,
          gender: admission.gender,
          grade: admission.grade_applied,
          guardian_name: admission.guardian_name,
          contact_number: admission.contact_number,
          email: admission.email,
          address: admission.address,
          admission_id: admission.id,
          pen_number: admission.pen_number,
          aadhar_number: admission.aadhar_number,
        });
      }
    }
    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admissions — protected, list all applications
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    let query = supabase.from('admissions').select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`student_name.ilike.%${search}%,reference_number.ilike.%${search}%,email.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }
    
    const { data: admissions, count, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    // Summary Stats
    const { count: acceptedCount } = await supabase.from('admissions').select('id', { count: 'exact', head: true }).eq('status', 'accepted');
    const { count: pendingCount } = await supabase.from('admissions').select('id', { count: 'exact', head: true }).eq('status', 'pending');
    
    res.json({
      data: admissions,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      },
      stats: {
        total: count,
        accepted: acceptedCount || 0,
        pending: pendingCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/admissions/bulk — protected, delete multiple applications
router.delete('/bulk', protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No IDs provided' });
    }
    const { error } = await supabase.from('admissions').delete().in('id', ids);
    if (error) throw error;
    res.json({ message: `${ids.length} applications deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Bulk deletion failed', error: error.message });
  }
});

// DELETE /api/admissions/:id — protected, delete application
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase.from('admissions').delete().eq('id', req.params.id);
    if (error) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
