const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const {
  addToCartValidation,
  updateCartItemValidation,
  cartItemParamValidation,
} = require('../middleware/cartValidation');

const router = express.Router();

router.use(protect, authorize('customer'));

router.get('/', getCart);
router.post('/', addToCartValidation, validateRequest, addToCart);
router.put('/:itemId', updateCartItemValidation, validateRequest, updateCartItem);
router.delete('/:itemId', cartItemParamValidation, validateRequest, removeCartItem);
router.delete('/', clearCart);

module.exports = router;
