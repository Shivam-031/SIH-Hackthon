import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

let _io = null;

export const initNotificationService = (io) => {
  _io = io;
};

/**
 * Creates a notification in the DB and pushes it live via Socket.IO.
 *
 * @param {string} userId
 * @param {string} title
 * @param {string} message
 * @param {string} type
 * @param {string|null} issueId
 */
export const createNotification = async (userId, title, message, type, issueId = null) => {
  try {
    const notification = await Notification.create({ userId, title, message, type, issueId });

    if (_io) {
      _io.to(userId.toString()).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    logger.error('createNotification error:', error.message);
  }
};
