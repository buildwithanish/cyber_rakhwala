import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { env } from './env.js';

export const logger = pino({
  level: env.logLevel,
  transport:
    env.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false
          }
        }
      : undefined
});

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const requestId = existing || randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps: (req) => ({
    requestId: req.id
  })
});
