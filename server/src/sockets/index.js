import logger from '../utils/logger.js';

/**
 * Initialises Socket.IO event handlers.
 * Each authenticated user joins a personal room (their userId)
 * so notifications can be pushed directly to them.
 *
 * @param {import('socket.io').Server} io
 */
const initSockets = (io) => {
  io.on('connection', (socket) => {
    const { userId } = socket.handshake.auth;

    if (userId) {
      socket.join(userId);
      logger.debug(`Socket connected: ${socket.id} (user: ${userId})`);
    }

    // Client can join a room for a specific issue to get live status updates
    socket.on('join_issue', (issueId) => {
      socket.join(`issue:${issueId}`);
    });

    socket.on('leave_issue', (issueId) => {
      socket.leave(`issue:${issueId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
};

export default initSockets;
