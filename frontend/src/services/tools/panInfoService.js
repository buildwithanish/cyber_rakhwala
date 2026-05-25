/**
 * PAN Info Tool Service
 * Income Tax database lookup for PAN information
 */

import { api } from '../api';

const ENDPOINTS = {
  LOOKUP: '/tools/pan/lookup',
  VERIFY: '/tools/pan/verify',
  TAX_DETAILS: '/tools/pan/tax-details',
  LINKED_ENTITIES: '/tools/pan/linked-entities',
  DIRECTORSHIPS: '/tools/pan/directorships',
  COMPLIANCE: '/tools/pan/compliance',
};

/**
 * Validate PAN number format
 * @param {string} pan - PAN number
 * @returns {Object}
 */
const validatePAN = (pan) => {
  if (!pan || !pan.trim()) {
    return { valid: false, error: 'PAN number is required' };
  }
  
  const cleanedPAN = pan.trim().toUpperCase();
  
  // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
  // 4th letter denotes holder type: C=Company, P=Person, H=HUF, F=Firm, A=AOP, T=Trust, etc.
  const pattern = /^[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]$/;
  
  if (!pattern.test(cleanedPAN)) {
    return { valid: false, error: 'Invalid PAN format. Must be like ABCDE1234F' };
  }
  
  return { valid: true, formatted: cleanedPAN };
};

/**
 * Get PAN holder type from 4th character
 * @param {string} pan - PAN number
 * @returns {string}
 */
const getHolderType = (pan) => {
  const types = {
    'A': 'Association of Persons (AOP)',
    'B': 'Body of Individuals (BOI)',
    'C': 'Company',
    'F': 'Firm',
    'G': 'Government',
    'H': 'Hindu Undivided Family (HUF)',
    'L': 'Local Authority',
    'J': 'Artificial Juridical Person',
    'P': 'Individual/Person',
    'T': 'Trust',
  };
  
  const cleaned = pan.trim().toUpperCase();
  return types[cleaned[3]] || 'Unknown';
};

const panInfoService = {
  /**
   * Comprehensive PAN lookup
   * @param {string} pan - PAN number
   * @returns {Promise<Object>}
   */
  lookup: async (pan) => {
    const validation = validatePAN(pan);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.LOOKUP, { pan: validation.formatted });
  },

  /**
   * Verify PAN number
   * @param {string} pan - PAN number
   * @returns {Promise<{verified: boolean, name: string, status: string}>}
   */
  verify: async (pan) => {
    const validation = validatePAN(pan);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.VERIFY, { pan: validation.formatted });
  },

  /**
   * Get tax filing details
   * @param {string} pan - PAN number
   * @returns {Promise<Object>}
   */
  getTaxDetails: async (pan) => {
    const validation = validatePAN(pan);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.TAX_DETAILS, { pan: validation.formatted });
  },

  /**
   * Get linked entities (companies, etc.)
   * @param {string} pan - PAN number
   * @returns {Promise<Object>}
   */
  getLinkedEntities: async (pan) => {
    const validation = validatePAN(pan);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.LINKED_ENTITIES, { pan: validation.formatted });
  },

  /**
   * Get directorship information
   * @param {string} pan - PAN number
   * @returns {Promise<Object>}
   */
  getDirectorships: async (pan) => {
    const validation = validatePAN(pan);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.DIRECTORSHIPS, { pan: validation.formatted });
  },

  /**
   * Get compliance status
   * @param {string} pan - PAN number
   * @returns {Promise<Object>}
   */
  getCompliance: async (pan) => {
    const validation = validatePAN(pan);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return api.post(ENDPOINTS.COMPLIANCE, { pan: validation.formatted });
  },

  /**
   * Validate PAN number format
   * @param {string} pan - PAN number
   * @returns {Object}
   */
  validate: validatePAN,

  /**
   * Get holder type from PAN
   * @param {string} pan - PAN number
   * @returns {string}
   */
  getHolderType,
};

export default panInfoService;
