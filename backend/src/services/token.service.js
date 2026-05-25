import jwt from 'jsonwebtoken';
import ms from 'ms';
import { env } from '../config/env.js';
import { createFingerprint, createRandomToken } from '../utils/crypto.js';

export const signAccessToken = (user) =>
  jwt.sign(
    {
      role: user.role,
      email: user.email
    },
    env.jwt.accessSecret,
    {
      subject: String(user._id),
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
      expiresIn: env.jwt.accessTtl
    }
  );

export const createRefreshTokenPayload = () => {
  const token = createRandomToken(48);
  return {
    token,
    tokenHash: createFingerprint(token),
    family: createRandomToken(16),
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshTtl))
  };
};

export const hashOpaqueToken = (token) => createFingerprint(token);

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookies.secure,
  sameSite: env.cookies.sameSite,
  domain: env.cookies.domain,
  path: '/api/auth',
  expires: new Date(Date.now() + ms(env.jwt.refreshTtl))
});
