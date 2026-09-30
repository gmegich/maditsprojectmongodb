const User = require('../models/User');

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Profile retrieved',
      data: { user: req.user.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'city', 'county', 'profileImage', 'address'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      res.status(400);
      throw new Error('Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
