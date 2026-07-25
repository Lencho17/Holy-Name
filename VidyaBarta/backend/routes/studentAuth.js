const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { protectStudent } = require('../middleware/auth');
const { sendEmail } = require('../utils/mailer');

// @route   GET /api/student-auth/schools
// @desc    Get list of active schools for login dropdown
// @access  Public
router.get('/schools', async (req, res) => {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name')
      .ilike('status', 'active')
      .order('name');
      
    if (error) throw error;
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ message: 'Server error fetching schools' });
  }
});

// @route   POST /api/student-auth/login
// @desc    Authenticate student & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { rollNumber, password, schoolId } = req.body; // rollNumber from frontend form corresponds to admission_id

    if (!rollNumber || !password || !schoolId) {
      return res.status(400).json({ message: 'Please provide roll number, password, and select a school' });
    }

    // Find students by email or admission_id (case-insensitive)
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .or(`email.ilike."${rollNumber.trim()}",admission_id.eq."${rollNumber.trim()}"`)
      .or(`school_id.eq.${schoolId},school_id.is.null`);

    if (error || !students || students.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let matchedStudent = null;
    const bcrypt = require('bcryptjs');

    for (let currentStudent of students) {
      if (!currentStudent.date_of_birth) continue;

      let isHashMatch = false;
      const cleanPassword = password.trim();

      if (currentStudent.password) {
        isHashMatch = await bcrypt.compare(cleanPassword, currentStudent.password);
        if (!isHashMatch) {
          // Fallback: check if the user typed the generated hex password in uppercase
          isHashMatch = await bcrypt.compare(cleanPassword.toLowerCase(), currentStudent.password);
        }
      }

      // Check password against date of birth (support YYYY-MM-DD or DDMMYYYY)
      const dobParts = currentStudent.date_of_birth.split('-');
      const dobFormatted = dobParts.length === 3 ? `${dobParts[2]}${dobParts[1]}${dobParts[0]}` : null;
      
      const isMatch = isHashMatch || (cleanPassword === currentStudent.date_of_birth) || (dobFormatted && cleanPassword === dobFormatted);

      if (isMatch) {
        matchedStudent = currentStudent;
        break;
      }
    }

    if (!matchedStudent) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const student = matchedStudent;

    // Check Readmission Inactive Logic
    if (student.enrollment_status !== 'inactive' && !student.admission_fee_paid && student.readmission_deadline) {
      const deadlineDate = new Date(student.readmission_deadline);
      const currentDate = new Date();
      // If deadline has passed (start of the day after deadline)
      if (currentDate > new Date(deadlineDate.getTime() + 24 * 60 * 60 * 1000)) {
        await supabase
          .from('students')
          .update({ enrollment_status: 'inactive' })
          .eq('id', student.id);
        student.enrollment_status = 'inactive';
      }
    }

    // Create JWT payload
    const payload = {
      id: student.id,
      rollNumber: student.admission_id,
      school_id: student.school_id
    };

    // Sign Token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // 1 week expiry
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          student: {
            id: student.id,
            name: student.student_name,
            rollNumber: student.admission_id,
            admissionId: student.admission_id,
            grade: student.grade,
            email: student.email,
            school_id: student.school_id,
            admissionFeePaid: student.admission_fee_paid || false,
            readmissionDeadline: student.readmission_deadline || null,
            readmissionVerified: student.readmission_verified || false,
            status: student.enrollment_status
          }
        });
      }
    );
  } catch (error) {
    console.error('Error in student login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/student-auth/reset-password
// @desc    Reset student password to DOB and email them
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, schoolId } = req.body;

    if (!email || !schoolId) {
      return res.status(400).json({ message: 'Please provide email and select a school' });
    }

    // Find students by email or admission_id (case-insensitive)
    const { data: students, error } = await supabase
      .from('students')
      .select('id, admission_id, student_name, email, date_of_birth, school_id')
      .or(`email.ilike."${email.trim()}",admission_id.eq."${email.trim()}"`)
      .or(`school_id.eq.${schoolId},school_id.is.null`);

    if (error || !students || students.length === 0) {
      return res.status(404).json({ message: 'Student account not found with the provided details.' });
    }

    const salt = await bcrypt.genSalt(10);
    let resetCount = 0;

    for (let student of students) {
      if (!student.date_of_birth || !student.email) continue;

      // Format DOB from YYYY-MM-DD to DDMMYYYY
      const parts = student.date_of_birth.split('-');
      if (parts.length !== 3) continue;
      
      const newPasswordPlain = `${parts[2]}${parts[1]}${parts[0]}`;
      const hashedPassword = await bcrypt.hash(newPasswordPlain, salt);

      // Update in database
      await supabase
        .from('students')
        .update({ password: hashedPassword })
        .eq('id', student.id);

      // Send Email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Successful</h2>
          <p>Dear ${student.student_name},</p>
          <p>Your password for the VidyaBarta Student Portal has been successfully reset.</p>
          <p>Your new password is your Date of Birth in <strong>DDMMYYYY</strong> format.</p>
          <p style="font-size: 20px; font-weight: bold; color: #002C98; padding: 15px; background: #f0f4ff; border-radius: 8px; text-align: center;">
            ${newPasswordPlain}
          </p>
          <p>Please log in with this new password. For security reasons, do not share this password with anyone.</p>
          <br/>
          <p>Best regards,<br/>The VidyaBarta Team</p>
        </div>
      `;

      await sendEmail({
        from: `"VidyaBarta Admin" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: 'Your Student Portal Password Has Been Reset',
        html: emailHtml
      });
      
      resetCount++;
    }

    if (resetCount === 0) {
      return res.status(400).json({ message: 'Could not reset password. Date of birth or email may be missing.' });
    }

    res.json({ message: 'Password reset successfully. An email has been sent to your registered address.' });
  } catch (error) {
    console.error('Error in student password reset:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// @route   GET /api/student-auth/profile
// @desc    Get current student profile
// @access  Private (Student)
router.get('/profile', protectStudent, (req, res) => {
  // req.student is populated by the protectStudent middleware
  // Let's not send the password hash back
  const { password, reset_password_token, reset_password_expires, ...studentProfile } = req.student;
  
  // Format for frontend
  res.json({ 
    student: {
      id: studentProfile.id,
      name: studentProfile.student_name,
      rollNumber: studentProfile.admission_id,
      admissionId: studentProfile.admission_id,
      grade: studentProfile.grade,
      email: studentProfile.email,
      school_id: studentProfile.school_id,
      admissionFeePaid: studentProfile.admission_fee_paid || false,
      readmissionDeadline: studentProfile.readmission_deadline || null,
      readmissionVerified: studentProfile.readmission_verified || false,
      status: studentProfile.enrollment_status
    } 
  });
});

module.exports = router;
