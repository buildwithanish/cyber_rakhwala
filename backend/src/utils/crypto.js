import crypto from 'node:crypto';

export const createRandomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export const createOtp = (length = 6) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

export const createFingerprint = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');
