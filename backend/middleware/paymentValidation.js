const { body, param } = require('express-validator');

const initiateMpesaValidation = [
  body('orderId').isMongoId().withMessage('Valid order id is required'),
  body('phoneNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty'),
];

const paymentIdValidation = [param('id').isMongoId().withMessage('Invalid payment id')];

const orderIdParamValidation = [
  param('orderId').isMongoId().withMessage('Invalid order id'),
];

const mockCompleteValidation = [
  body('paymentId').optional().isMongoId(),
  body('checkoutRequestID').optional().isString(),
  body().custom((_, { req }) => {
    if (!req.body.paymentId && !req.body.checkoutRequestID) {
      throw new Error('Provide paymentId or checkoutRequestID');
    }
    return true;
  }),
];

module.exports = {
  initiateMpesaValidation,
  paymentIdValidation,
  orderIdParamValidation,
  mockCompleteValidation,
};
