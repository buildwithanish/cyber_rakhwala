/**
 * Email Forensics Tool Service
 * Analyze email headers and trace email sources
 */

import { api } from '../api';
import { validateEmail } from '../../utils/validators';

const ENDPOINTS = {
  ANALYZE_HEADERS: '/tools/email/analyze-headers',
  VERIFY: '/tools/email/verify',
  TRACE: '/tools/email/trace',
  SPF_CHECK: '/tools/email/spf',
  DKIM_CHECK: '/tools/email/dkim',
};

const emailForensicsService = {
  /**
   * Analyze email headers
   * @param {string} headers - Raw email headers
   * @returns {Promise<Object>}
   */
  analyzeHeaders: async (headers) => {
    if (!headers || !headers.trim()) {
      throw new Error('Email headers are required');
    }
    
    return api.post(ENDPOINTS.ANALYZE_HEADERS, { headers });
  },

  /**
   * Verify email address
   * @param {string} email - Email address
   * @returns {Promise<{valid: boolean, deliverable: boolean, disposable: boolean}>}
   */
  verifyEmail: async (email) => {
    const validation = validateEmail(email);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.VERIFY, { email: email.trim() });
  },

  /**
   * Trace email source
   * @param {string} headers - Email headers
   * @returns {Promise<{path: Array, originIP: string}>}
   */
  traceEmail: async (headers) => {
    if (!headers || !headers.trim()) {
      throw new Error('Email headers are required');
    }
    
    return api.post(ENDPOINTS.TRACE, { headers });
  },

  /**
   * Check SPF record
   * @param {string} domain - Domain name
   * @returns {Promise<{valid: boolean, record: string}>}
   */
  checkSPF: async (domain) => {
    return api.post(ENDPOINTS.SPF_CHECK, { domain: domain.trim().toLowerCase() });
  },

  /**
   * Check DKIM record
   * @param {string} domain - Domain name
   * @param {string} selector - DKIM selector
   * @returns {Promise<{valid: boolean, record: string}>}
   */
  checkDKIM: async (domain, selector = 'default') => {
    return api.post(ENDPOINTS.DKIM_CHECK, { 
      domain: domain.trim().toLowerCase(),
      selector 
    });
  },
};

export default emailForensicsService;
