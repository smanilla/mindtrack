const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
  
  if (!token) {
    console.log('Auth failed: No token provided');
    console.log('Authorization header:', req.headers.authorization);
    return res.status(401).json({ message: 'Not authorized' });
  }
  
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('Auth failed: User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log('Auth successful for user:', req.user.email, 'role:', req.user.role);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    console.error('Token (first 50 chars):', token.substring(0, 50));
    console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    return res.status(401).json({ message: 'Token invalid', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

function authorize(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { protect, authorize };


