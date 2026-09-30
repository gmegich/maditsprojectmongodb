const { body, param } = require('express-validator');

const addToCartValidation = [
  body('productId').isMongoId().withMessage('Valid product id is required'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const updateCartItemValidation = [
  param('itemId').isMongoId().withMessage('Invalid cart item id'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

const cartItemParamValidation = [
  param('itemId').isMongoId().withMessage('Invalid cart item id'),
];

module.exports = {
  addToCartValidation,
  updateCartItemValidation,
  cartItemParamValidation,
};
