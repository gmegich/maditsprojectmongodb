const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const {
  updateProfileValidation,
  changePasswordValidation,
} = require('../middleware/authValidation');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfileValidation, validateRequest, updateProfile);
router.put(
  '/change-password',
  changePasswordValidation,
  validateRequest,
  changePassword
);

module.exports = router;
