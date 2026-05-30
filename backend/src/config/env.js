import dotenv from 'dotenv';

dotenv.config();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseList = (value, fallback = []) => {
  if (!value) {
    return fallback;
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePathSegment = (value, fallback) => {
  const normalized = String(value || fallback)
    .trim()
    .replace(/^\/+|\/+$/g, '');

  return normalized || fallback;
};

const normalizeOrigin = (value, fallback = '') => {
  const normalized = String(value || fallback)
    .trim()
    .replace(/\/+$/g, '');

  return normalized;
};

const getCorsOrigins = () => {
  const raw = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  return raw
    .split(',')
    .map((value) => normalizeOrigin(value))
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber(process.env.PORT, 5000),
  appName: process.env.APP_NAME ?? 'Cyber Rakhwala API',
  appUrl: normalizeOrigin(process.env.APP_URL, 'http://localhost:5000'),
  openApiServerUrl: normalizeOrigin(
    process.env.OPENAPI_SERVER_URL ?? process.env.APP_URL,
    'http://localhost:5000'
  ),
  frontendUrl: normalizeOrigin(process.env.FRONTEND_URL, 'http://localhost:3000'),
  corsOrigins: getCorsOrigins(),
  dnsServers: parseList(process.env.DNS_SERVERS, ['1.1.1.1', '8.8.8.8']),
  debugPanelEnabled: parseBoolean(process.env.DEBUG_PANEL_ENABLED, process.env.NODE_ENV !== 'production'),
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/cyber-rakhwala',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'development-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'development-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    issuer: process.env.JWT_ISSUER ?? 'cyber-rakhwala',
    audience: process.env.JWT_AUDIENCE ?? 'cyber-rakhwala-web'
  },
  cookies: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: parseBoolean(process.env.COOKIE_SECURE, false),
    sameSite: process.env.COOKIE_SAME_SITE ?? 'lax'
  },
  admin: {
    panelPath: parsePathSegment(process.env.ADMIN_PANEL_PATH, 'deepaklogin'),
    allowLegacyRoute: parseBoolean(process.env.ADMIN_ALLOW_LEGACY_ROUTE, false)
  },
  demoAuthEnabled: parseBoolean(process.env.ENABLE_DEMO_AUTH, false),
  demoPassword: process.env.DEMO_PASSWORD ?? 'demo123',
  seedDemoUsers: parseBoolean(process.env.SEED_DEMO_USERS, false),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE, parseNumber(process.env.SMTP_PORT, 587) === 465),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    fromName: process.env.EMAIL_FROM_NAME ?? 'Cyber Rakhwala',
    fromAddress: process.env.EMAIL_FROM_ADDRESS ?? process.env.SMTP_USER ?? 'no-reply@example.com'
  },
  uploads: {
    storage: process.env.UPLOAD_STORAGE ?? 'local',
    localPath: process.env.UPLOAD_LOCAL_PATH ?? './src/uploads'
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? ''
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    prices: {
      starter: process.env.STRIPE_PRICE_STARTER ?? '',
      basic: process.env.STRIPE_PRICE_BASIC ?? '',
      pro: process.env.STRIPE_PRICE_PRO ?? '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? ''
    }
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
  },
  captcha: {
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY ?? '',
    turnstileSecret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ?? ''
  },
  billing: {
    defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'INR',
    trialDays: parseNumber(process.env.TRIAL_DAYS, 7)
  },
  rateLimits: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 300),
    authMax: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 20),
    searchMax: parseNumber(process.env.SEARCH_RATE_LIMIT_MAX, 60)
  },
  features: {
    chatbot: parseBoolean(process.env.FEATURE_ENABLE_CHATBOT, true),
    datasetSearch: parseBoolean(process.env.FEATURE_ENABLE_DATASET_SEARCH, true),
    providerConnectors: parseBoolean(process.env.FEATURE_ENABLE_PROVIDER_CONNECTORS, true),
    threatSimulator: parseBoolean(process.env.FEATURE_ENABLE_THREAT_SIMULATOR, true)
  },
  logLevel: process.env.LOG_LEVEL ?? 'info'
};
