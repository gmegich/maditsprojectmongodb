const Category = require('../models/Category');

/**
 * GET /api/categories
 * Public list (active by default; admin can request all with ?all=true)
 */
const getCategories = async (req, res, next) => {
  try {
    const filter = {};
    const wantsAll = req.query.all === 'true';

    if (!wantsAll || !req.user || req.user.role !== 'admin') {
      filter.status = 'active';
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Categories retrieved',
      data: { categories, count: categories.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories — admin only
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({
      name: req.body.name,
      description: req.body.description || '',
      image: req.body.image || '',
      status: req.body.status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id — admin only
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.image !== undefined && { image: req.body.image }),
        ...(req.body.status !== undefined && { status: req.body.status }),
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id — admin only
 */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
