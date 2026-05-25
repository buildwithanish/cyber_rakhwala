import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';
import { hasPermission } from '../utils/permissions.js';

export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to this resource', {
        code: 'FORBIDDEN'
      })
    );
  }

  return next();
};

export const authorizePermissions = (...permissions) => (req, _res, next) => {
  if (!req.user) {
    return next(
      new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required', {
        code: 'AUTH_REQUIRED'
      })
    );
  }

  const allowed = permissions.every((permission) => hasPermission(req.user, permission));
  if (!allowed) {
    return next(
      new ApiError(StatusCodes.FORBIDDEN, 'Missing required permissions', {
        code: 'MISSING_PERMISSIONS'
      })
    );
  }

  return next();
};
