const express = require('express');
const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');

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
      admin_first_name, admin_last_name, admin_email, admin_contact, admin_image_url
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
    // Generate a default password, for example: School@123
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('School@123', salt);

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
    const { name, subdomain, custom_domain, package: schoolPackage, phone, email, tagline, address, logo_url } = req.body;
    const { error } = await supabase
      .from('schools')
      .update({ name, subdomain, custom_domain, package: schoolPackage, phone, email, tagline, address, logo_url })
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

module.exports = router;
