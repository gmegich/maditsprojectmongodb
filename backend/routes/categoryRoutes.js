const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const {
  categoryCreateValidation,
  categoryUpdateValidation,
} = require('../middleware/productValidation');

const router = express.Router();

router.get('/', optionalAuth, getCategories);
router.get('/:id', getCategoryById);

router.post(
  '/',
  protect,
  authorize('admin'),
  categoryCreateValidation,
  validateRequest,
  createCategory
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  categoryUpdateValidation,
  validateRequest,
  updateCategory
);

router.delete('/:id', protect, authorize('admin'), deleteCategory);

module.exports = router;
