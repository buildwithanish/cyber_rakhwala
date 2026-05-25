import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

const getBearerToken = (req) => {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
};

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required', {
      code: 'AUTH_REQUIRED'
    });
  }

  const payload = jwt.verify(token, env.jwt.accessSecret, {
    issuer: env.jwt.issuer,
    audience: env.jwt.audience
  });

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'User session is no longer valid', {
      code: 'INVALID_SESSION'
    });
  }

  req.user = user;
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret, {
      issuer: env.jwt.issuer,
      audience: env.jwt.audience
    });
    req.user = await User.findById(payload.sub);
  } catch {
    req.user = null;
  }

  next();
});
