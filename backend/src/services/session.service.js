import { RefreshToken } from '../models/RefreshToken.js';
import { Session } from '../models/Session.js';
import { createRefreshTokenPayload, hashOpaqueToken } from './token.service.js';

const parseDevice = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  const browser = ua.includes('chrome')
    ? 'Chrome'
    : ua.includes('firefox')
      ? 'Firefox'
      : ua.includes('safari')
        ? 'Safari'
        : 'Unknown';
  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('android')
      ? 'Android'
      : ua.includes('iphone') || ua.includes('ios')
        ? 'iOS'
        : ua.includes('mac')
          ? 'macOS'
          : 'Unknown';
  const kind = /mobile|android|iphone/.test(ua) ? 'Mobile' : 'Desktop';

  return { browser, os, kind };
};

export const createUserSession = async ({ user, req, family }) => {
  const refreshPayload = createRefreshTokenPayload();
  const session = await Session.create({
    user: user._id,
    device: parseDevice(req?.context?.userAgent),
    ipAddress: req?.context?.ipAddress ?? '',
    userAgent: req?.context?.userAgent ?? '',
    expiresAt: refreshPayload.expiresAt
  });

  const refreshToken = await RefreshToken.create({
    user: user._id,
    tokenHash: refreshPayload.tokenHash,
    family: family ?? refreshPayload.family,
    sessionId: session._id,
    expiresAt: refreshPayload.expiresAt,
    metadata: {
      ipAddress: req?.context?.ipAddress ?? ''
    }
  });

  session.refreshTokenId = refreshToken._id;
  await session.save();

  return {
    rawRefreshToken: refreshPayload.token,
    refreshToken,
    session
  };
};

export const rotateRefreshToken = async ({ rawToken, req }) => {
  const tokenHash = hashOpaqueToken(rawToken);
  const current = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null
  }).populate('user');

  if (!current || current.expiresAt < new Date()) {
    return null;
  }

  current.revokedAt = new Date();
  await current.save();

  if (current.sessionId) {
    await Session.findByIdAndUpdate(current.sessionId, {
      lastActivityAt: new Date(),
      ipAddress: req?.context?.ipAddress ?? '',
      userAgent: req?.context?.userAgent ?? ''
    });
  }

  const replacement = await createUserSession({
    user: current.user,
    req,
    family: current.family
  });

  replacement.refreshToken.rotatedFrom = current._id;
  await replacement.refreshToken.save();

  return {
    user: current.user,
    ...replacement
  };
};

export const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) {
    return;
  }

  const tokenHash = hashOpaqueToken(rawToken);
  const current = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!current) {
    return;
  }

  current.revokedAt = new Date();
  await current.save();
  await Session.findByIdAndUpdate(current.sessionId, {
    revokedAt: new Date(),
    isCurrent: false
  });
};

export const revokeAllUserSessions = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  await Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), isCurrent: false } }
  );
};

export const getUserSessions = async (userId) =>
  Session.find({ user: userId }).sort({ createdAt: -1 }).lean();

export const revokeSessionById = async ({ userId, sessionId }) => {
  const session = await Session.findOne({
    _id: sessionId,
    user: userId
  });

  if (!session) {
    return null;
  }

  session.revokedAt = new Date();
  session.isCurrent = false;
  await session.save();

  await RefreshToken.updateMany(
    {
      sessionId: session._id,
      revokedAt: null
    },
    {
      $set: {
        revokedAt: new Date()
      }
    }
  );

  return session;
};
