const supabase = require('../config/supabase');

const auditLogger = async (req, res, next) => {
  // Only log write operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;
    
    res.send = function (data) {
      // Intercept the response to ensure we only log successful actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        
        // Don't log heartbeat or pure auth lookups to avoid noise
        if (!req.originalUrl.includes('/heartbeat') && 
            !req.originalUrl.includes('/auth/login') && 
            !req.originalUrl.includes('/auth/activity') &&
            !req.originalUrl.includes('/auth/me')) {
          
          let userEmail = 'System/Anonymous';
          let userId = null;
          
          if (req.user) {
            userEmail = req.user.email;
            userId = req.user.id;
          } else if (req.staff) {
            userEmail = req.staff.email;
            userId = req.staff.id;
          } else if (req.student) {
            userEmail = req.student.email;
            userId = req.student.id;
          }

          // Create a detailed log message
          let payloadStr = '';
          try {
             // Redact passwords if any
             const safeBody = { ...req.body };
             if (safeBody.password) safeBody.password = '***';
             if (safeBody.newPassword) safeBody.newPassword = '***';
             if (safeBody.otp) safeBody.otp = '***';
             
             payloadStr = Object.keys(safeBody).length > 0 ? JSON.stringify(safeBody) : '';
             if (payloadStr.length > 500) {
                 payloadStr = payloadStr.substring(0, 500) + '... (truncated)';
             }
          } catch (e) {
             payloadStr = 'Unparseable payload';
          }

          const method = req.method;
          const endpoint = req.originalUrl.split('?')[0]; // strip query params
          
          const logText = `${method} ${endpoint} | Payload: ${payloadStr}`;
          
          // Asynchronously log to admin_activity using AUDIT_LOG prefix
          supabase.from('admin_activity').insert({
            admin_id: userId,
            email: userEmail,
            action: `AUDIT_${method}`,
            ip_address: req.ip || req.headers['x-forwarded-for'] || 'Unknown IP',
            user_agent: logText
          }).then(({ error }) => {
            if (error) {
              console.error('[AUDIT LOG ERROR]', error.message);
            }
          });
        }
      }
      originalSend.apply(res, arguments);
    };
  }
  
  next();
};

module.exports = auditLogger;
