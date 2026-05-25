import { StatusCodes } from 'http-status-codes';
import { buildErrorResponse } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json(
    buildErrorResponse({
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND'
    })
  );
};
