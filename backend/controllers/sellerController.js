const Seller = require('../models/Seller');

/**
 * GET /api/sellers/me — current seller profile
 */
const getMySellerProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email phone city county accountStatus'
    );

    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found');
    }

    res.status(200).json({
      success: true,
      message: 'Seller profile retrieved',
      data: { seller },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sellers/me — update seller business profile
 */
const updateMySellerProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found');
    }

    const allowed = [
      'businessName',
      'businessDescription',
      'businessLocation',
      'contactInformation',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        seller[field] = req.body[field];
      }
    });

    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Seller profile updated',
      data: { seller },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySellerProfile,
  updateMySellerProfile,
};
