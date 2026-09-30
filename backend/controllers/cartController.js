const Cart = require('../models/Cart');
const Product = require('../models/Product');

const populateCart = (cartQuery) =>
  cartQuery.populate({
    path: 'items.productId',
    select: 'name price stockQuantity images status location averageRating',
  });

const formatCartResponse = (cart) => {
  const items = (cart.items || []).map((item) => {
    const product = item.productId;
    const productId = product?._id?.toString?.() || product?.toString?.() || item.productId;

    return {
      _id: item._id,
      productId,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
      name: product?.name || 'Product',
      image: product?.images?.[0] || '',
      stockQuantity: product?.stockQuantity ?? 0,
      status: product?.status || 'removed',
      available: Boolean(
        product &&
          product.status === 'active' &&
          product.stockQuantity >= item.quantity
      ),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart: {
      _id: cart._id,
      userId: cart.userId,
      items,
      subtotal,
      itemCount,
      updatedAt: cart.updatedAt,
    },
  };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

/**
 * GET /api/cart
 */
const getCart = async (req, res, next) => {
  try {
    let cart = await populateCart(Cart.findOne({ userId: req.user._id }));

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
      cart = await populateCart(Cart.findById(cart._id));
    }

    // Refresh stored prices from current product prices where still active
    let dirty = false;
    for (const item of cart.items) {
      const product = item.productId;
      if (product && typeof product === 'object' && product.price !== item.price) {
        item.price = product.price;
        item.subtotal = product.price * item.quantity;
        dirty = true;
      }
    }
    if (dirty) {
      await cart.save();
      cart = await populateCart(Cart.findById(cart._id));
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved',
      data: formatCartResponse(cart),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/cart
 * Body: { productId, quantity }
 */
const addToCart = async (req, res, next) => {
  try {
    const productId = req.body.productId;
    const quantity = Number(req.body.quantity) || 1;

    if (quantity < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1');
    }

    const product = await Product.findById(productId);
    if (!product || !['active', 'out_of_stock'].includes(product.status)) {
      res.status(404);
      throw new Error('Product not found or unavailable');
    }

    if (product.stockQuantity < 1 || product.status === 'out_of_stock') {
      res.status(400);
      throw new Error('Product is out of stock');
    }

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find(
      (item) => item.productId.toString() === product._id.toString()
    );

    const nextQuantity = existing ? existing.quantity + quantity : quantity;

    if (nextQuantity > product.stockQuantity) {
      res.status(400);
      throw new Error(
        `Only ${product.stockQuantity} unit(s) available in stock`
      );
    }

    if (existing) {
      existing.quantity = nextQuantity;
      existing.price = product.price;
      existing.subtotal = product.price * nextQuantity;
    } else {
      cart.items.push({
        productId: product._id,
        quantity: nextQuantity,
        price: product.price,
        subtotal: product.price * nextQuantity,
      });
    }

    await cart.save();
    const populated = await populateCart(Cart.findById(cart._id));

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      data: formatCartResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/cart/:itemId
 * Body: { quantity }
 */
const updateCartItem = async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400);
      throw new Error('Quantity must be a positive integer');
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      res.status(404);
      throw new Error('Cart item not found');
    }

    const product = await Product.findById(item.productId);
    if (!product || product.status === 'removed') {
      res.status(400);
      throw new Error('Product is no longer available. Remove it from your cart.');
    }

    if (quantity > product.stockQuantity) {
      res.status(400);
      throw new Error(
        `Only ${product.stockQuantity} unit(s) available in stock`
      );
    }

    item.quantity = quantity;
    item.price = product.price;
    item.subtotal = product.price * quantity;

    await cart.save();
    const populated = await populateCart(Cart.findById(cart._id));

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: formatCartResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cart/:itemId
 */
const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      res.status(404);
      throw new Error('Cart item not found');
    }

    cart.items.pull(item._id);
    await cart.save();

    const populated = await populateCart(Cart.findById(cart._id));

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: formatCartResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/cart
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: formatCartResponse(cart),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
