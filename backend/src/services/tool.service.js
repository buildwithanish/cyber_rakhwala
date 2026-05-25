import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { StatusCodes } from 'http-status-codes';
import { SearchLog } from '../models/SearchLog.js';
import { ToolCatalog } from '../models/ToolCatalog.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, getPagination } from '../utils/pagination.js';
import { normalizeSearchValue } from '../utils/helpers.js';
import { createActivity } from './activity.service.js';
import { createAuditLog } from './audit.service.js';
import { applyCreditTransaction } from './credit.service.js';
import { searchDatasets } from './dataset.service.js';
import { executeProviderSearch, getEnabledProviders } from './provider.service.js';

const TOOL_MAP = {
  ip: { toolId: 'ip-intelligence', searchType: 'ip', label: 'IP Intelligence Tool' },
  domain: { toolId: 'domain-analysis', searchType: 'domain', label: 'Domain Analysis Tool' },
  email: { toolId: 'email-forensics', searchType: 'email', label: 'Email Forensics Tool' },
  phone: { toolId: 'phone-lookup', searchType: 'phone', label: 'Phone Lookup Tool' },
  social: { toolId: 'social-profiler', searchType: 'social', label: 'Social Profiler Tool' },
  hash: { toolId: 'hash-analyzer', searchType: 'hash', label: 'Hash Analyzer Tool' },
  url: { toolId: 'url-scanner', searchType: 'url', label: 'URL Scanner Tool' },
  geolocation: { toolId: 'geolocation', searchType: 'location', label: 'Geolocation Tool' },
  'breach-database': { toolId: 'breach-database', searchType: 'breach', label: 'Breach Database Tool' },
  dns: { toolId: 'dns-records', searchType: 'dns', label: 'DNS Records Tool' },
  'data-mining': { toolId: 'data-mining', searchType: 'text', label: 'Data Mining Tool' },
  whatsapp: { toolId: 'whatsapp-trace', searchType: 'phone', label: 'WhatsApp Trace Tool' },
  cdr: { toolId: 'cdr-analysis', searchType: 'telecom', label: 'CDR Analysis Tool' },
  ipdr: { toolId: 'ipdr-analysis', searchType: 'network', label: 'IPDR Analysis Tool' },
  upi: { toolId: 'upi-info', searchType: 'upi', label: 'UPI Info Tool' },
  aadhaar: { toolId: 'aadhaar-info', searchType: 'aadhaar', label: 'aadhaar', sensitive: true },
  pan: { toolId: 'pan-info', searchType: 'pan', label: 'PAN Info Tool', sensitive: true },
  vehicle: { toolId: 'vehicle-info', searchType: 'vehicle', label: 'Vehicle Info Tool' },
  'person-location': {
    toolId: 'person-location',
    searchType: 'person',
    label: 'Person Location Tool',
    sensitive: true
  },
  person: {
    toolId: 'person-location',
    searchType: 'person',
    label: 'Person Location Tool',
    sensitive: true
  },
  'face-recognition': {
    toolId: 'face-recognition',
    searchType: 'biometric',
    label: 'Face Recognition Tool',
    sensitive: true
  },
  face: {
    toolId: 'face-recognition',
    searchType: 'biometric',
    label: 'Face Recognition Tool',
    sensitive: true
  },
  'image-exif': { toolId: 'image-exif', searchType: 'image', label: 'Image EXIF Tool' },
  image: { toolId: 'image-exif', searchType: 'image', label: 'Image EXIF Tool' }
};

const extractQuery = ({ category, action, body, params }) => {
  const explicitOrder = [
    body?.query,
    body?.ip,
    body?.domain,
    body?.email,
    body?.phone,
    body?.url,
    body?.username,
    body?.indicator,
    body?.upiId,
    body?.pan,
    body?.aadhaar,
    body?.registrationNumber,
    body?.text,
    body?.headers,
    body?.personName,
    body?.personId,
    params?.entityId
  ];

  const first = explicitOrder.find((value) => value !== undefined && value !== null && value !== '');
  return typeof first === 'string' ? first.trim() : JSON.stringify(first || `${category}:${action}`);
};

const basicEmailVerification = (email) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const domain = email.split('@')[1] || '';
  return {
    email,
    valid: pattern.test(email),
    domain,
    disposableRisk: ['mailinator.com', '10minutemail.com'].includes(domain)
  };
};

const basicPhoneAnalysis = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return {
    phone,
    normalized: digits,
    valid: digits.length >= 10 && digits.length <= 15,
    countryHint: digits.startsWith('91') || digits.length === 10 ? 'IN' : 'Unknown'
  };
};

const basicHashAnalysis = (value) => {
  const normalized = value.trim().toLowerCase();
  const map = {
    32: 'md5',
    40: 'sha1',
    56: 'sha224',
    64: 'sha256',
    96: 'sha384',
    128: 'sha512'
  };
  return {
    hash: normalized,
    algorithm: map[normalized.length] || 'unknown',
    length: normalized.length
  };
};

const basicIpAnalysis = (ip) => {
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
  const octets = ip.split('.').map(Number);
  const isPrivate =
    isIpv4 &&
    ((octets[0] === 10) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168));
  return {
    ip,
    version: isIpv4 ? 4 : ip.includes(':') ? 6 : 0,
    private: isPrivate,
    reputation: isPrivate ? 'internal' : 'unknown'
  };
};

const basicDomainAnalysis = (domain) => {
  const normalized = domain.replace(/^https?:\/\//, '').toLowerCase();
  const parts = normalized.split('.');
  return {
    domain: normalized,
    tld: parts.at(-1),
    root: parts.slice(-2).join('.'),
    subdomain: parts.length > 2 ? parts.slice(0, -2).join('.') : ''
  };
};

const basicUrlAnalysis = (url) => {
  const parsed = new URL(url);
  return {
    url,
    hostname: parsed.hostname,
    protocol: parsed.protocol.replace(':', ''),
    pathname: parsed.pathname,
    hasQuery: Boolean(parsed.search)
  };
};

const extractPatternsFromText = (text) => ({
  emails: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [],
  phones: text.match(/\+?\d[\d\s-]{8,}\d/g) || [],
  ips: text.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || [],
  urls: text.match(/https?:\/\/[^\s]+/gi) || []
});

const summarizeCsv = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true
  });
  const keys = Object.keys(rows[0] || {});
  return {
    rows: rows.length,
    columns: keys,
    sample: rows.slice(0, 5)
  };
};

const buildBuiltInResponse = async ({ category, action, query, body, files, entityId }) => {
  if (category === 'email' && action === 'verify') {
    return basicEmailVerification(query);
  }
  if (category === 'phone' && ['lookup', 'validate', 'carrier', 'reputation'].includes(action)) {
    return basicPhoneAnalysis(query);
  }
  if (category === 'hash') {
    return basicHashAnalysis(query);
  }
  if (category === 'ip') {
    return basicIpAnalysis(query);
  }
  if (category === 'domain') {
    return basicDomainAnalysis(query);
  }
  if (category === 'url') {
    return basicUrlAnalysis(query);
  }
  if (category === 'data-mining' && action === 'extract') {
    return {
      textLength: String(body?.text || '').length,
      patterns: extractPatternsFromText(String(body?.text || ''))
    };
  }
  if (category === 'breach-database' && ['statistics', 'stats'].includes(action)) {
    return {
      note: 'Statistics are derived from configured datasets and providers at runtime.'
    };
  }
  if (['person-location', 'person'].includes(category) && action === 'lookup') {
    return {
      personId: entityId
    };
  }
  if (['cdr', 'ipdr'].includes(category) && files?.length) {
    return summarizeCsv(files[0].path);
  }
  if (['image-exif', 'image'].includes(category) && files?.length) {
    return {
      fileName: files[0].originalname,
      mimeType: files[0].mimetype,
      size: files[0].size
    };
  }
  if (category === 'geolocation') {
    return action === 'phone'
      ? basicPhoneAnalysis(query)
      : basicIpAnalysis(query);
  }

  return null;
};

const ensureToolAccess = ({ category, user, datasetMatches, providerMatches }) => {
  const meta = TOOL_MAP[category];
  if (!meta?.sensitive) {
    return;
  }

  if (user.role === 'student') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'This tool is not available for student accounts');
  }

  if (!datasetMatches.length && !providerMatches.length) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'This sensitive tool requires an admin-configured dataset or provider source.',
      {
        code: 'TOOL_SOURCE_REQUIRED'
      }
    );
  }
};

const maybeChargeCredits = async ({ tool, user, searchLogId }) => {
  if (!tool) {
    return null;
  }

  const amount = tool.creditCost?.[user.role] || 0;
  if (amount <= 0) {
    return null;
  }

  return applyCreditTransaction({
    userId: user._id,
    amount: -amount,
    type: 'debit',
    reason: `${tool.name} execution`,
    referenceType: 'search-log',
    referenceId: String(searchLogId),
    metadata: {
      toolId: tool.toolId
    }
  });
};

export const executeToolAction = async ({ category, action, entityId, body, files = [], user, req }) => {
  const meta = TOOL_MAP[category];
  if (!meta) {
    throw new ApiError(StatusCodes.NOT_FOUND, `Unknown tool category: ${category}`);
  }

  const query = extractQuery({
    category,
    action,
    body,
    params: {
      entityId
    }
  });

  const tool = await ToolCatalog.findOne({
    $or: [{ toolId: meta.toolId }, { toolId: category }],
    isEnabled: true
  }).lean();

  const [datasetMatches, providers] = await Promise.all([
    searchDatasets({ toolId: meta.toolId, query }).catch(() => []),
    getEnabledProviders(meta.toolId)
  ]);

  const providerResults = [];
  for (const provider of providers) {
    try {
      providerResults.push(
        await executeProviderSearch({
          provider,
          toolId: meta.toolId,
          action,
          query,
          payload: body
        })
      );
    } catch (error) {
      providerResults.push({
        provider: provider.slug,
        error: error.message
      });
    }
  }

  ensureToolAccess({
    category,
    user,
    datasetMatches,
    providerMatches: providerResults.filter((result) => !result.error)
  });

  const builtIn = await buildBuiltInResponse({
    category,
    action,
    query,
    body,
    files,
    entityId
  });

  const searchLog = await SearchLog.create({
    user: user._id,
    toolId: meta.toolId,
    toolName: tool?.name || meta.label,
    searchType: meta.searchType,
    query,
    normalizedQuery: normalizeSearchValue(query),
    status: 'success',
    requestPayload: {
      action,
      body
    }
  });

  await maybeChargeCredits({
    tool,
    user,
    searchLogId: searchLog._id
  });

  const data = {
    toolId: meta.toolId,
    category,
    action,
    query,
    builtIn,
    datasetMatches,
    providerResults,
    files: files.map((file) => ({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }))
  };

  searchLog.responsePayload = data;
  searchLog.resultSummary = JSON.stringify({
    datasetMatches: datasetMatches.length,
    providers: providerResults.length,
    builtIn: Boolean(builtIn)
  });
  await searchLog.save();

  await Promise.all([
    createActivity({
      user,
      actorName: user.name,
      action: `${meta.label} executed`,
      type: 'tool',
      targetType: 'search',
      targetId: String(searchLog._id),
      details: {
        action,
        query
      }
    }),
    createAuditLog({
      actor: user,
      actorRole: user.role,
      action: 'tool.execute',
      resourceType: 'SearchLog',
      resourceId: String(searchLog._id),
      metadata: {
        toolId: meta.toolId,
        action
      },
      req
    })
  ]);

  return {
    searchId: String(searchLog._id),
    ...data
  };
};

export const executeOsintAction = async ({ action, body, user, req }) => {
  const categoryMap = {
    email: 'email',
    phone: 'phone',
    domain: 'domain',
    ip: 'ip',
    username: 'social',
    image: 'image-exif',
    social: 'social',
    threat: 'breach-database'
  };

  return executeToolAction({
    category: categoryMap[action],
    action: action === 'username' ? 'search' : action === 'threat' ? 'statistics' : 'lookup',
    body,
    user,
    req
  });
};

export const listSearchHistory = async ({ query, user }) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {
    user: user._id
  };
  if (query.toolId) {
    filter.toolId = query.toolId;
  }
  if (query.searchType) {
    filter.searchType = query.searchType;
  }
  if (typeof query.bookmarked === 'boolean') {
    filter.bookmarked = query.bookmarked;
  }

  const [items, total] = await Promise.all([
    SearchLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SearchLog.countDocuments(filter)
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, limit, total })
  };
};

export const clearSearchHistory = async (userId, toolId) => {
  const filter = {
    user: userId
  };

  if (toolId) {
    filter.toolId = toolId;
  }

  return SearchLog.deleteMany(filter);
};

export const deleteSearchHistoryItem = async ({ id, userId }) =>
  SearchLog.findOneAndDelete({
    _id: id,
    user: userId
  });

export const setSearchBookmark = async ({ id, userId, bookmarked }) =>
  SearchLog.findOneAndUpdate(
    {
      _id: id,
      user: userId
    },
    {
      $set: {
        bookmarked
      }
    },
    { new: true }
  );

export const getSearchResult = async ({ id, userId }) =>
  SearchLog.findOne({
    _id: id,
    user: userId
  }).lean();

export const exportSearchResults = async ({ userId, ids = [], format = 'json' }) => {
  const filter = {
    user: userId
  };
  if (ids.length) {
    filter._id = { $in: ids };
  }
  const items = await SearchLog.find(filter).sort({ createdAt: -1 }).lean();
  if (format === 'csv') {
    const header = ['toolName', 'searchType', 'query', 'status', 'createdAt'];
    const rows = items.map((item) => header.map((field) => item[field] ?? '').join(','));
    return [header.join(','), ...rows].join('\n');
  }
  return items;
};
