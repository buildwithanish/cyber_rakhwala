import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { logger, requestLogger } from './config/logger.js';
import { buildSwaggerSpec } from './config/swagger.js';
import { addResponseHelpers } from './middleware/response.middleware.js';
import { attachDebugRequestTracker } from './middleware/debug.middleware.js';
import { attachRequestContext } from './middleware/request.middleware.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { createRateLimiters } from './middleware/rateLimit.middleware.js';
import { registerRoutes } from './routes/index.js';
import { clearDebugSnapshot, getDebugSnapshot } from './utils/debug.store.js';

export const createApp = () => {
  const app = express();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const swaggerSpec = buildSwaggerSpec();
  const rateLimiters = createRateLimiters();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestLogger);
  app.use(attachDebugRequestTracker);
  app.use(attachRequestContext);
  app.use(addResponseHelpers);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
    })
  );
  app.use(compression());
  app.use(cookieParser());

  app.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buffer) => {
        req.rawBody = buffer.toString('utf8');
      }
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(
    '/uploads',
    express.static(path.resolve(__dirname, '..', env.uploads.localPath.replace(/^\.\//, '')))
  );

  app.get('/health', (_req, res) => {
    res.success({
      message: 'Service is healthy',
      data: {
        status: 'ok',
        environment: env.nodeEnv,
        timestamp: new Date().toISOString()
      }
    });
  });

  app.get('/docs/openapi.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  if (env.debugPanelEnabled) {
    app.get('/api/debug/status', (_req, res) => {
      res.success({
        message: 'Debug snapshot loaded',
        data: getDebugSnapshot()
      });
    });

    app.post('/api/debug/clear', (_req, res) => {
      clearDebugSnapshot();
      res.success({
        message: 'Debug snapshot cleared',
        data: getDebugSnapshot()
      });
    });
  }

  app.use('/api', rateLimiters.global);
  registerRoutes(app, { swaggerSpec, rateLimiters });

  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.debug('Express application created');
  return app;
};
