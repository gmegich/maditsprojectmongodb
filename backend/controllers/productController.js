const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const { processUploadedImages } = require('../middleware/uploadMiddleware');
const escapeRegex = require('../utils/escapeRegex');

const getSellerForUser = async (userId) => Seller.findOne({ userId });

const buildProductFilter = (query, user) => {
  const filter = {};

  // Admins can request the full catalogue (any status)
  if (query.admin === 'true' && user?.role === 'admin') {
    if (query.status) filter.status = query.status;
  } else if (query.status) {
    filter.status = query.status;
  } else if (query.mine !== 'true') {
    filter.status = { $in: ['active', 'out_of_stock'] };
  }

  if (query.category) {
    filter.categoryId = query.category;
  }

  if (query.seller) {
    filter.sellerId = query.seller;
  }

  if (query.search) {
    const term = escapeRegex(String(query.search).trim());
    if (term) {
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
      ];
    }
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.availability === 'in_stock') {
    filter.stockQuantity = { $gt: 0 };
  } else if (query.availability === 'out_of_stock') {
    filter.stockQuantity = { $lte: 0 };
  }

  return filter;
};

const buildSort = (sort) => {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'rating':
      return { averageRating: -1, reviewCount: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

/**
 * GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = buildProductFilter(req.query, req.user);

    // Optional seller business-name search
    if (req.query.sellerSearch) {
      const sellerTerm = escapeRegex(String(req.query.sellerSearch).trim());
      if (sellerTerm) {
        const sellers = await Seller.find({
          businessName: { $regex: sellerTerm, $options: 'i' },
        }).select('_id');
        const sellerIds = sellers.map((seller) => seller._id);

        if (!sellerIds.length) {
          return res.status(200).json({
            success: true,
            message: 'Products retrieved',
            data: {
              products: [],
              pagination: { page, limit, total: 0, pages: 1 },
              filters: {
                search: req.query.search || '',
                sellerSearch: req.query.sellerSearch || '',
                category: req.query.category || '',
                sort: req.query.sort || 'newest',
              },
            },
          });
        }

        filter.sellerId = req.query.seller
          ? sellerIds.find((id) => id.toString() === String(req.query.seller)) || { $in: [] }
          : { $in: sellerIds };
      }
    }

    // Sellers viewing own catalogue
    if (req.query.mine === 'true') {
      if (!req.user || req.user.role !== 'seller') {
        res.status(403);
        throw new Error('Only sellers can view their own catalogue via mine=true');
      }
      const seller = await getSellerForUser(req.user._id);
      if (!seller) {
        res.status(404);
        throw new Error('Seller profile not found');
      }
      filter.sellerId = seller._id;
      delete filter.status;
      if (req.query.status) filter.status = req.query.status;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name')
        .populate({
          path: 'sellerId',
          select: 'businessName businessLocation verificationStatus userId',
          populate: { path: 'userId', select: 'name city county' },
        })
        .sort(buildSort(req.query.sort))
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Products retrieved',
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
        filters: {
          search: req.query.search || '',
          sellerSearch: req.query.sellerSearch || '',
          category: req.query.category || '',
          minPrice: req.query.minPrice || '',
          maxPrice: req.query.maxPrice || '',
          availability: req.query.availability || '',
          sort: req.query.sort || 'newest',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name description')
      .populate({
        path: 'sellerId',
        select: 'businessName businessDescription businessLocation verificationStatus contactInformation userId',
        populate: { path: 'userId', select: 'name city county phone' },
      });

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      status: { $in: ['active', 'out_of_stock'] },
      $or: [{ categoryId: product.categoryId }, { sellerId: product.sellerId }],
    })
      .populate('categoryId', 'name')
      .populate('sellerId', 'businessName')
      .sort({ averageRating: -1, createdAt: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      message: 'Product retrieved',
      data: { product, relatedProducts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products — seller only
 */
const createProduct = async (req, res, next) => {
  try {
    const seller = await getSellerForUser(req.user._id);
    if (!seller) {
      res.status(404);
      throw new Error('Seller profile not found. Complete seller registration first.');
    }

    if (seller.verificationStatus === 'deactivated' || seller.verificationStatus === 'rejected') {
      res.status(403);
      throw new Error('Your seller account cannot list products right now.');
    }

    const category = await Category.findById(req.body.categoryId);
    if (!category || category.status !== 'active') {
      res.status(400);
      throw new Error('Selected category is invalid or inactive.');
    }

    const uploadedImages = await processUploadedImages(req.files || []);
    const stockQuantity = Number(req.body.stockQuantity);
    const status =
      req.body.status || (stockQuantity === 0 ? 'out_of_stock' : 'active');

    const product = await Product.create({
      sellerId: seller._id,
      categoryId: req.body.categoryId,
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      stockQuantity,
      images: uploadedImages,
      location: req.body.location || seller.businessLocation || '',
      status,
    });

    const populated = await Product.findById(product._id)
      .populate('categoryId', 'name')
      .populate('sellerId', 'businessName');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id — owner seller or admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (req.user.role === 'seller') {
      const seller = await getSellerForUser(req.user._id);
      if (!seller || product.sellerId.toString() !== seller._id.toString()) {
        res.status(403);
        throw new Error('You can only update your own products.');
      }
    }

    if (req.body.categoryId) {
      const category = await Category.findById(req.body.categoryId);
      if (!category || category.status !== 'active') {
        res.status(400);
        throw new Error('Selected category is invalid or inactive.');
      }
      product.categoryId = req.body.categoryId;
    }

    const fields = ['name', 'description', 'location', 'status'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.stockQuantity !== undefined) {
      product.stockQuantity = Number(req.body.stockQuantity);
      if (product.stockQuantity === 0 && product.status === 'active') {
        product.status = 'out_of_stock';
      }
      if (product.stockQuantity > 0 && product.status === 'out_of_stock') {
        product.status = 'active';
      }
    }

    const uploadedImages = await processUploadedImages(req.files || []);
    if (uploadedImages.length) {
      const replace = req.body.replaceImages === 'true' || req.body.replaceImages === true;
      product.images = replace ? uploadedImages : [...product.images, ...uploadedImages].slice(0, 8);
    }

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('categoryId', 'name')
      .populate('sellerId', 'businessName');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id — owner seller or admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    if (req.user.role === 'seller') {
      const seller = await getSellerForUser(req.user._id);
      if (!seller || product.sellerId.toString() !== seller._id.toString()) {
        res.status(403);
        throw new Error('You can only delete your own products.');
      }
    }

    // Soft-delete for catalogue safety; admin can hard-remove via query
    if (req.user.role === 'admin' && req.query.hard === 'true') {
      await product.deleteOne();
    } else {
      product.status = 'removed';
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
