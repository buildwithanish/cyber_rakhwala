export const rolePermissions = {
  super_admin: ['*'],
  admin: [
    'admin:access',
    'users:read',
    'users:update',
    'users:ban',
    'plans:manage',
    'payments:manage',
    'subscriptions:manage',
    'providers:manage',
    'apiKeys:manage',
    'datasets:manage',
    'coupons:manage',
    'content:manage',
    'featureToggles:manage',
    'tickets:manage',
    'roles:manage',
    'settings:manage',
    'analytics:read',
    'searchLogs:read',
    'threatMap:manage'
  ],
  operations_manager: [
    'admin:access',
    'users:read',
    'users:update',
    'plans:manage',
    'payments:manage',
    'subscriptions:manage',
    'analytics:read',
    'searchLogs:read',
    'tickets:manage'
  ],
  support_admin: [
    'admin:access',
    'users:read',
    'users:update',
    'tickets:manage',
    'searchLogs:read',
    'analytics:read'
  ],
  support_agent: [
    'admin:access',
    'users:read',
    'tickets:manage'
  ],
  analyst: [
    'admin:access',
    'analytics:read',
    'searchLogs:read',
    'threatMap:manage',
    'users:read'
  ],
  provider_manager: [
    'admin:access',
    'providers:manage',
    'apiKeys:manage',
    'datasets:manage',
    'analytics:read',
    'featureToggles:manage'
  ],
  content_manager: [
    'admin:access',
    'content:manage',
    'settings:manage',
    'featureToggles:manage',
    'coupons:manage'
  ],
  user: [
    'profile:read',
    'profile:update',
    'cases:read',
    'cases:write',
    'evidence:read',
    'evidence:write',
    'tools:execute',
    'notifications:read'
  ],
  student: [
    'profile:read',
    'profile:update',
    'cases:read',
    'tools:execute',
    'notifications:read'
  ]
};

export const hasPermission = (user, requiredPermission) => {
  if (!user) {
    return false;
  }

  const permissions = user.permissions?.length
    ? user.permissions
    : rolePermissions[user.role] || [];

  return permissions.includes('*') || permissions.includes(requiredPermission);
};
