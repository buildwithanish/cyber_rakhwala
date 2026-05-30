import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  changePassword,
  deleteSession,
  demoLogin,
  forgotPassword,
  getSessions,
  googleLogin,
  login,
  logout,
  logoutAllSessions,
  me,
  performPasswordReset,
  profileUpdate,
  refresh,
  register,
  sendOtp,
  verifyLoginOtp,
  verifyEmail,
  verifyOtp
} from '../../controllers/auth.controller.js';
import {
  changePasswordSchema,
  demoLoginSchema,
  emailOnlySchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  sessionParamSchema,
  updateProfileSchema,
  verifyLoginOtpSchema,
  verifyOtpSchema,
  verifyTokenSchema
} from '../../validators/auth.validator.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/demo', validate(demoLoginSchema), demoLogin);
router.post('/google', validate(googleLoginSchema), googleLogin);
router.post('/refresh-token', refresh);
router.post('/forgot-password', validate(emailOnlySchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), performPasswordReset);
router.post('/verify-email', validate(verifyTokenSchema), verifyEmail);
router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/verify-login-otp', validate(verifyLoginOtpSchema), verifyLoginOtp);
router.post('/logout', optionalAuthenticate, logout);

router.get('/me', authenticate, me);
router.put('/profile', authenticate, validate(updateProfileSchema), profileUpdate);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/sessions', authenticate, getSessions);
router.delete('/sessions', authenticate, logoutAllSessions);
router.delete('/sessions/:id', authenticate, validate(sessionParamSchema), deleteSession);

export default router;
