const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { protectStudent } = require('../middleware/auth');

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

    // Find student by admission_id AND school_id
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('admission_id', rollNumber)
      .eq('school_id', schoolId)
      .single();

    if (error || !student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!student.password) {
      return res.status(401).json({ message: 'Account not fully set up. Please check your email for the setup link.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);

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
