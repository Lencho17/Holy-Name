const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authorize, protectAnyUser, protect } = require('../middleware/auth');

// GET /api/system/logs
// Only principal and developer can view these logs
router.get('/logs', protect, authorize('principal'), async (req, res) => {
  try {
    const { data: logs, error } = await supabase
      .from('admin_activity')
      .select('*')
      .like('action', 'AUDIT_%')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    res.json(logs);
  } catch (error) {
    console.error('[SYSTEM LOGS ERROR]:', error);
    res.status(500).json({ message: 'Failed to fetch system logs' });
  }
});

// GET /api/system/online-users
// Principal and developer can view
router.get('/online-users', protect, authorize('principal'), async (req, res) => {
  try {
    // We consider a user "online" if their last heartbeat or login was within the last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: recentActivity, error } = await supabase
      .from('admin_activity')
      .select('email, action, created_at, user_agent, ip_address')
      .in('action', ['heartbeat', 'login', 'stealth_login'])
      .gte('created_at', twoMinutesAgo)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Deduplicate by email
    const onlineUsersMap = new Map();
    recentActivity.forEach(activity => {
      if (!onlineUsersMap.has(activity.email) && activity.email !== 'System/Anonymous') {
        onlineUsersMap.set(activity.email, {
          email: activity.email,
          lastActive: activity.created_at,
          ip: activity.ip_address
        });
      }
    });

    const onlineUsers = Array.from(onlineUsersMap.values());

    res.json({
      count: onlineUsers.length,
      users: onlineUsers
    });
  } catch (error) {
    console.error('[ONLINE USERS ERROR]:', error);
    res.status(500).json({ message: 'Failed to fetch online users' });
  }
});

// POST /api/system/heartbeat
// Any authenticated user can send a heartbeat
router.post('/heartbeat', protectAnyUser, async (req, res) => {
  try {
    let userEmail = 'System/Anonymous';
    let userId = null;
    
    if (req.user) {
      userEmail = req.user.email;
      userId = req.user.id || req.user._id;
    }

    const chPlatformVer = req.headers['sec-ch-ua-platform-version'] || '';
    const uaWithHints = chPlatformVer 
      ? `${req.headers['user-agent']} [CH:PV=${chPlatformVer.replace(/"/g, '')}]`
      : req.headers['user-agent'];

    // Upsert: delete old heartbeats for this user
    await supabase.from('admin_activity')
      .delete()
      .eq('email', userEmail)
      .eq('action', 'heartbeat');

    await supabase.from('admin_activity').insert({
      admin_id: userId, // Assuming admin_id column can store staff/student uuid or string
      email: userEmail,
      action: 'heartbeat',
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: uaWithHints
    });

    res.json({ ok: true });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

module.exports = router;
