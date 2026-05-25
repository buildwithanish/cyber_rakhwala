/**
 * Aadhaar Info Tool Service
 * UIDAI database lookup for Aadhaar information
 */

import { api } from '../api';

const ENDPOINTS = {
  LOOKUP: '/tools/aadhaar/lookup',
  VERIFY: '/tools/aadhaar/verify',
  ADDRESS: '/tools/aadhaar/address',
  LINKED: '/tools/aadhaar/linked-services',
  AUTH_HISTORY: '/tools/aadhaar/auth-history',
};

/**
 * Validate Aadhaar number format
 * @param {string} aadhaar - Aadhaar number
 * @returns {Object}
 */
const validateAadhaar = (aadhaar) => {
  if (!aadhaar || !aadhaar.trim()) {
    return { valid: false, error: 'Aadhaar number is required' };
  }
  
  // Remove spaces and format
  const cleanedNumber = aadhaar.replace(/\s/g, '');
  
  // Aadhaar is 12 digits
  if (!/^\d{12}$/.test(cleanedNumber)) {
    return { valid: false, error: 'Aadhaar number must be 12 digits' };
  }
  
  // Cannot start with 0 or 1
  if (/^[01]/.test(cleanedNumber)) {
    return { valid: false, error: 'Invalid Aadhaar number - cannot start with 0 or 1' };
  }
  
  // Verhoeff algorithm check (simplified)
  // Full implementation would include proper Verhoeff checksum validation
  
  return { 
    valid: true, 
    formatted: `${cleanedNumber.slice(0, 4)} ${cleanedNumber.slice(4, 8)} ${cleanedNumber.slice(8, 12)}`
  };
};

const aadhaarInfoService = {
  /**
   * Comprehensive Aadhaar lookup
   * @param {string} aadhaar - Aadhaar number
   * @returns {Promise<Object>}
   */
  lookup: async (aadhaar) => {
    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.LOOKUP, { aadhaar: aadhaar.replace(/\s/g, '') });
  },

  /**
   * Verify Aadhaar number
   * @param {string} aadhaar - Aadhaar number
   * @returns {Promise<{verified: boolean, name: string}>}
   */
  verify: async (aadhaar) => {
    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.VERIFY, { aadhaar: aadhaar.replace(/\s/g, '') });
  },

  /**
   * Get address linked to Aadhaar
   * @param {string} aadhaar - Aadhaar number
   * @returns {Promise<Object>}
   */
  getAddress: async (aadhaar) => {
    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.ADDRESS, { aadhaar: aadhaar.replace(/\s/g, '') });
  },

  /**
   * Get linked services
   * @param {string} aadhaar - Aadhaar number
   * @returns {Promise<Object>}
   */
  getLinkedServices: async (aadhaar) => {
    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.LINKED, { aadhaar: aadhaar.replace(/\s/g, '') });
  },

  /**
   * Get authentication history
   * @param {string} aadhaar - Aadhaar number
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  getAuthHistory: async (aadhaar, options = {}) => {
    const validation = validateAadhaar(aadhaar);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.AUTH_HISTORY, { 
      aadhaar: aadhaar.replace(/\s/g, ''),
      ...options
    });
  },

  /**
   * Validate Aadhaar number format
   * @param {string} aadhaar - Aadhaar number
   * @returns {Object}
   */
  validate: validateAadhaar,

  /**
   * Format Aadhaar for display (XXXX XXXX XXXX)
   * @param {string} aadhaar - Aadhaar number
   * @returns {string}
   */
  format: (aadhaar) => {
    const cleaned = aadhaar.replace(/\s/g, '');
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
  },

  /**
   * Mask Aadhaar for privacy (XXXX XXXX 1234)
   * @param {string} aadhaar - Aadhaar number
   * @returns {string}
   */
  mask: (aadhaar) => {
    const cleaned = aadhaar.replace(/\s/g, '');
    return `XXXX XXXX ${cleaned.slice(8, 12)}`;
  },
};

export default aadhaarInfoService;
