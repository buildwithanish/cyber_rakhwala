import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authCookieOptions,
  clearAllSessions,
  loginAdminUser,
  listSessions,
  loginDemoUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  presentUser,
  refreshAuthSession,
  registerUser,
  resetPassword,
  revokeSessionById,
  sendOtpCode,
  sendPasswordReset,
  updatePassword,
  updateProfile,
  verifyLoginOtpAndIssueSession,
  verifyEmailAddress,
  verifyOtpCode
} from '../services/auth.service.js';

const refreshCookieName = 'cyber_rakhwala_refresh';

const setRefreshCookie = (res, token) => {
  res.cookie(refreshCookieName, token, authCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(refreshCookieName, {
    ...authCookieOptions(),
    expires: new Date(0)
  });
};

const getRefreshToken = (req) => req.cookies?.[refreshCookieName] || req.body?.refreshToken || null;

const sendAuthPayload = (res, payload, message) => {
  setRefreshCookie(res, payload.refreshToken);
  res.success({
    message,
    data: {
      accessToken: payload.accessToken,
      token: payload.accessToken,
      session: payload.session,
      user: payload.user
    }
  });
};

export const register = asyncHandler(async (req, res) => {
  const payload = await registerUser({
    payload: req.validated.body,
    req
  });
  res.success({
    statusCode: 202,
    message: 'Account request submitted for admin approval',
    data: payload
  });
});

export const login = asyncHandler(async (req, res) => {
  const payload = await loginUser({
    email: req.validated.body.email,
    password: req.validated.body.password,
    req
  });
  if (payload.requiresOtp) {
    res.success({
      statusCode: 202,
      message: payload.message,
      data: payload
    });
    return;
  }
  sendAuthPayload(res, payload, 'Signed in successfully');
});

export const adminLogin = asyncHandler(async (req, res) => {
  const payload = await loginAdminUser({
    email: req.validated.body.email,
    password: req.validated.body.password,
    req
  });
  if (payload.requiresOtp) {
    res.success({
      statusCode: 202,
      message: payload.message,
      data: payload
    });
    return;
  }
  sendAuthPayload(res, payload, 'Admin signed in successfully');
});

export const demoLogin = asyncHandler(async (req, res) => {
  const payload = await loginDemoUser({
    role: req.validated.body.role,
    req
  });
  sendAuthPayload(res, payload, 'Demo session started');
});

export const googleLogin = asyncHandler(async (req, res) => {
  const payload = await loginWithGoogle({
    idToken: req.validated.body.idToken,
    req
  });
  sendAuthPayload(res, payload, 'Signed in with Google');
});

export const refresh = asyncHandler(async (req, res) => {
  const payload = await refreshAuthSession({
    rawRefreshToken: getRefreshToken(req),
    req
  });
  sendAuthPayload(res, payload, 'Session refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser({
    rawRefreshToken: getRefreshToken(req),
    user: req.user,
    req
  });
  clearRefreshCookie(res);
  res.success({
    message: 'Signed out successfully'
  });
});

export const me = asyncHandler(async (req, res) => {
  res.success({
    message: 'Current user loaded',
    data: presentUser(req.user)
  });
});

export const profileUpdate = asyncHandler(async (req, res) => {
  const user = await updateProfile({
    userId: req.user._id,
    payload: req.validated.body,
    req
  });
  res.success({
    message: 'Profile updated',
    data: {
      user
    }
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  await updatePassword({
    user: req.user,
    currentPassword: req.validated.body.currentPassword,
    newPassword: req.validated.body.newPassword,
    req
  });
  clearRefreshCookie(res);
  res.success({
    message: 'Password changed. Please sign in again.'
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await sendPasswordReset({
    email: req.validated.body.email
  });
  res.success({
    message: 'If the account exists, a password reset email has been sent.'
  });
});

export const performPasswordReset = asyncHandler(async (req, res) => {
  await resetPassword({
    token: req.validated.body.token,
    newPassword: req.validated.body.newPassword,
    req
  });
  res.success({
    message: 'Password reset successfully'
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  await verifyEmailAddress({
    token: req.validated.body.token,
    req
  });
  res.success({
    message: 'Email verified successfully'
  });
});

export const sendOtp = asyncHandler(async (req, res) => {
  await sendOtpCode(req.validated.body);
  res.success({
    message: 'OTP sent successfully'
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  await verifyOtpCode(req.validated.body);
  res.success({
    message: 'OTP verified successfully'
  });
});

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const payload = await verifyLoginOtpAndIssueSession({
    email: req.validated.body.email,
    code: req.validated.body.code,
    req
  });
  sendAuthPayload(res, payload, 'Signed in successfully');
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await listSessions(req.user._id);
  res.success({
    message: 'Sessions loaded',
    data: sessions
  });
});

export const logoutAllSessions = asyncHandler(async (req, res) => {
  await clearAllSessions({
    user: req.user,
    req
  });
  clearRefreshCookie(res);
  res.success({
    message: 'All sessions revoked'
  });
});

export const deleteSession = asyncHandler(async (req, res) => {
  await revokeSessionById({
    user: req.user,
    sessionId: req.validated.params.id,
    req
  });
  res.success({
    message: 'Session revoked'
  });
});
