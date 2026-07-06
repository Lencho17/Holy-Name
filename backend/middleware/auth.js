const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user, error } = await supabase
        .from('admins')
        .select('id, name, email, phone, role, is_approved, otp, otp_expires, new_admin_otp, new_admin_otp_expires')
        .eq('id', decoded.id)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // No token provided
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // Developer role is universally authorized
    if (req.user.role === 'developer' || roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ 
      message: `User role ${req.user.role} is not authorized to access this route` 
    });
  };
};

const protectStaff = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: staff, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', decoded.id)
        .single();
      
      if (error || !staff) {
        return res.status(401).json({ message: 'Not authorized, staff not found' });
      }

      req.staff = staff;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect, authorize, protectStaff };
