/**
 * CDR Analysis Tool Service
 * Call Detail Records forensic analysis
 */

import { api } from '../api';
import { validatePhone } from '../../utils/validators';

const ENDPOINTS = {
  ANALYZE: '/tools/cdr/analyze',
  UPLOAD: '/tools/cdr/upload',
  SUMMARY: '/tools/cdr/summary',
  CONTACTS: '/tools/cdr/contacts',
  PATTERNS: '/tools/cdr/patterns',
  TOWERS: '/tools/cdr/towers',
  SUSPICIOUS: '/tools/cdr/suspicious',
  TIMELINE: '/tools/cdr/timeline',
};

const cdrAnalysisService = {
  /**
   * Analyze CDR data for a phone number
   * @param {string} phone - Phone number
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>}
   */
  analyze: async (phone, options = {}) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.ANALYZE, { 
      phone: phone.trim(),
      ...options
    });
  },

  /**
   * Upload CDR file for analysis
   * @param {File} file - CDR file (CSV/Excel)
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  uploadFile: async (file, options = {}) => {
    if (!file) {
      throw new Error('CDR file is required');
    }

    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(ext)) {
      throw new Error('Invalid file type. Please upload CSV or Excel file.');
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
   * Get CDR summary
   * @param {string} phone - Phone number
   * @param {Object} dateRange - Date range for analysis
   * @returns {Promise<Object>}
   */
  getSummary: async (phone, dateRange = {}) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.SUMMARY, { 
      phone: phone.trim(),
      ...dateRange
    });
  },

  /**
   * Get top contacts analysis
   * @param {string} phone - Phone number
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  getTopContacts: async (phone, options = {}) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.CONTACTS, { 
      phone: phone.trim(),
      limit: options.limit || 20,
      ...options
    });
  },

  /**
   * Get call patterns
   * @param {string} phone - Phone number
   * @returns {Promise<Object>}
   */
  getPatterns: async (phone) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.PATTERNS, { phone: phone.trim() });
  },

  /**
   * Get tower/cell location data
   * @param {string} phone - Phone number
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  getTowerData: async (phone, options = {}) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.TOWERS, { 
      phone: phone.trim(),
      ...options
    });
  },

  /**
   * Get suspicious activity alerts
   * @param {string} phone - Phone number
   * @returns {Promise<Object>}
   */
  getSuspiciousActivity: async (phone) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.SUSPICIOUS, { phone: phone.trim() });
  },

  /**
   * Get call timeline
   * @param {string} phone - Phone number
   * @param {Object} dateRange - Date range
   * @returns {Promise<Object>}
   */
  getTimeline: async (phone, dateRange = {}) => {
    const validation = validatePhone(phone);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.TIMELINE, { 
      phone: phone.trim(),
      ...dateRange
    });
  },
};

export default cdrAnalysisService;
