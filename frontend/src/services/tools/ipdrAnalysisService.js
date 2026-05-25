/**
 * IPDR Analysis Tool Service
 * Internet Protocol Detail Records forensic analysis
 */

import { api } from '../api';

const ENDPOINTS = {
  ANALYZE: '/tools/ipdr/analyze',
  UPLOAD: '/tools/ipdr/upload',
  SUMMARY: '/tools/ipdr/summary',
  DESTINATIONS: '/tools/ipdr/destinations',
  PORTS: '/tools/ipdr/ports',
  TIMELINE: '/tools/ipdr/timeline',
  SUSPICIOUS: '/tools/ipdr/suspicious',
  GEO: '/tools/ipdr/geo-distribution',
};

/**
 * Validate IP address format
 * @param {string} ip - IP address
 * @returns {Object}
 */
const validateIP = (ip) => {
  if (!ip || !ip.trim()) {
    return { valid: false, error: 'IP address is required' };
  }
  
  const trimmedIP = ip.trim();
  
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Pattern.test(trimmedIP)) {
    // Validate each octet
    const octets = trimmedIP.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return { valid: false, error: 'Invalid IP address - each octet must be 0-255' };
      }
    }
    return { valid: true, type: 'IPv4', formatted: trimmedIP };
  }
  
  if (ipv6Pattern.test(trimmedIP)) {
    return { valid: true, type: 'IPv6', formatted: trimmedIP };
  }
  
  return { valid: false, error: 'Invalid IP address format' };
};

const ipdrAnalysisService = {
  /**
   * Analyze IPDR data for an IP address
   * @param {string} ip - IP address
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>}
   */
  analyze: async (ip, options = {}) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.ANALYZE, { 
      ip: validation.formatted,
      ...options
    });
  },

  /**
   * Upload IPDR file for analysis
   * @param {File} file - IPDR file (CSV/Excel/TXT)
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  uploadFile: async (file, options = {}) => {
    if (!file) {
      throw new Error('IPDR file is required');
    }

    const allowedTypes = ['.csv', '.xlsx', '.xls', '.txt'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(ext)) {
      throw new Error('Invalid file type. Please upload CSV, Excel, or TXT file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
    
    return api.post(ENDPOINTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Get IPDR summary
   * @param {string} ip - IP address
   * @param {Object} dateRange - Date range for analysis
   * @returns {Promise<Object>}
   */
  getSummary: async (ip, dateRange = {}) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.SUMMARY, { 
      ip: validation.formatted,
      ...dateRange
    });
  },

  /**
   * Get top destinations
   * @param {string} ip - IP address
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  getTopDestinations: async (ip, options = {}) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.DESTINATIONS, { 
      ip: validation.formatted,
      limit: options.limit || 20,
      ...options
    });
  },

  /**
   * Get port analysis
   * @param {string} ip - IP address
   * @returns {Promise<Object>}
   */
  getPortAnalysis: async (ip) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.PORTS, { ip: validation.formatted });
  },

  /**
   * Get connection timeline
   * @param {string} ip - IP address
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>}
   */
  getTimeline: async (ip, dateRange = {}) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.TIMELINE, { 
      ip: validation.formatted,
      ...dateRange
    });
  },

  /**
   * Get suspicious activity alerts
   * @param {string} ip - IP address
   * @returns {Promise<Object>}
   */
  getSuspiciousActivity: async (ip) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.SUSPICIOUS, { ip: validation.formatted });
  },

  /**
   * Get geographical distribution
   * @param {string} ip - IP address
   * @returns {Promise<Object>}
   */
  getGeoDistribution: async (ip) => {
    const validation = validateIP(ip);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.GEO, { ip: validation.formatted });
  },

  /**
   * Validate IP address format
   * @param {string} ip - IP address
   * @returns {Object}
   */
  validate: validateIP,
};

export default ipdrAnalysisService;
