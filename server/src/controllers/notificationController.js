import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter(n => !n.read).length;
    sendSuccess(res, 200, 'Notifications fetched', { notifications, unreadCount });
  } catch (error) {
    logger.error('getNotifications error:', error);
    sendError(res, 500, 'Failed to fetch notifications');
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return sendError(res, 404, 'Notification not found');
    sendSuccess(res, 200, 'Marked as read', { notification });
  } catch (error) {
    logger.error('markAsRead error:', error);
    sendError(res, 500, 'Failed to mark notification');
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, read: false }, { read: true });
    sendSuccess(res, 200, 'All notifications marked as read');
  } catch (error) {
    logger.error('markAllAsRead error:', error);
    sendError(res, 500, 'Failed to mark all notifications');
  }
};
