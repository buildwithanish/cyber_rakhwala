import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import { ADMIN_CONSOLE_ROLES, ADMIN_DASHBOARD_PATH } from '../../utils/appRoutes';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, updateUser, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated && ADMIN_CONSOLE_ROLES.includes(user?.role)) {
      navigate(ADMIN_DASHBOARD_PATH, { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    clearError();
    setIsSubmitting(true);

    try {
      const response = requiresOtp
        ? await authService.verifyLoginOtp(email, otpCode)
        : await adminService.login(email, password);

      if (response?.requiresOtp) {
        setRequiresOtp(true);
        setOtpCode('');
        setError(response.message || 'A verification code has been sent to your email.');
        return;
      }

      const nextUser = response?.user || authService.getUser();

      if (!nextUser || !ADMIN_CONSOLE_ROLES.includes(nextUser.role)) {
        await authService.logout();
        throw new Error('This access point is restricted to admin accounts.');
      }

      updateUser(nextUser, false);
      navigate(ADMIN_DASHBOARD_PATH, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Admin authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid w-full overflow-hidden rounded-[32px] border border-cyan-500/20 bg-slate-950/80 shadow-[0_30px_100px_rgba(6,182,212,0.18)] backdrop-blur-xl lg:grid-cols-[1.15fr,0.85fr]"
        >
          <div className="hidden border-r border-white/10 p-10 lg:block">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
              <Shield className="h-4 w-4" />
              Restricted administrative access
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Hidden control access for Cyber Rakhwala operations.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">
              This route is intentionally unlinked from the public interface. Successful sign-in opens
              the operator dashboard backed by the protected admin API surface.
            </p>
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                JWT + refresh-token session flow
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Role-gated admin APIs with audit logging
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Provider, pricing, feature-toggle, and search-log controls
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Admin Login</p>
              <h2 className="mt-3 text-3xl font-semibold">Authenticate to continue</h2>
              <p className="mt-3 text-sm text-slate-400">
                Use an authorized staff account such as `admin`, `super_admin`, `support_admin`, `provider_manager`, or `content_manager`.
              </p>
            </div>

            {error ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            {isAuthenticated && user && !ADMIN_CONSOLE_ROLES.includes(user.role) ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  You are currently signed in as `{user.email}` with role `{user.role}`. Continuing here
                  will switch this browser session to the admin/staff account you enter below.
                </span>
              </div>
            ) : null}

            {location.state?.reason === 'protected-admin-route' ? (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-200">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  This account must use the protected admin access route. Continue signing in below.
                </span>
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none transition focus:border-cyan-500/50"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@cyberrakhwala.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Password</span>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-white outline-none transition focus:border-cyan-500/50"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {requiresOtp ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-300">Verification Code</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white outline-none transition focus:border-cyan-500/50 tracking-[0.3em] text-center"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required={requiresOtp}
                  />
                </label>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-[0_15px_40px_rgba(6,182,212,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {requiresOtp ? 'Verifying code' : 'Signing in'}
                  </>
                ) : (
                  <>
                    {requiresOtp ? 'Verify & Continue' : 'Continue'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
