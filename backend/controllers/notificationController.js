const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const unreadOnly = req.query.unread === 'true';
    const filter = { userId: req.user._id };
    if (unreadOnly) filter.readStatus = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ userId: req.user._id, readStatus: false }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved',
      data: { notifications, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { readStatus: true },
      { new: true }
    );

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readStatus: false },
      { readStatus: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
