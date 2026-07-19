const jwt = require('jsonwebtoken');

const employeeAuth = (req, res, next) => {
  // Get token from header, query, or body (useful for sendBeacon)
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token || req.body?.token;

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.employee;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { employeeAuth };
