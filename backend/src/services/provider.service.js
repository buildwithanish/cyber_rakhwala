import axios from 'axios';
import { ProviderConfig } from '../models/ProviderConfig.js';

const interpolate = (template, context) => {
  if (Array.isArray(template)) {
    return template.map((item) => interpolate(item, context));
  }

  if (template && typeof template === 'object') {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [key, interpolate(value, context)])
    );
  }

  if (typeof template === 'string') {
    return template.replace(/\{\{(.*?)\}\}/g, (_match, token) => {
      const value = context[token.trim()];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  return template;
};

const buildAuth = (provider) => {
  const secret = provider.secretRef || '';
  if (provider.authType === 'bearer') {
    return { Authorization: `Bearer ${secret}` };
  }

  if (provider.authType === 'api_key_header') {
    return { 'x-api-key': secret };
  }

  if (provider.authType === 'basic') {
    return {
      Authorization: `Basic ${Buffer.from(secret).toString('base64')}`
    };
  }

  return {};
};

const hasUsableCredential = (provider) => {
  if (!provider) {
    return false;
  }

  if (provider.authType === 'none') {
    return true;
  }

  return Boolean(String(provider.secretRef || '').trim());
};

export const getEnabledProviders = async (toolId) => {
  const providers = await ProviderConfig.find({
    enabled: true,
    $or: [{ toolIds: toolId }, { toolIds: { $size: 0 } }]
  })
    .sort({ priority: 1, createdAt: 1 })
    .lean();

  return providers.filter(hasUsableCredential);
};

export const executeProviderSearch = async ({ provider, toolId, action, query, payload = {} }) => {
  const context = {
    toolId,
    action,
    query,
    secret: provider.secretRef || '',
    ...payload
  };

  const config = {
    method: provider.method,
    url: provider.baseUrl,
    headers: {
      ...provider.headers,
      ...buildAuth(provider)
    },
    params: interpolate(provider.queryTemplate || {}, context),
    data: interpolate(provider.bodyTemplate || {}, context),
    timeout: 15000
  };

  const response = await axios(config);
  return {
    provider: provider.slug,
    data: response.data
  };
};
