const User = require('../models/User');
const Seller = require('../models/Seller');
const generateToken = require('../utils/generateToken');

const buildAuthResponse = (user, sellerProfile = null) => ({
  success: true,
  message: 'Authentication successful',
  data: {
    token: generateToken(user._id),
    user: {
      ...user.toSafeObject(),
      sellerProfile,
    },
  },
});

/**
 * POST /api/auth/register
 * Register a customer or seller (admin accounts are not self-registered).
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = 'customer',
      city = '',
      county = '',
      businessName,
      businessDescription = '',
      businessLocation = '',
    } = req.body;

    if (role === 'admin') {
      res.status(403);
      throw new Error('Admin accounts cannot be self-registered.');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409);
      throw new Error('An account with this email already exists.');
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      city,
      county,
      accountStatus: role === 'seller' ? 'pending' : 'active',
    });

    let sellerProfile = null;

    if (role === 'seller') {
      sellerProfile = await Seller.create({
        userId: user._id,
        businessName,
        businessDescription,
        businessLocation: businessLocation || city || county || '',
        verificationStatus: 'pending',
        contactInformation: {
          phone,
          email: email.toLowerCase(),
        },
      });
    }

    res.status(201).json({
      ...buildAuthResponse(user, sellerProfile),
      message:
        role === 'seller'
          ? 'Seller registered successfully. Awaiting admin approval.'
          : 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password.');
    }

    if (user.accountStatus === 'suspended' || user.accountStatus === 'inactive') {
      res.status(403);
      throw new Error('Your account is not active. Contact support.');
    }

    let sellerProfile = null;
    if (user.role === 'seller') {
      sellerProfile = await Seller.findOne({ userId: user._id });
    }

    res.status(200).json({
      ...buildAuthResponse(user, sellerProfile),
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    let sellerProfile = null;
    if (req.user.role === 'seller') {
      sellerProfile = await Seller.findOne({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      message: 'Current user retrieved',
      data: {
        user: {
          ...req.user.toSafeObject(),
          sellerProfile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * JWT is client-managed; endpoint confirms logout for API consistency.
 */
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
