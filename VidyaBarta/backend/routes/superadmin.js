const express = require('express');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// GET /api/superadmin/dashboard-stats
router.get('/dashboard-stats', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin access only' });
    }

    const { data: schools, error } = await supabase.from('schools').select('status');
    if (error) throw error;

    const totalSchools = schools.length;
    const activeSchools = schools.filter(s => s.status === 'Active').length;
    const inactiveSchools = schools.filter(s => s.status !== 'Active').length;
    
    // For now, totalPackages can be mocked or calculated from unique packages
    const totalPackages = [...new Set(schools.map(s => s.package).filter(Boolean))].length;

    res.json({
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalPackages
    });
  } catch (error) {
    console.error('[GET STATS ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/superadmin/schools
router.get('/schools', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin access only' });
    }

    const { data: schools, error } = await supabase
      .from('schools')
      .select('*, admins(id, first_name, last_name, email, image_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(schools);
  } catch (error) {
    console.error('[GET SCHOOLS ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/superadmin/schools
router.post('/schools', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Superadmin access only' });
    }

    const {
      name, logo_url, email, phone, tagline, address, 
      subdomain, custom_domain, package, status,
      admin_first_name, admin_last_name, admin_email, admin_contact, admin_image_url, admin_password
    } = req.body;

    if (!name || !subdomain || !admin_email) {
      return res.status(400).json({ message: 'School name, subdomain, and admin email are required' });
    }

    // Insert School
    const { data: newSchool, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name, logo_url, email, phone, tagline, address,
        subdomain, custom_domain: custom_domain || null, package, status: status || 'Active'
      })
      .select()
      .single();

    if (schoolError) {
      console.error('[CREATE SCHOOL ERROR]:', schoolError);
      return res.status(400).json({ message: 'Failed to create school. Subdomain might be taken.', error: schoolError.message });
    }

    // Insert Admin for the school
    const salt = await bcrypt.genSalt(10);
    const passwordToHash = admin_password && admin_password.trim() !== '' ? admin_password : 'School@123';
    const hashedPassword = await bcrypt.hash(passwordToHash, salt);

    const { data: newAdmin, error: adminError } = await supabase
      .from('admins')
      .insert({
        name: `${admin_first_name} ${admin_last_name}`, // legacy field
        first_name: admin_first_name,
        last_name: admin_last_name,
        email: admin_email.toLowerCase(),
        phone: admin_contact || phone || '0000000000',
        password: hashedPassword,
        role: 'admin',
        is_approved: true,
        school_id: newSchool.id,
        image_url: admin_image_url
      })
      .select()
      .single();

    if (adminError) {
      // If admin creation fails, ideally rollback school creation (Supabase JS doesn't support transactions easily via RPC without setup, so we do manual cleanup or just log it)
      console.error('[CREATE ADMIN ERROR]:', adminError);
      return res.status(400).json({ message: 'School created but failed to create admin. Email might be taken.', error: adminError.message });
    }

    // Clone Holy Name template data (school_id IS NULL)
    const cloneTableData = async (tableName, newSchoolId) => {
      try {
        const { data, error } = await supabase.from(tableName).select('*').is('school_id', null);
        if (error || !data || data.length === 0) return;
        
        const newRecords = data.map(record => {
          const { id, created_at, ...rest } = record;
          return { ...rest, school_id: newSchoolId };
        });
        
        await supabase.from(tableName).insert(newRecords);
      } catch (err) {
        console.error(`[CLONE ${tableName} ERROR]:`, err);
      }
    };

    const tablesToClone = [
      'notices', 'gallery', 'events', 'highlights', 'faculty', 
      'alumni', 'stats', 'faqs', 'courses', 'messages', 
      'emeritus', 'center_of_excellence'
    ];
    
    for (const table of tablesToClone) {
      await cloneTableData(table, newSchool.id);
    }

    // Initialize site_settings for this school (cloned from Holy Name)
    const { data: settingsData } = await supabase.from('site_settings').select('*').is('school_id', null).single();
    
    if (settingsData) {
      const { id, created_at, ...settingsRest } = settingsData;
      const { error: settingsError } = await supabase
        .from('site_settings')
        .insert({
          ...settingsRest,
          school_id: newSchool.id,
          school_name: name,
          logo: logo_url || settingsRest.logo,
          punch_line: tagline || settingsRest.punch_line,
          email: email || settingsRest.email,
          phone: phone || settingsRest.phone,
          office_address: address || settingsRest.office_address
        });
      if (settingsError) console.error('[CREATE SETTINGS ERROR]:', settingsError);
    } else {
      const { error: settingsError } = await supabase
        .from('site_settings')
        .insert({
          school_id: newSchool.id,
          school_name: name,
          logo: logo_url,
          punch_line: tagline,
          email: email,
          phone: phone,
          office_address: address
        });
      if (settingsError) console.error('[CREATE SETTINGS ERROR]:', settingsError);
    }

    res.status(201).json({ school: newSchool, admin: newAdmin });
  } catch (error) {
    console.error('[CREATE SCHOOL SERVER ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/superadmin/schools/:id/status
router.patch('/schools/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { status } = req.body;
    const { error } = await supabase
      .from('schools')
      .update({ status })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/superadmin/schools/:id
router.put('/schools/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { name, subdomain, custom_domain, package: schoolPackage, phone, email, tagline, address, logo_url, platform_fee, transaction_fee, allowed_features, package_id } = req.body;
    const { error } = await supabase
      .from('schools')
      .update({ name, subdomain, custom_domain, package: schoolPackage, phone, email, tagline, address, logo_url, platform_fee, transaction_fee, allowed_features, package_id })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'School updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/superadmin/schools/:id/admin
router.patch('/schools/:id/admin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const { admin_id, first_name, last_name, email, phone, password, image_url } = req.body;
    const updateData = { first_name, last_name, email: email?.toLowerCase(), phone, image_url, name: `${first_name} ${last_name}` };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const { error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', admin_id)
      .eq('school_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Admin updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/superadmin/schools/:id
router.delete('/schools/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete associated admins first
    await supabase.from('admins').delete().eq('school_id', req.params.id);
    
    // Delete school settings
    await supabase.from('site_settings').delete().eq('school_id', req.params.id);
    
    // Delete the school
    const { error } = await supabase.from('schools').delete().eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/superadmin/schools/:id/settings
router.get('/schools/:id/settings', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('school_id', req.params.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // ignore no rows
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const contentRouter = require('./content');

// PUT /api/superadmin/schools/:id/settings
router.put('/schools/:id/settings', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { services_visibility } = req.body;
    const { error } = await supabase
      .from('site_settings')
      .update({ services_visibility })
      .eq('school_id', req.params.id);

    if (error) throw error;
    
    // Invalidate the content cache for this school so the frontend reflects changes instantly
    contentRouter.clearCache(req.params.id);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- PACKAGES MANAGEMENT ---
// GET /api/superadmin/packages
router.get('/packages', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

// POST /api/superadmin/packages
router.post('/packages', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { name, features } = req.body;
    const { data, error } = await supabase.from('packages').insert({ name, features }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

// PUT /api/superadmin/packages/:id
router.put('/packages/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { name, features } = req.body;
    const { data, error } = await supabase.from('packages').update({ name, features }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

// DELETE /api/superadmin/packages/:id
router.delete('/packages/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { error } = await supabase.from('packages').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Package deleted' });
  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); }
});

// --- BULK ID CARD DATA ---
// GET /api/superadmin/schools/:id/id-cards-data
router.get('/schools/:id/id-cards-data', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer' && req.user.role !== 'superadmin') return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    
    // Fetch students
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, student_name, admission_id, roll_number, class_name, section, blood_group, guardian_name, contact_number, address, dob, photo_url')
      .eq('school_id', id);
    if (studentError) throw studentError;

    // Fetch staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, name, employee_id, role, department, blood_group, phone, address, dob, photo_url')
      .eq('school_id', id);
    if (staffError) throw staffError;

    // Fetch school settings for the ID card header/logo
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('school_name, logo, phone, email, office_address')
      .eq('school_id', id)
      .single();

    res.json({ students: students || [], staff: staff || [], schoolProfile: settings || {} });
  } catch (error) {
    console.error('ID Card Data Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ================= DOMAIN REQUESTS =================

router.get('/domains', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('domain_purchases')
      .select('*, schools(name, subdomain)')
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch domain requests' });
  }
});

// @desc    Approve Domain Request & Upload Invoice
// @route   POST /api/superadmin/domains/:id/approve
router.post('/domains/:id/approve', protect, authorize('superadmin'), upload.single('invoice'), async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch domain request
    const { data: request, error: requestError } = await supabase
      .from('domain_purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !request) return res.status(404).json({ message: 'Domain request not found' });
    if (request.status === 'Active') return res.status(400).json({ message: 'Domain already approved' });

    // 2. Fetch school wallet
    const { data: wallet, error: walletError } = await supabase
      .from('school_wallets')
      .select('*')
      .eq('school_id', request.school_id)
      .single();

    if (walletError || !wallet) return res.status(404).json({ message: 'School wallet not found' });

    if (wallet.balance < request.cost) {
      return res.status(400).json({ message: 'Not enough wallet balance' });
    }

    // 3. Upload invoice to Cloudinary if provided
    let invoiceUrl = null;
    if (req.file) {
      invoiceUrl = await uploadToCloudinary(req.file, null, 'domain_invoices');
    }

    const newBalance = wallet.balance - request.cost;

    // 4. Update Wallet, Ledger & Domain Status
    const { error: updateWalletError } = await supabase
      .from('school_wallets')
      .update({ balance: newBalance, last_updated: new Date() })
      .eq('id', wallet.id);
    if (updateWalletError) throw updateWalletError;

    const { error: ledgerError } = await supabase
      .from('wallet_ledger')
      .insert([{
        school_id: request.school_id,
        type: 'debit',
        amount: request.cost,
        balance_after: newBalance,
        reference_type: 'domain_purchase',
        reference_id: request.id,
        description: `Domain Purchase: ${request.domain_name}`
      }]);
    if (ledgerError) throw ledgerError;

    const { error: updateDomainError } = await supabase
      .from('domain_purchases')
      .update({ status: 'Active', invoice_url: invoiceUrl })
      .eq('id', request.id)
      .select()
      .single();
    if (updateDomainError) throw updateDomainError;

    // 5. Email Notification
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('email, name')
      .eq('school_id', request.school_id)
      .limit(1)
      .single();

    if (!adminError && admin && admin.email) {
      const { sendEmail } = require('../utils/mailer');
      const invoiceHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #6366F1;">Domain Purchase Approved</h2>
          <p>Hello ${admin.name},</p>
          <p>Your request for the custom domain <strong>${request.domain_name}</strong> has been approved and activated.</p>
          <hr />
          <h3>Invoice Details</h3>
          <table style="width: 100%; text-align: left; margin-bottom: 20px;">
            <tr><th>Domain</th><td>${request.domain_name}</td></tr>
            <tr><th>Amount Deducted</th><td>₹${request.cost}</td></tr>
            <tr><th>Wallet Balance After</th><td>₹${newBalance}</td></tr>
          </table>
          ${invoiceUrl ? `<p><a href="${invoiceUrl}" target="_blank" style="background-color: #6366F1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">View Official Invoice</a></p>` : ''}
          <p>Thank you for using VidyaBarta SaaS!</p>
        </div>
      `;
      
      const attachments = [];
      if (req.file) {
        attachments.push({
          filename: req.file.originalname,
          content: req.file.buffer
        });
      }

      try {
        await sendEmail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: `Invoice: Domain Approved - ${request.domain_name}`,
          html: invoiceHtml,
          attachments: attachments.length > 0 ? attachments : undefined
        });
      } catch(emailErr) {
        console.error('Failed to send invoice email:', emailErr);
      }
    }

    res.json(updateDomainError ? {} : updateDomainError); // Send success response
  } catch (err) {
    console.error('Domain approval error:', err);
    res.status(500).json({ message: 'Failed to approve domain request' });
  }
});

// @desc    Reject Domain Request
// @route   POST /api/superadmin/domains/:id/reject
router.post('/domains/:id/reject', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });

    const { data: request, error: requestError } = await supabase
      .from('domain_purchases')
      .select('*')
      .eq('id', id)
      .single();

    if (requestError || !request) return res.status(404).json({ message: 'Domain request not found' });
    if (request.status === 'Active') return res.status(400).json({ message: 'Domain already approved' });

    // Update the request status to Rejected instead of deleting
    const { error: updateError } = await supabase
      .from('domain_purchases')
      .update({ status: 'Rejected' })
      .eq('id', id);

    if (updateError) throw updateError;


    // Email Notification
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('email, name')
      .eq('school_id', request.school_id)
      .limit(1)
      .single();

    if (!adminError && admin && admin.email) {
      const { sendEmail } = require('../utils/mailer');
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #EF4444;">Domain Request Rejected</h2>
          <p>Hello ${admin.name},</p>
          <p>Your request for the custom domain <strong>${request.domain_name}</strong> was rejected.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Your wallet has not been charged. If you need assistance, please contact support.</p>
        </div>
      `;
      try {
        await sendEmail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: `Domain Request Rejected - ${request.domain_name}`,
          html: html
        });
      } catch(emailErr) {
        console.error('Failed to send rejection email:', emailErr);
      }
    }

    res.json({ message: 'Domain request rejected successfully' });
  } catch (err) {
    console.error('Domain rejection error:', err);
    res.status(500).json({ message: 'Failed to reject domain request' });
  }
});

module.exports = router;
