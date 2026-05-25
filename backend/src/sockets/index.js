import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let io;

export const initializeSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigins,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket disconnected');
    });
  });
};

export const getIo = () => io;

export const emitThreatEvent = (event) => {
  if (io) {
    io.emit('threat:event', event);
  }
};

export const emitNotification = ({ userId, notification }) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
};
