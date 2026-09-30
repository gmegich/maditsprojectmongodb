const mongoose = require('mongoose');

/**
 * Ensure MongoDB is connected before handling data routes.
 */
const requireDB = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Start MongoDB and restart the API.',
      error: 'MongoDB not connected',
    });
  }
  return next();
};

module.exports = requireDB;
