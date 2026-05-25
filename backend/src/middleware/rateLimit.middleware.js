import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const createLimiter = (max, message) =>
  rateLimit({
    windowMs: env.rateLimits.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      code: 'RATE_LIMITED'
    }
  });

export const createRateLimiters = () => ({
  global: createLimiter(env.rateLimits.max, 'Too many requests, please slow down.'),
  auth: createLimiter(env.rateLimits.authMax, 'Too many authentication attempts.'),
  search: createLimiter(env.rateLimits.searchMax, 'Search rate limit exceeded.')
});
