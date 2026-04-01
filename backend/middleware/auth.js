const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await Admin.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
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

module.exports = { protect, authorize };
