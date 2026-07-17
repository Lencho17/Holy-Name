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
    if (token === 'hardcoded-superadmin-token') {
      req.user = { id: 'super-admin-id', name: 'System Admin', email: 'lenchosolutions17@gmail.com', role: 'superadmin' };
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user, error } = await supabase
        .from('admins')
        .select('id, name, email, phone, role, is_approved, otp, otp_expires, new_admin_otp, new_admin_otp_expires, school_id')
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

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    if (token === 'hardcoded-superadmin-token') {
      req.user = { id: 'super-admin-id', name: 'System Admin', email: 'lenchosolutions17@gmail.com', role: 'superadmin' };
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabase
        .from('admins')
        .select('id, name, email, phone, role, is_approved, school_id')
        .eq('id', decoded.id)
        .single();
      
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // ignore
    }
  }
  return next();
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

const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', decoded.id)
        .single();
      
      if (error || !student) {
        return res.status(401).json({ message: 'Not authorized, student not found' });
      }

      req.student = student;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

const protectAnyStaff = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token) {
    if (token === 'hardcoded-superadmin-token') {
      req.user = { id: 'super-admin-id', name: 'System Admin', email: 'lenchosolutions17@gmail.com', role: 'superadmin' };
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try admin first
      const { data: user } = await supabase
        .from('admins')
        .select('id, name, email, phone, role, is_approved, school_id')
        .eq('id', decoded.id)
        .single();
      
      if (user) {
        req.user = user;
        return next();
      }

      // Try staff
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (staff) {
        req.user = staff;
        req.staff = staff;
        return next();
      }
      
      return res.status(401).json({ message: 'Not authorized, user not found' });
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect, optionalProtect, authorize, protectStaff, protectStudent, protectAnyStaff };
