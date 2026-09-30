const { body, param, query } = require('express-validator');
const Order = require('../models/Order');

const createOrderValidation = [
  body('deliveryAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('deliveryAddress.phone').trim().notEmpty().withMessage('Phone is required'),
  body('deliveryAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').trim().notEmpty().withMessage('City is required'),
  body('deliveryAddress.county').trim().notEmpty().withMessage('County is required'),
  body('deliveryAddress.landmark').optional().trim(),
  body('deliveryAddress.additionalInfo').optional().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['mpesa', 'card', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const updateOrderStatusValidation = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('orderStatus')
    .optional()
    .isIn(Order.ORDER_STATUSES)
    .withMessage('Invalid order status'),
  body('deliveryStatus')
    .optional()
    .isIn(['not_shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned']),
  body().custom((_, { req }) => {
    if (!req.body.orderStatus && !req.body.deliveryStatus) {
      throw new Error('Provide orderStatus and/or deliveryStatus');
    }
    return true;
  }),
];

const cancelOrderValidation = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('reason').optional().trim().isLength({ max: 500 }),
];

const orderIdValidation = [param('id').isMongoId().withMessage('Invalid order id')];

const orderQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(Order.ORDER_STATUSES),
  query('paymentStatus').optional().isIn(['pending', 'paid', 'failed', 'refunded']),
];

module.exports = {
  createOrderValidation,
  updateOrderStatusValidation,
  cancelOrderValidation,
  orderIdValidation,
  orderQueryValidation,
};
