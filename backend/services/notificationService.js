const Notification = require('../models/Notification');

/**
 * Create an in-app notification for a user.
 */
const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  relatedId = null,
}) => {
  if (!userId || !title || !message) {
    return null;
  }

  return Notification.create({
    userId,
    title,
    message,
    type,
    relatedId,
    readStatus: false,
  });
};

/**
 * Notify buyer about an order status change.
 */
const notifyOrderStatusChange = async (order, previousStatus, nextStatus) => {
  return createNotification({
    userId: order.buyerId,
    title: `Order ${order.orderNumber} updated`,
    message: `Your order moved from ${previousStatus} to ${nextStatus}.`,
    type: nextStatus === 'Delivered' || nextStatus === 'Out for Delivery' ? 'delivery' : 'order',
    relatedId: order._id,
  });
};

module.exports = {
  createNotification,
  notifyOrderStatusChange,
};
