const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateMiddleware');
const {
  productCreateValidation,
  productUpdateValidation,
  productQueryValidation,
} = require('../middleware/productValidation');
const { uploadProductImages } = require('../middleware/uploadMiddleware');

const router = express.Router();

const maybeUploadImages = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return uploadProductImages(req, res, (err) => {
      if (err) {
        res.status(400);
        return next(err);
      }
      return next();
    });
  }
  return next();
};

router.get('/', optionalAuth, productQueryValidation, validateRequest, getProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  protect,
  authorize('seller'),
  maybeUploadImages,
  productCreateValidation,
  validateRequest,
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('seller', 'admin'),
  maybeUploadImages,
  productUpdateValidation,
  validateRequest,
  updateProduct
);

router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
