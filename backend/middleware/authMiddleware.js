const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — requires a valid Bearer JWT.
 * Attaches the authenticated user to req.user (password excluded).
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized. Please log in.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('User no longer exists.');
    }

    if (user.accountStatus === 'suspended' || user.accountStatus === 'inactive') {
      res.status(403);
      throw new Error('Your account is not active. Contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401);
      return next(new Error('Invalid or expired token. Please log in again.'));
    }
    if (!res.statusCode || res.statusCode === 200) {
      res.status(401);
    }
    return next(error);
  }
};

/**
 * Optional auth — attaches user when a valid token is present, otherwise continues.
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    }
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { protect, optionalAuth };
