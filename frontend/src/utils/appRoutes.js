const toPathSegment = (value, fallback) => {
  const normalized = String(value || fallback)
    .trim()
    .replace(/^\/+|\/+$/g, '');

  return normalized || fallback;
};

export const ADMIN_LOGIN_SEGMENT = toPathSegment(
  import.meta.env.VITE_ADMIN_LOGIN_PATH,
  'deepaklogin'
);

export const ADMIN_API_SEGMENT = toPathSegment(
  import.meta.env.VITE_ADMIN_API_PATH,
  ADMIN_LOGIN_SEGMENT
);

export const ADMIN_LOGIN_PATH = `/${ADMIN_LOGIN_SEGMENT}`;
export const ADMIN_DASHBOARD_PATH = `/${ADMIN_LOGIN_SEGMENT}/console`;
export const ADMIN_API_BASE = `/${ADMIN_API_SEGMENT}`;
export const ADMIN_CONSOLE_ROLES = [
  'super_admin',
  'admin',
  'operations_manager',
  'support_admin',
  'support_agent',
  'analyst',
  'provider_manager',
  'content_manager'
];

export const isAdminConsoleRole = (role) => ADMIN_CONSOLE_ROLES.includes(role);

export const isDemoAuthEnabled = ['true', '1', 'yes', 'on'].includes(
  String(import.meta.env.VITE_ENABLE_DEMO_AUTH ?? 'false').toLowerCase()
);

export const getDashboardPath = (role) => {
  if (isAdminConsoleRole(role)) {
    return ADMIN_DASHBOARD_PATH;
  }

  if (role === 'user') {
    return '/dashboard/user';
  }

  return '/dashboard/student';
};
