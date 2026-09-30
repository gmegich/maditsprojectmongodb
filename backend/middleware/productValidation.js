const { body, param, query } = require('express-validator');

const categoryCreateValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('image').optional().isString(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const categoryUpdateValidation = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('image').optional().isString(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const productCreateValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 150 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 5000 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('categoryId').isMongoId().withMessage('Valid category is required'),
  body('location').optional().trim().isLength({ max: 200 }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'out_of_stock', 'pending_review', 'removed']),
];

const productUpdateValidation = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('categoryId').optional().isMongoId().withMessage('Valid category is required'),
  body('location').optional().trim().isLength({ max: 200 }),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'out_of_stock', 'pending_review', 'removed']),
];

const productQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isMongoId(),
  query('seller').optional().isMongoId(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('search').optional().isString().isLength({ max: 100 }),
  query('sellerSearch').optional().isString().isLength({ max: 100 }),
  query('availability').optional().isIn(['in_stock', 'out_of_stock']),
  query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'rating']),
];

module.exports = {
  categoryCreateValidation,
  categoryUpdateValidation,
  productCreateValidation,
  productUpdateValidation,
  productQueryValidation,
};
