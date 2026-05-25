import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import CaptchaWidget from '../../components/common/CaptchaWidget';
import { getDashboardPath, isDemoAuthEnabled } from '../../utils/appRoutes';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  Sparkles,
  Users,
  Zap,
  Globe
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginAsDemo, isLoading, authError, clearError, isAuthenticated, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardPath(user.role));
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (authError) clearError();
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check CAPTCHA token (optional - can be disabled if not configured)
    if (!captchaToken && import.meta.env.VITE_CAPTCHA_PROVIDER) {
      setCaptchaError(true);
      return;
    }
    const result = await login(email, password, captchaToken);
    if (result.success) {
      navigate(getDashboardPath(result.user?.role || user?.role));
    }
  };

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    setCaptchaError(false);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setCaptchaError(true);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  const handleDemoLogin = (role) => {
    loginAsDemo(role);
  };

  const features = [
    { icon: Globe, text: '50+ OSINT Tools' },
    { icon: Zap, text: 'AI-Powered Analysis' },
    { icon: Users, text: 'Team Collaboration' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/25">
                <img src="/images/cr-logo.png" alt="CR Logo" className="w-14 h-14 object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Papyrus, fantasy' }}>Cyber Rakhwala</h1>
                <p className="text-slate-400 text-sm">OSINT Investigation Platform</p>
              </div>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Intelligence at your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                fingertips
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">
              Access powerful OSINT tools, conduct investigations, and uncover insights with our comprehensive platform.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-slate-300">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <img src="/images/cr-logo.png" alt="CR Logo" className="w-12 h-12 object-contain" />
              </div>
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Papyrus, fantasy' }}>Cyber Rakhwala</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Sign in to continue your investigation</p>
          </div>

          {/* Error Message */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{authError}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${
                focusedField === 'email' ? 'ring-2 ring-cyan-500/50' : ''
              }`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors ${
                    focusedField === 'email' ? 'text-cyan-400' : 'text-slate-500'
                  }`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${
                focusedField === 'password' ? 'ring-2 ring-cyan-500/50' : ''
              }`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors ${
                    focusedField === 'password' ? 'text-cyan-400' : 'text-slate-500'
                  }`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* CAPTCHA Widget */}
            <div className="flex justify-center">
              <CaptchaWidget
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpired={handleCaptchaExpired}
                theme="dark"
                showStatus={false}
              />
            </div>

            {/* CAPTCHA Error */}
            {captchaError && (
              <p className="text-red-400 text-sm text-center">Please complete the CAPTCHA verification</p>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Signup Link */}
          <p className="mt-6 text-center text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Create one
            </Link>
          </p>

          {isDemoAuthEnabled ? (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-slate-500">Or try a demo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => handleDemoLogin('student')}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white text-sm">Student/Individual</p>
                      <p className="text-xs text-slate-500">Limited access</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => handleDemoLogin('user')}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white text-sm">Law Enforcement</p>
                      <p className="text-xs text-slate-500">Full access</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </>
          ) : null}

          {/* Footer */}
          <p className="mt-8 text-center text-slate-600 text-xs">
            © 2026 <span style={{ fontFamily: 'Papyrus, fantasy' }}>Cyber Rakhwala</span>. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
