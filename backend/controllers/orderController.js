const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const generateOrderNumber = require('../utils/generateOrderNumber');
const {
  createNotification,
  notifyOrderStatusChange,
} = require('../services/notificationService');

const CANCELLABLE_STATUSES = ['Pending', 'Confirmed'];
const TRACKING_FLOW = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

const createUniqueOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.exists({ orderNumber });
    if (!exists) return orderNumber;
  }
  return `${generateOrderNumber()}-${Date.now().toString().slice(-4)}`;
};

const syncDeliveryStatus = (orderStatus) => {
  switch (orderStatus) {
    case 'Shipped':
      return 'in_transit';
    case 'Out for Delivery':
      return 'out_for_delivery';
    case 'Delivered':
      return 'delivered';
    case 'Cancelled':
      return 'not_shipped';
    default:
      return 'not_shipped';
  }
};

const pushStatusHistory = (order, { status, deliveryStatus, note = '', updatedBy }) => {
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status,
    deliveryStatus: deliveryStatus || order.deliveryStatus || 'not_shipped',
    note,
    updatedBy,
    at: new Date(),
  });
};

const buildTrackingPayload = (order) => {
  const currentIndex =
    order.orderStatus === 'Cancelled' ? -1 : TRACKING_FLOW.indexOf(order.orderStatus);

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    deliveryStatus: order.deliveryStatus,
    paymentStatus: order.paymentStatus,
    currentStep: currentIndex + 1,
    totalSteps: TRACKING_FLOW.length,
    isCancelled: order.orderStatus === 'Cancelled',
    isDelivered: order.orderStatus === 'Delivered',
    timeline: TRACKING_FLOW.map((status, index) => {
      const historyMatch = [...(order.statusHistory || [])]
        .reverse()
        .find((entry) => entry.status === status);

      return {
        status,
        completed:
          order.orderStatus !== 'Cancelled' && currentIndex >= 0 && index <= currentIndex,
        current: order.orderStatus === status,
        at: historyMatch?.at || null,
        note: historyMatch?.note || '',
      };
    }),
    history: order.statusHistory || [],
    estimatedMessage:
      order.orderStatus === 'Delivered'
        ? 'Order delivered.'
        : order.orderStatus === 'Cancelled'
          ? 'Order was cancelled.'
          : order.orderStatus === 'Out for Delivery'
            ? 'Your order is out for delivery.'
            : order.orderStatus === 'Shipped'
              ? 'Your order is on the way.'
              : 'We will notify you when the status changes.',
  };
};

/**
 * POST /api/orders
 * Create order from the authenticated customer's cart.
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      deliveryAddress,
      paymentMethod = 'mpesa',
      notes = '',
    } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart || !cart.items.length) {
      res.status(400);
      throw new Error('Your cart is empty.');
    }

    const orderItems = [];
    const sellerIdSet = new Set();
    const stockUpdates = [];

    for (const item of cart.items) {
      const product = item.productId;
      if (!product || typeof product !== 'object') {
        res.status(400);
        throw new Error('A cart item references a missing product. Refresh your cart.');
      }

      if (!['active', 'out_of_stock'].includes(product.status) || product.status === 'removed') {
        res.status(400);
        throw new Error(`"${product.name}" is no longer available.`);
      }

      if (product.stockQuantity < item.quantity) {
        res.status(400);
        throw new Error(
          `Insufficient stock for "${product.name}". Only ${product.stockQuantity} left.`
        );
      }

      const price = product.price;
      const subtotal = price * item.quantity;

      orderItems.push({
        productId: product._id,
        sellerId: product.sellerId,
        name: product.name,
        quantity: item.quantity,
        price,
        subtotal,
        image: product.images?.[0] || '',
      });

      sellerIdSet.add(product.sellerId.toString());
      stockUpdates.push({
        productId: product._id,
        quantity: item.quantity,
        nextStock: product.stockQuantity - item.quantity,
      });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const orderNumber = await createUniqueOrderNumber();

    // Deduct stock before creating the order
    for (const update of stockUpdates) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await Product.findOneAndUpdate(
        {
          _id: update.productId,
          stockQuantity: { $gte: update.quantity },
        },
        {
          $inc: { stockQuantity: -update.quantity },
          ...(update.nextStock === 0 ? { status: 'out_of_stock' } : {}),
        },
        { new: true }
      );

      if (!updated) {
        res.status(409);
        throw new Error('Stock changed while placing the order. Please review your cart.');
      }
    }

    const order = await Order.create({
      orderNumber,
      buyerId: req.user._id,
      sellerIds: [...sellerIdSet],
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'Pending',
      deliveryStatus: 'not_shipped',
      notes,
      statusHistory: [
        {
          status: 'Pending',
          deliveryStatus: 'not_shipped',
          note: 'Order placed',
          updatedBy: req.user._id,
          at: new Date(),
        },
      ],
    });

    cart.items = [];
    await cart.save();

    await createNotification({
      userId: req.user._id,
      title: `Order ${order.orderNumber} placed`,
      message: 'Your order was placed successfully and is awaiting payment/confirmation.',
      type: 'order',
      relatedId: order._id,
    });

    const populated = await Order.findById(order._id)
      .populate('buyerId', 'name email phone')
      .populate('sellerIds', 'businessName businessLocation');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.user.role === 'customer') {
      filter.buyerId = req.user._id;
    } else if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ userId: req.user._id });
      if (!seller) {
        res.status(404);
        throw new Error('Seller profile not found');
      }
      filter.sellerIds = seller._id;
    } else if (req.user.role === 'admin') {
      if (req.query.buyerId) filter.buyerId = req.query.buyerId;
    } else {
      res.status(403);
      throw new Error('Unauthorized');
    }

    if (req.query.status) filter.orderStatus = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('buyerId', 'name email phone')
        .populate('sellerIds', 'businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    let responseOrders = orders;
    if (req.user.role === 'seller') {
      const sellerDoc = await Seller.findOne({ userId: req.user._id });
      responseOrders = orders.map((order) => {
        const obj = order.toObject();
        obj.items = obj.items.filter(
          (item) => item.sellerId.toString() === sellerDoc._id.toString()
        );
        obj.sellerSubtotal = obj.items.reduce((sum, item) => sum + item.subtotal, 0);
        return obj;
      });
    }

    res.status(200).json({
      success: true,
      message: 'Orders retrieved',
      data: {
        orders: responseOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyerId', 'name email phone city county')
      .populate('sellerIds', 'businessName businessLocation contactInformation');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (req.user.role === 'customer' && order.buyerId._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You can only view your own orders.');
    }

    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ userId: req.user._id });
      const allowed = order.sellerIds.some(
        (id) => (id._id || id).toString() === seller._id.toString()
      );
      if (!allowed) {
        res.status(403);
        throw new Error('You can only view orders that include your products.');
      }

      const obj = order.toObject();
      obj.items = obj.items.filter(
        (item) => item.sellerId.toString() === seller._id.toString()
      );
      obj.sellerSubtotal = obj.items.reduce((sum, item) => sum + item.subtotal, 0);

      return res.status(200).json({
        success: true,
        message: 'Order retrieved',
        data: {
          order: obj,
          tracking: buildTrackingPayload(order),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved',
      data: {
        order,
        tracking: buildTrackingPayload(order),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:id/status
 * Seller or admin updates order/delivery status.
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, deliveryStatus, note = '' } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.orderStatus === 'Cancelled') {
      res.status(400);
      throw new Error('Cancelled orders cannot be updated.');
    }

    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ userId: req.user._id });
      const allowed = order.sellerIds.some((id) => id.toString() === seller._id.toString());
      if (!allowed) {
        res.status(403);
        throw new Error('You can only update orders that include your products.');
      }
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) {
      order.orderStatus = orderStatus;
      order.deliveryStatus = deliveryStatus || syncDeliveryStatus(orderStatus);
    } else if (deliveryStatus) {
      order.deliveryStatus = deliveryStatus;
    }

    pushStatusHistory(order, {
      status: order.orderStatus,
      deliveryStatus: order.deliveryStatus,
      note: note || `Status updated to ${order.orderStatus}`,
      updatedBy: req.user._id,
    });

    await order.save();

    if (orderStatus && orderStatus !== previousStatus) {
      await notifyOrderStatusChange(order, previousStatus, orderStatus);
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: {
        order,
        tracking: buildTrackingPayload(order),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:id/cancel
 * Customer cancels an eligible order and restores stock.
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const isBuyer = order.buyerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isAdmin) {
      res.status(403);
      throw new Error('You can only cancel your own orders.');
    }

    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
      res.status(400);
      throw new Error('This order can no longer be cancelled.');
    }

    if (order.paymentStatus === 'paid') {
      res.status(400);
      throw new Error('Paid orders cannot be cancelled here. Contact support for a refund.');
    }

    for (const item of order.items) {
      // eslint-disable-next-line no-await-in-loop
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: item.quantity },
        $set: { status: 'active' },
      });
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    pushStatusHistory(order, {
      status: 'Cancelled',
      deliveryStatus: 'not_shipped',
      note: order.cancellationReason,
      updatedBy: req.user._id,
    });
    await order.save();

    await notifyOrderStatusChange(order, previousStatus, 'Cancelled');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order,
        tracking: buildTrackingPayload(order),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id/tracking
 */
const getOrderTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (req.user.role === 'customer' && order.buyerId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You can only track your own orders.');
    }

    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ userId: req.user._id });
      const allowed = order.sellerIds.some((id) => id.toString() === seller._id.toString());
      if (!allowed) {
        res.status(403);
        throw new Error('You can only track orders that include your products.');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tracking retrieved',
      data: {
        tracking: buildTrackingPayload(order),
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/track/:orderNumber
 */
const trackByOrderNumber = async (req, res, next) => {
  try {
    const orderNumber = String(req.params.orderNumber || '').toUpperCase();
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (req.user.role === 'customer' && order.buyerId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You can only track your own orders.');
    }

    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ userId: req.user._id });
      const allowed = order.sellerIds.some((id) => id.toString() === seller._id.toString());
      if (!allowed) {
        res.status(403);
        throw new Error('You can only track orders that include your products.');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tracking retrieved',
      data: {
        tracking: buildTrackingPayload(order),
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderTracking,
  trackByOrderNumber,
};
