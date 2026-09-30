const express = require('express');
const {
  initiateMpesaPayment,
  mpesaCallback,
  getPaymentById,
  getPaymentsByOrder,
  mockCompletePayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const {
  initiateMpesaValidation,
  paymentIdValidation,
  orderIdParamValidation,
  mockCompleteValidation,
} = require('../middleware/paymentValidation');

const router = express.Router();

// Public Daraja callback — no auth
router.post('/mpesa/callback', mpesaCallback);

router.post(
  '/mpesa',
  protect,
  authorize('customer', 'admin'),
  initiateMpesaValidation,
  validateRequest,
  initiateMpesaPayment
);

router.post(
  '/mpesa/mock-complete',
  protect,
  authorize('customer', 'admin'),
  mockCompleteValidation,
  validateRequest,
  mockCompletePayment
);

router.get(
  '/order/:orderId',
  protect,
  authorize('customer', 'admin'),
  orderIdParamValidation,
  validateRequest,
  getPaymentsByOrder
);

router.get(
  '/:id',
  protect,
  authorize('customer', 'admin'),
  paymentIdValidation,
  validateRequest,
  getPaymentById
);

module.exports = router;
