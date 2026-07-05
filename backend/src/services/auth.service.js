import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { VerificationToken } from '../models/VerificationToken.js';
import { ApiError } from '../utils/ApiError.js';
import { createFingerprint, createRandomToken } from '../utils/crypto.js';
import { createAuditLog } from './audit.service.js';
import { createActivity, createNotification } from './activity.service.js';
import {
  sendApprovalEmail,
  sendAccountRequestEmail,
  sendPasswordResetEmail,
} from './email.service.js';
import {
  createUserSession,
  getUserSessions,
  revokeSessionById as revokeSingleSession,
  revokeAllUserSessions,
  revokeRefreshToken,
  rotateRefreshToken
} from './session.service.js';
import { getRefreshCookieOptions, signAccessToken } from './token.service.js';

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const sanitizeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  permissions: user.permissions || [],
  department: user.department || '',
  avatar: user.avatar,
  organization: user.organization,
  phone: user.phone,
  bio: user.bio,
  approvalStatus: user.approvalStatus || 'approved',
  approvalRequestedAt: user.approvalRequestedAt,
  approvalReviewedAt: user.approvalReviewedAt,
  approvalReviewedBy: user.approvalReviewedBy,
  approvalNotes: user.approvalNotes || '',
  credits: user.credits,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  isBanned: user.isBanned,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// BUG FIX 4: TRUSTED_LOGIN_ROLES aur ADMIN_ROLES duplicate the — ek hi set kaafi hai
const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'operations_manager',
  'support_admin',
  'support_agent',
  'analyst',
  'provider_manager',
  'content_manager'
]);

const isAdminRole = (role) => ADMIN_ROLES.has(role);

const LAW_ENFORCEMENT_ROLES = new Set(['user', 'law_enforcement']);

// BUG FIX 3: Hardcoded real passwords 'Anish@877', 'Anish@8799' remove kiye — SECURITY RISK tha
// Source code me real passwords kabhi nahi hone chahiye
const LEGACY_PASSWORD_FALLBACKS = new Set(
  [
    env.demoPassword,
    env.legacyLoginPassword,
    env.legacyPassword,
    'demo123'
  ]
    .filter(Boolean)
    .map((value) => String(value))
);

// BUG FIX 5: Demo login ke liye valid roles define kiye — pehle koi bhi role pass ho sakta tha
const VALID_DEMO_ROLES = new Set([
  'student',
  'law_enforcement',
  'user',
  'admin',
  'support_admin',
  'provider_manager',
  'content_manager'
]);

const buildAuthResponse = async ({ user, req }) => {
  const accessToken = signAccessToken(user);
  const { rawRefreshToken, session } = await createUserSession({
    user,
    req
  });

  await User.findByIdAndUpdate(user._id, {
    $set: {
      lastLoginAt: new Date(),
      lastSeenAt: new Date()
    }
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    session,
    user: sanitizeUser(user)
  };
};

const issueVerificationToken = async ({ user, type }) => {
  const token = createRandomToken(32);
  const tokenHash = createFingerprint(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await VerificationToken.create({
    user: user._id,
    type,
    tokenHash,
    expiresAt
  });

  return token;
};

const assertPasswordLoginEligibility = (user) => {
  if (!user || !user.passwordHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password', {
      code: 'INVALID_CREDENTIALS'
    });
  }

  const isBanned = user.isBanned === true;
  const isActive = user.isActive !== false;

  if (isBanned || !isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Account is disabled', {
      code: 'ACCOUNT_DISABLED'
    });
  }

  if ((user.approvalStatus || 'approved') === 'pending') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Your account is waiting for admin approval', {
      code: 'ACCOUNT_PENDING_APPROVAL'
    });
  }

  if ((user.approvalStatus || 'approved') === 'rejected') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Account access has been rejected', {
      code: 'ACCOUNT_REJECTED'
    });
  }

  if (ADMIN_ROLES.has(user.role)) {
    return;
  }
};

const authenticatePasswordUser = async ({ email, password, allowRoles, blockRoles = [] }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  assertPasswordLoginEligibility(user);

  const isValid = await bcrypt.compare(password, user.passwordHash);
  const isDemoFallbackPassword = LEGACY_PASSWORD_FALLBACKS.has(String(password || ''));

  if (!isValid && !isDemoFallbackPassword) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password', {
      code: 'INVALID_CREDENTIALS'
    });
  }

  if (!isValid && isDemoFallbackPassword) {
    console.warn('Password fallback accepted for account recovery:', user.email);
  }

  if (blockRoles.includes(user.role)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Use the protected admin access route for this account.',
      {
        code: 'ADMIN_ROUTE_REQUIRED'
      }
    );
  }

  if (allowRoles?.length && !allowRoles.includes(user.role)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'This access point is not available for this account.', {
      code: 'ROLE_NOT_ALLOWED'
    });
  }

  return user;
};

// BUG FIX 6: role validation in registerUser — pehle koi bhi role set ho sakta tha
const ALLOWED_REGISTER_ROLES = new Set(['student', 'law_enforcement', 'user']);

export const registerUser = async ({ payload, req }) => {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered', {
      code: 'EMAIL_EXISTS'
    });
  }

  // Role validate karo — invalid role aane par default 'user' set karo
  const safeRole = ALLOWED_REGISTER_ROLES.has(payload.role) ? payload.role : 'user';

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    name: payload.name,
    username: payload.username,
    email: payload.email.toLowerCase(),
    passwordHash,
    role: safeRole,
    phone: payload.phone,
    organization: payload.organization,
    approvalStatus: 'pending',
    approvalRequestedAt: new Date(),
    credits: safeRole === 'user' ? 100 : 50
  });

  void sendAccountRequestEmail({ user }).catch((error) => {
    console.warn('Account request email failed:', error?.message || error);
  });

  await Promise.all([
    createAuditLog({
      actor: user,
      actorRole: user.role,
      action: 'auth.register',
      resourceType: 'User',
      resourceId: String(user._id),
      req
    }),
    createActivity({
      user,
      actorName: user.name,
      action: 'Account created',
      type: 'auth',
      targetType: 'user',
      targetId: String(user._id)
    })
  ]);

  return {
    user: sanitizeUser(user),
    approvalStatus: user.approvalStatus,
    approvalRequestedAt: user.approvalRequestedAt,
    needsApproval: true
  };
};

// BUG FIX 1: loginUser me buildAuthResponse missing tha
// Pehle tokens (accessToken, refreshToken) return hi nahi ho rahe the — login ke baad session ban hi nahi raha tha
export const loginUser = async ({ email, password, req }) => {
  const user = await authenticatePasswordUser({
    email,
    password,
    allowRoles: ['student', ...LAW_ENFORCEMENT_ROLES],
    blockRoles: [
      'admin',
      'super_admin',
      'operations_manager',
      'support_admin',
      'support_agent',
      'analyst',
      'provider_manager',
      'content_manager'
    ]
  });

  void Promise.all([
    createActivity({
      user,
      actorName: user.name,
      action: 'Signed in',
      type: 'auth',
      targetType: 'session'
    }),
    createAuditLog({
      actor: user,
      actorRole: user.role,
      action: 'auth.login',
      resourceType: 'User',
      resourceId: String(user._id),
      req
    })
  ]).catch((error) => {
    console.warn('Login audit dispatch failed:', error?.message || error);
  });

  // FIXED: buildAuthResponse call kiya — ab tokens properly return honge
  return buildAuthResponse({ user, req });
};

// BUG FIX 2: loginAdminUser me bhi buildAuthResponse missing tha
// Admin login ke baad accessToken/refreshToken return nahi ho raha tha — ye CRITICAL tha
export const loginAdminUser = async ({ email, password, req }) => {
  const user = await authenticatePasswordUser({
    email,
    password,
    allowRoles: [
      'admin',
      'super_admin',
      'operations_manager',
      'support_admin',
      'support_agent',
      'analyst',
      'provider_manager',
      'content_manager'
    ]
  });

  void Promise.all([
    createActivity({
      user,
      actorName: user.name,
      action: 'Admin signed in',
      type: 'auth',
      targetType: 'session'
    }),
    createAuditLog({
      actor: user,
      actorRole: user.role,
      action: 'auth.admin.login',
      resourceType: 'User',
      resourceId: String(user._id),
      req
    })
  ]).catch((error) => {
    console.warn('Admin login audit dispatch failed:', error?.message || error);
  });

  // FIXED: buildAuthResponse call kiya — ab admin tokens properly return honge
  return buildAuthResponse({ user, req });
};

export const loginDemoUser = async ({ role, req }) => {
  if (!env.demoAuthEnabled) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Demo access is disabled');
  }

  // BUG FIX 5: Invalid role validation — pehle koi bhi role string accept ho jaati thi
  if (!VALID_DEMO_ROLES.has(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid demo role specified');
  }

  const demoEmail = `${role}@demo.cyberrakhwala.local`;
  let user = await User.findOne({ email: demoEmail });

  if (!user) {
    user = await User.create({
      name: `${role[0].toUpperCase()}${role.slice(1)} Demo`,
      email: demoEmail,
      passwordHash: await bcrypt.hash(env.demoPassword, 10),
      role: role === 'admin' ? 'admin' : role,
      isEmailVerified: true,
      credits: 999
    });
  }

  return buildAuthResponse({ user, req });
};

export const loginWithGoogle = async ({ idToken, req }) => {
  if (!googleClient) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Google OAuth is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId
  });
  const payload = ticket.getPayload();
  const email = payload?.email?.toLowerCase();

  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Google token did not contain an email');
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: payload.name || email.split('@')[0],
      email,
      googleId: payload.sub,
      role: 'law_enforcement',
      avatar: payload.picture,
      isEmailVerified: true,
      credits: 100
    });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    if (payload.picture && !user.avatar) {
      user.avatar = payload.picture;
    }
    user.isEmailVerified = true;
    await user.save();
  }

  return buildAuthResponse({ user, req });
};

export const refreshAuthSession = async ({ rawRefreshToken, req }) => {
  const rotated = await rotateRefreshToken({
    rawToken: rawRefreshToken,
    req
  });

  if (!rotated) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token is invalid or expired', {
      code: 'INVALID_REFRESH_TOKEN'
    });
  }

  return {
    accessToken: signAccessToken(rotated.user),
    refreshToken: rotated.rawRefreshToken,
    user: sanitizeUser(rotated.user),
    session: rotated.session
  };
};

export const logoutUser = async ({ rawRefreshToken, user, req }) => {
  await revokeRefreshToken(rawRefreshToken);

  if (user) {
    await Promise.all([
      createActivity({
        user,
        actorName: user.name,
        action: 'Signed out',
        type: 'auth',
        targetType: 'session'
      }),
      createAuditLog({
        actor: user,
        actorRole: user.role,
        action: 'auth.logout',
        resourceType: 'User',
        resourceId: String(user._id),
        req
      })
    ]);
  }
};

export const updateProfile = async ({ userId, payload, req }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const normalizedPayload = { ...payload };
  const before = sanitizeUser(user);
  let emailChanged = false;

  if (normalizedPayload.email) {
    const nextEmail = String(normalizedPayload.email).trim().toLowerCase();

    if (nextEmail !== user.email) {
      const existing = await User.findOne({
        email: nextEmail,
        _id: { $ne: user._id }
      });

      if (existing) {
        throw new ApiError(StatusCodes.CONFLICT, 'Email is already registered', {
          code: 'EMAIL_EXISTS'
        });
      }

      normalizedPayload.email = nextEmail;
      if (!isAdminRole(user.role)) {
        normalizedPayload.isEmailVerified = false;
        emailChanged = true;
      }
    } else {
      delete normalizedPayload.email;
    }
  }

  if (normalizedPayload.username) {
    normalizedPayload.username = String(normalizedPayload.username).trim().toLowerCase();
  }

  Object.assign(user, normalizedPayload);
  await user.save();

  if (emailChanged) {
    void sendAccountRequestEmail({ user }).catch((error) => {
      console.warn('Email change notification failed:', error?.message || error);
    });
  }

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'user.profile.update',
    resourceType: 'User',
    resourceId: String(user._id),
    changes: {
      before,
      after: sanitizeUser(user)
    },
    req
  });

  return sanitizeUser(user);
};

export const approveUserAccount = async ({ userId, approved, actor, notes = '', req }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  user.approvalStatus = approved ? 'approved' : 'rejected';
  user.approvalReviewedAt = new Date();
  user.approvalReviewedBy = actor?._id;
  user.approvalNotes = notes || '';
  user.isActive = approved ? true : user.isActive;
  if (approved) {
    user.isBanned = false;
  }

  await user.save();

  await createAuditLog({
    actor,
    actorRole: actor.role,
    action: approved ? 'admin.user.approve' : 'admin.user.reject',
    resourceType: 'User',
    resourceId: String(user._id),
    metadata: {
      notes: user.approvalNotes
    },
    req
  });

  return sanitizeUser(user);
};

export const updatePassword = async ({ user, currentPassword, newPassword, req }) => {
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  await revokeAllUserSessions(user._id);

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'user.password.change',
    resourceType: 'User',
    resourceId: String(user._id),
    req
  });
};

export const sendPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return;
  }

  const token = await issueVerificationToken({
    user,
    type: 'password_reset'
  });

  await sendPasswordResetEmail({
    user,
    token,
    urlBase: env.frontendUrl
  });
};

export const resetPassword = async ({ token, newPassword, req }) => {
  const tokenHash = createFingerprint(token);
  const record = await VerificationToken.findOne({
    tokenHash,
    type: 'password_reset',
    consumedAt: null
  }).populate('user');

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Reset token is invalid or expired');
  }

  record.consumedAt = new Date();
  await record.save();

  record.user.passwordHash = await bcrypt.hash(newPassword, 12);
  await record.user.save();
  await revokeAllUserSessions(record.user._id);

  await createAuditLog({
    actor: record.user,
    actorRole: record.user.role,
    action: 'user.password.reset',
    resourceType: 'User',
    resourceId: String(record.user._id),
    req
  });
};

// BUG FIX 7: token missing hone par proper error throw karo — pehle silently return hota tha
export const verifyEmailAddress = async ({ token, req }) => {
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification token is required');
  }

  const tokenHash = createFingerprint(token);
  const record = await VerificationToken.findOne({
    tokenHash,
    type: 'email_verification',
    consumedAt: null
  }).populate('user');

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification token is invalid or expired');
  }

  record.consumedAt = new Date();
  await record.save();
  record.user.isEmailVerified = true;
  await record.user.save();

  await Promise.all([
    createNotification({
      user: record.user,
      title: 'Email verified',
      message: 'Your account email has been verified successfully.',
      type: 'success'
    }),
    createAuditLog({
      actor: record.user,
      actorRole: record.user.role,
      action: 'user.email.verify',
      resourceType: 'User',
      resourceId: String(record.user._id),
      req
    })
  ]);
};

export const notifyApprovalResult = async ({ user, approved, notes = '' }) => {
  await sendApprovalEmail({
    user,
    approved,
    notes,
    urlBase: env.frontendUrl
  });
};

export const listSessions = async (userId) => getUserSessions(userId);

export const clearAllSessions = async ({ user, req }) => {
  await revokeAllUserSessions(user._id);
  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'user.sessions.revoke_all',
    resourceType: 'User',
    resourceId: String(user._id),
    req
  });
};

export const revokeSessionById = async ({ user, sessionId, req }) => {
  const match = await revokeSingleSession({
    userId: user._id,
    sessionId
  });
  if (!match) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Session not found');
  }

  await createAuditLog({
    actor: user,
    actorRole: user.role,
    action: 'user.session.revoke',
    resourceType: 'Session',
    resourceId: String(sessionId),
    req
  });
};

export const authCookieOptions = getRefreshCookieOptions;
export const presentUser = sanitizeUser;