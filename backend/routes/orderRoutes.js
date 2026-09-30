const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  trackByOrderNumber,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const {
  createOrderValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
  orderIdValidation,
  orderQueryValidation,
} = require('../middleware/orderValidation');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize('customer'),
  createOrderValidation,
  validateRequest,
  createOrder
);

router.get(
  '/',
  authorize('customer', 'seller', 'admin'),
  orderQueryValidation,
  validateRequest,
  getOrders
);

router.get(
  '/track/:orderNumber',
  authorize('customer', 'seller', 'admin'),
  trackByOrderNumber
);

router.get(
  '/:id/tracking',
  authorize('customer', 'seller', 'admin'),
  orderIdValidation,
  validateRequest,
  getOrderTracking
);

router.get(
  '/:id',
  authorize('customer', 'seller', 'admin'),
  orderIdValidation,
  validateRequest,
  getOrderById
);

router.put(
  '/:id/status',
  authorize('seller', 'admin'),
  updateOrderStatusValidation,
  validateRequest,
  updateOrderStatus
);

router.put(
  '/:id/cancel',
  authorize('customer', 'admin'),
  cancelOrderValidation,
  validateRequest,
  cancelOrder
);

module.exports = router;
