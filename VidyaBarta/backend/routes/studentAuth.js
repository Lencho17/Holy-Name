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

    // Find student by email AND school_id
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', rollNumber)
      .eq('school_id', schoolId)
      .single();

    if (error || !student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!student.date_of_birth) {
      return res.status(401).json({ message: 'Date of Birth not registered. Please contact your administrator.' });
    }

    // Check password against date of birth (support YYYY-MM-DD or DDMMYYYY)
    const dobParts = student.date_of_birth.split('-');
    const dobFormatted = dobParts.length === 3 ? `${dobParts[2]}${dobParts[1]}${dobParts[0]}` : null;
    
    const isMatch = (password === student.date_of_birth) || (dobFormatted && password === dobFormatted);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
            grade: student.grade,
            email: student.email,
            school_id: student.school_id
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

    // Find student by email AND school_id
    const { data: student, error } = await supabase
      .from('students')
      .select('id, admission_id, student_name, email, date_of_birth, school_id')
      .eq('email', email)
      .eq('school_id', schoolId)
      .single();

    if (error || !student) {
      return res.status(404).json({ message: 'Student account not found with the provided details.' });
    }

    if (!student.date_of_birth) {
      return res.status(400).json({ message: 'Date of Birth is not registered for your account. Please contact your administrator to reset your password.' });
    }

    if (!student.email) {
      return res.status(400).json({ message: 'No email address registered for your account. Please contact your administrator.' });
    }

    // Format DOB from YYYY-MM-DD to DDMMYYYY
    // Ex: "2005-11-20" -> ["2005", "11", "20"] -> "20112005"
    const parts = student.date_of_birth.split('-');
    if (parts.length !== 3) {
      return res.status(400).json({ message: 'Invalid Date of Birth format in database. Please contact your administrator.' });
    }
    const newPasswordPlain = `${parts[2]}${parts[1]}${parts[0]}`;

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPasswordPlain, salt);

    // Update in database
    const { error: updateError } = await supabase
      .from('students')
      .update({ password: hashedPassword })
      .eq('id', student.id);

    if (updateError) {
      throw updateError;
    }

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

    res.json({ message: `Password reset successfully. An email has been sent to ${student.email}.` });
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
      grade: studentProfile.grade,
      email: studentProfile.email,
      school_id: studentProfile.school_id
    } 
  });
});

module.exports = router;
