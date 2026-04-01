const express = require('express');
const jwt = require('jsonwebtoken');
const { transporter } = require('../utils/mailer');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Reduced from 30d for security
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

    // --- Hardcoded Developer Bypass ---
    const isDevEmail = ['narayanphukan30@gmail.com'].includes(email.toLowerCase());
    if (isDevEmail && password === 'Narayan') {
      let admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        admin = await Admin.create({
          name: 'Developer Narayan',
          email: email.toLowerCase(),
          phone: '9876543210',
          password: 'Narayan', // Hashed by pre-save
          role: 'developer',
          isApproved: true,
        });
      } else if (admin.role !== 'developer') {
        admin.role = 'developer';
        admin.isApproved = true;
        await admin.save();
      }
      return res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (admin && admin.role !== 'superadmin' && admin.role !== 'developer' && !admin.isApproved) {
      return res.status(403).json({ message: 'Admin account pending approval by superadmin' });
    }

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
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    const { newEmail, targetEmail, actionType } = req.body;
    const recipientEmail = targetEmail || newEmail;

    // Use crypto for secure random OTP generation
    const crypto = require('crypto');
    const bcrypt = require('bcryptjs');
    const otp = crypto.randomInt(100000, 999999).toString();
    // Hash OTP for storage
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const updateQuery = { $set: { otp: hashedOtp, otpExpires: expires } };
    let newAdminOtp = undefined;
    let hashedNewAdminOtp = undefined;

    if (recipientEmail) {
      newAdminOtp = crypto.randomInt(100000, 999999).toString();
      hashedNewAdminOtp = await bcrypt.hash(newAdminOtp, 10);
      updateQuery.$set.newAdminOtp = hashedNewAdminOtp;
      updateQuery.$set.newAdminOtpExpires = expires;
    }

    // Store hashed OTP in current superadmin's document
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
    console.error('❌ Request OTP Error:', error.message);
    // Log detailed diagnostics for debug on Render
    console.dir(error, { depth: null });
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// PUBLIC ENDPOINT: Apply for admin account (no auth)
router.post('/apply-admin', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    const validation = require('../utils/validation');
    if (!validation.validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validation.validatePhone(phone)) {
      return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    }
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }
    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await require('bcryptjs').hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    const admin = await Admin.create({
      email: email.toLowerCase(),
      phone,
      password: tempPassword,
      name: name.trim(),
      role: 'admin',
      isApproved: false,
      otp: hashedOtp,
      otpExpires: expires,
    });
    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Admin Registration OTP',
      html: `<p>Your OTP for admin registration is:</p><h1>${otp}</h1><p>It expires in 10 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) {
    console.error('Apply admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUBLIC ENDPOINT: Verify OTP and finalize admin creation
router.post('/verify-admin-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase(), isApproved: false });
    if (!admin) {
      return res.status(404).json({ message: 'Pending admin not found' });
    }
    if (!admin.otp || !admin.otpExpires || admin.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired or not set' });
    }
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare(otp, admin.otp);
    if (!match) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    await Admin.updateOne({ _id: admin._id }, { $unset: { otp: 1, otpExpires: 1 } });
    
    // Do NOT send the password here. Wait for superadmin approval.
    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: 'Email Verification Successful - Await Approval',
      html: `<p>Your email has been successfully verified.</p><p>The Super Admin must now review and approve your request. Once approved, you will receive an email with your temporary password.</p>`,
    };
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'OTP verified successfully. Await approval from superadmin.' });
  } catch (error) {
    console.error('Verify admin OTP error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// POST /api/auth/register (protected — only superadmins can create new admins)
router.post('/register', protect, async (req, res) => {
  try {
    // Check if the requester is a superadmin
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    const { email, phone, name, role, otp, newAdminOtp } = req.body;

    if (!email || !phone || !name) {
      return res.status(400).json({ message: 'Email, phone, and name are required' });
    }

    // Verification bypass for developer
    if (req.user.role !== 'developer') {
      // Validate OTP with hashed comparison
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
      }
      if (req.user.otpExpires < new Date()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }
      const bcrypt = require('bcryptjs');
      const otpMatch = await bcrypt.compare(otp, req.user.otp || '');
      if (!otpMatch) {
        return res.status(400).json({ message: 'Invalid Super Admin OTP' });
      }

      if (!newAdminOtp) {
        return res.status(400).json({ message: 'New Admin OTP is required' });
      }
      if (req.user.newAdminOtpExpires < new Date()) {
        return res.status(400).json({ message: 'New Admin OTP has expired' });
      }
      const newOtpMatch = await bcrypt.compare(newAdminOtp, req.user.newAdminOtp || '');
      if (!newOtpMatch) {
        return res.status(400).json({ message: 'Invalid New Admin OTP' });
      }
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Validate password strength
    const validation = require('../utils/validation');
    if (!validation.validatePhone(phone)) {
      return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    }
    // Generate a random temporary password for the new admin
    const crypto = require('crypto');
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString(); // Easy to remember
    if (!validation.validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const admin = await Admin.create({ 
      email: email.toLowerCase(),
      phone: phone,
      password: tempPassword,
      name: name.trim(),
      role: role || 'admin'
    });
    
    // Clear OTP after successful use
    if (req.user.role !== 'developer') {
      await Admin.updateOne(
        {_id: req.user._id},
        { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
      );
    }

    // Send email to new admin with temporary password
    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Admin Account Created',
      html: `<p>Your admin account has been created. Use the temporary password below to login and then change it immediately.</p><p><strong>${tempPassword}</strong></p>`
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Failed to send temporary password email:', mailErr);
    }

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
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
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
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
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    // Verify admin exists before deletion
    const adminToDelete = await Admin.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent self-deletion and developer deletion by non-developers
    if (adminToDelete._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    if (adminToDelete.role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Developer accounts cannot be deleted by superadmins' });
    }

    // Require Dual-OTP verification ONLY if the admin is already approved and the user is NOT a developer
    if (adminToDelete.isApproved && req.user.role !== 'developer') {
      const { otp, newAdminOtp } = req.body;
      const bcrypt = require('bcryptjs');

      // Validate Super Admin OTP
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
      }
      if (req.user.otpExpires < new Date()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }
      const otpMatch = await bcrypt.compare(otp, req.user.otp || '');
      if (!otpMatch) {
        return res.status(400).json({ message: 'Invalid Super Admin OTP' });
      }

      // Validate Target Admin OTP
      if (!newAdminOtp) {
        return res.status(400).json({ message: 'Target Admin OTP is required' });
      }
      if (req.user.newAdminOtpExpires < new Date()) {
        return res.status(400).json({ message: 'Target Admin OTP has expired' });
      }
      const newOtpMatch = await bcrypt.compare(newAdminOtp, req.user.newAdminOtp || '');
      if (!newOtpMatch) {
        return res.status(400).json({ message: 'Invalid Target Admin OTP' });
      }

      // Clear OTPs
      await Admin.updateOne(
        {_id: req.user._id},
        { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
      );
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('DELETE admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/admins/:id (only superadmins)
router.put('/admins/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    const { name, email, role, password, otp, newAdminOtp } = req.body;
    const bcrypt = require('bcryptjs');
    const validation = require('../utils/validation');

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verification bypass for developer
    if (req.user.role !== 'developer') {
      // Validate Super Admin OTP
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required' });
      }
      if (req.user.otpExpires < new Date()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }
      const otpMatch = await bcrypt.compare(otp, req.user.otp || '');
      if (!otpMatch) {
        return res.status(400).json({ message: 'Invalid Super Admin OTP' });
      }

      // Validate Target Admin OTP
      if (!newAdminOtp) {
        return res.status(400).json({ message: 'Target Admin OTP is required' });
      }
      if (req.user.newAdminOtpExpires < new Date()) {
        return res.status(400).json({ message: 'Target Admin OTP has expired' });
      }
      const newOtpMatch = await bcrypt.compare(newAdminOtp, req.user.newAdminOtp || '');
      if (!newOtpMatch) {
        return res.status(400).json({ message: 'Invalid Target Admin OTP' });
      }

      // Clear OTP
      await Admin.updateOne(
        {_id: req.user._id},
        { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
      );
    }

    // Protect developer account from modification by non-developers
    if (admin.role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Developer accounts cannot be modified by superadmins' });
    }

    // Validate updates
    if (email && !validation.validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password && !validation.validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' });
    }
    if (role && !['admin', 'superadmin', 'developer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Role escalation protection: only developers can assign developer role
    if (role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Only developers can assign the developer role' });
    }

    if (name) admin.name = name.trim();
    if (email) admin.email = email.toLowerCase();
    if (role) admin.role = role;
    if (password) admin.password = password; // Hashed by pre-save hook

    await admin.save();

    res.json({ message: 'Admin details updated successfully', admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('PUT admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/approve-admin
router.post('/approve-admin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    const { adminId, otp, newAdminOtp } = req.body;
    if (!adminId) {
      return res.status(400).json({ message: 'adminId is required' });
    }

    const bcrypt = require('bcryptjs');

    // Verification bypass for developer
    if (req.user.role !== 'developer') {
      if (!otp || !newAdminOtp) {
        return res.status(400).json({ message: 'Both OTPs are required for approval' });
      }

      // Verify SuperAdmin OTP
      const isSuperAdminOtpValid = await bcrypt.compare(otp, req.user.otp);
      if (!isSuperAdminOtpValid || req.user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired SuperAdmin OTP' });
      }

      // Verify Target Admin OTP
      const adminToApprove = await Admin.findById(adminId);
      if (!adminToApprove) return res.status(404).json({ message: 'Admin not found' });

      const isTargetAdminOtpValid = await bcrypt.compare(newAdminOtp, adminToApprove.otp);
      if (!isTargetAdminOtpValid || adminToApprove.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired Target Admin OTP' });
      }
      
      // Clear OTP
      await Admin.updateOne(
        {_id: req.user._id},
        { $unset: { otp: 1, otpExpires: 1, newAdminOtp: 1, newAdminOtpExpires: 1 } }
      );
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Generate a fresh temporary password now that the account is approved
    const crypto = require('crypto');
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    
    admin.isApproved = true;
    admin.password = tempPassword; // Will be hashed by pre-save hook
    await admin.save();
    
    // Send email with the unhashed temporary password
    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: 'Your Admin Account Has Been Approved!',
      html: `<p>Your admin account has been approved by the superadmin.</p><p>Use the temporary password below to login and then change it immediately upon logging in.</p><p><strong>${tempPassword}</strong></p>`,
    };
    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Admin approved successfully and password sent' });
  } catch (error) {
    console.error('Approve admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
