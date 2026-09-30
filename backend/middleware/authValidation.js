const { body } = require('express-validator');

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'seller'])
    .withMessage('Role must be customer or seller'),
  body('businessName')
    .if(body('role').equals('seller'))
    .trim()
    .notEmpty()
    .withMessage('Business name is required for sellers'),
  body('city').optional().trim().isLength({ max: 100 }),
  body('county').optional().trim().isLength({ max: 100 }),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('city').optional().trim().isLength({ max: 100 }),
  body('county').optional().trim().isLength({ max: 100 }),
  body('address.street').optional().trim().isLength({ max: 200 }),
  body('address.building').optional().trim().isLength({ max: 200 }),
  body('address.landmark').optional().trim().isLength({ max: 200 }),
  body('profileImage').optional().isString(),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
};
