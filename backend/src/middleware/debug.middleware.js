import { recordDebugRequest } from '../utils/debug.store.js';

export const attachDebugRequestTracker = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    recordDebugRequest({
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ipAddress: req.ip
    });
  });

  next();
};
