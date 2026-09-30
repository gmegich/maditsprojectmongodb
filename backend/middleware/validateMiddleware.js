const { validationResult } = require('express-validator');

/**
 * Runs after express-validator chains.
 * Returns a consistent error payload when validation fails.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: errors.array().map((err) => err.msg),
    });
  }

  return next();
};

module.exports = validateRequest;
