const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Email Transporter (use Gmail/SMTP settings from .env)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/request-otp (only superadmins)
router.post('/request-otp', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can perform this action' });
    }

    const { newEmail, targetEmail, actionType } = req.body;
    const recipientEmail = targetEmail || newEmail;

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const updateQuery = { $set: { otp: otp, otpExpires: expires } };
    let newAdminOtp = undefined;

    if (recipientEmail) {
      newAdminOtp = Math.floor(100000 + Math.random() * 900000).toString();
      updateQuery.$set.newAdminOtp = newAdminOtp;
      updateQuery.$set.newAdminOtpExpires = expires;
    }

    // Store in current superadmin's document
    await Admin.updateOne(
      { _id: req.user._id },
      updateQuery
    );

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: req.user.email,
      subject: 'Admin Verification Code',
      html: `
        <h2>Verification Required</h2>
        <p>You requested an action that requires verification. Your Super Admin security code is:</p>
        <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    if (recipientEmail && newAdminOtp) {
      let subject = 'Admin Registration Verification Code';
      let htmlBody = `
          <h2>Welcome to Holy Name School System</h2>
          <p>Your email address is being registered as an Administrator. Please provide the following security code to the Super Admin to complete the registration:</p>
      `;
      if (actionType === 'edit') {
        subject = 'Admin Account Modification Verification Code';
        htmlBody = `
          <h2>Holy Name School System Security Alert</h2>
          <p>Your administrator account is being modified by a Super Admin. Please provide the following security code to the Super Admin to authorize this action:</p>
        `;
      } else if (actionType === 'delete') {
        subject = 'Admin Account Deletion Verification Code';
        htmlBody = `
          <h2>Holy Name School System Security Alert</h2>
          <p>Your administrator account is being deleted by a Super Admin. Please provide the following security code to the Super Admin to authorize this action:</p>
        `;
      }

      const newMailOptions = {
        from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: subject,
        html: `
          ${htmlBody}
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${newAdminOtp}</h1>
          <p>This code will expire in 10 minutes. Do not share this code with anyone other than the Super Admin performing this action.</p>
        `,
      };
      await transporter.sendMail(newMailOptions);
    }

    res.json({ message: recipientEmail ? 'OTPs sent to both emails' : 'OTP sent to your email' });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// POST /api/auth/register (protected — only superadmins can create new admins)
router.post('/register', protect, async (req, res) => {
  try {
    // Check if the requester is a superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can create new admin accounts' });
    }

    const { email, password, name, role, otp, newAdminOtp } = req.body;
    console.log("Register payload received: ", req.body);

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    if (!otp || req.user.otp !== otp || req.user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired Super Admin OTP' });
    }

    if (!newAdminOtp || req.user.newAdminOtp !== newAdminOtp || req.user.newAdminOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired New Admin OTP' });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const admin = await Admin.create({ 
      email, 
      password, 
      name, 
      role: role || 'admin' 
    });
    
    // Clear OTP after successful use
    await Admin.updateOne(
      {_id: req.user._id},
      { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
    );

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/auth/admins (only superadmins)
router.get('/admins', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const admins = await Admin.find({}).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/admins/:id (only superadmins)
router.delete('/admins/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can delete admin accounts' });
    }

    const { otp, newAdminOtp } = req.body;

    if (!otp || req.user.otp !== otp || req.user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired Super Admin OTP' });
    }

    if (!newAdminOtp || req.user.newAdminOtp !== newAdminOtp || req.user.newAdminOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired Target Admin OTP' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    // Clear OTPs
    await Admin.updateOne(
      {_id: req.user._id},
      { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
    );

    res.json({ message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/admins/:id (only superadmins)
router.put('/admins/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmins can edit admin accounts' });
    }

    const { name, email, role, password, otp, newAdminOtp } = req.body;

    if (!otp || req.user.otp !== otp || req.user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired Super Admin OTP' });
    }

    if (!newAdminOtp || req.user.newAdminOtp !== newAdminOtp || req.user.newAdminOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired Target Admin OTP' });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (role) admin.role = role;
    if (password) admin.password = password; // Hashed by pre-save hook

    await admin.save();

    // Clear OTP
    await Admin.updateOne(
      {_id: req.user._id},
      { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
    );

    res.json({ message: 'Admin details updated successfully', admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
