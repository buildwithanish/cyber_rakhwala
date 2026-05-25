import { buildSuccessResponse } from '../utils/response.js';

export const addResponseHelpers = (_req, res, next) => {
  res.success = ({ statusCode = 200, message, data = null, meta } = {}) =>
    res.status(statusCode).json(buildSuccessResponse({ message, data, meta }));

  next();
};
