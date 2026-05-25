export const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizeSearchValue = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined && item !== null && item !== '');
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  return [value];
};

export const pickDefined = (payload = {}) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

export const buildKeywordQuery = (search, fields) => {
  if (!search) {
    return {};
  }

  const pattern = new RegExp(String(search).trim(), 'i');
  return {
    $or: fields.map((field) => ({
      [field]: pattern
    }))
  };
};

export const createNumberSequence = (prefix, value) => `${prefix}-${String(value).padStart(6, '0')}`;
