import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { buildErrorResponse } from '../utils/response.js';
import { recordDebugError } from '../utils/debug.store.js';

export const errorHandler = (error, req, res, _next) => {
  let statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = error.message || 'Internal server error';
  let code = error.code;
  let details = error.details;

  if (error instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = error.flatten();
  }

  if (error?.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Session expired';
    code = 'TOKEN_EXPIRED';
  }

  if (error?.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Authentication token is invalid';
    code = 'INVALID_TOKEN';
  }

  logger.error(
    {
      err: error,
      requestId: req.id,
      path: req.originalUrl,
      method: req.method
    },
    message
  );

  recordDebugError({
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    message,
    code: code || error.code || null,
    stack: req.app.get('env') === 'production' ? null : error.stack || null
  });

  res.status(statusCode).json(
    buildErrorResponse({
      message,
      code,
      details: envAwareDetails(req.app.get('env'), details)
    })
  );
};

const envAwareDetails = (envName, details) => {
  if (envName === 'production') {
    return details;
  }

  return details;
};
