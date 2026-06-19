import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import app         from './app.js';
import connectDB   from './config/db.js';
import initSockets from './sockets/index.js';
import { initNotificationService } from './services/notificationService.js';
import { startPriorityJob }        from './jobs/priorityJob.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSockets(io);
initNotificationService(io);

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  server.listen(PORT, () => {
    logger.info(`🚀 CivicConnect server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });

  // Start background jobs
  startPriorityJob();
};

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully…');
  server.close(() => process.exit(0));
});
