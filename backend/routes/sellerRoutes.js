const express = require('express');
const {
  getMySellerProfile,
  updateMySellerProfile,
} = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('seller'));

router.get('/me', getMySellerProfile);
router.put('/me', updateMySellerProfile);

module.exports = router;
