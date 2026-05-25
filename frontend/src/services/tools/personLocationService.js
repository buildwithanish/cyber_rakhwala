/**
 * Person Location Tool Service
 * Person search by Name, Area, City, State
 */

import { api } from '../api';

const ENDPOINTS = {
  SEARCH: '/tools/person/search',
  LOOKUP: '/tools/person/lookup',
  AREA_INFO: '/tools/person/area-info',
  DEMOGRAPHICS: '/tools/person/demographics',
  NEARBY: '/tools/person/nearby',
  VOTERS: '/tools/person/voters',
};

const personLocationService = {
  /**
   * Search for person by name and location
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>}
   */
  search: async (params) => {
    const { name, area, city, state, pincode, fatherName, age } = params;
    
    if (!name?.trim() && !area?.trim() && !city?.trim()) {
      throw new Error('At least a name, area, or city is required');
    }
    
    return api.post(ENDPOINTS.SEARCH, {
      name: name?.trim(),
      fatherName: fatherName?.trim(),
      area: area?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
      age: age ? parseInt(age, 10) : undefined,
    });
  },

  /**
   * Get detailed person information
   * @param {string} personId - Person ID from search results
   * @returns {Promise<Object>}
   */
  getDetails: async (personId) => {
    if (!personId) {
      throw new Error('Person ID is required');
    }
    
    return api.get(`${ENDPOINTS.LOOKUP}/${personId}`);
  },

  /**
   * Get area information
   * @param {Object} location - Area/City/State/Pincode
   * @returns {Promise<Object>}
   */
  getAreaInfo: async (location) => {
    const { area, city, state, pincode } = location;
    
    if (!area?.trim() && !city?.trim() && !pincode?.trim()) {
      throw new Error('Area, city, or pincode is required');
    }
    
    return api.post(ENDPOINTS.AREA_INFO, {
      area: area?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
    });
  },

  /**
   * Get demographics for a location
   * @param {Object} location - Area/City/State/Pincode
   * @returns {Promise<Object>}
   */
  getDemographics: async (location) => {
    const { area, city, state, pincode } = location;
    
    if (!area?.trim() && !city?.trim() && !pincode?.trim()) {
      throw new Error('Area, city, or pincode is required');
    }
    
    return api.post(ENDPOINTS.DEMOGRAPHICS, {
      area: area?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
    });
  },

  /**
   * Get nearby places
   * @param {Object} location - Area/City/State/Pincode
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  getNearby: async (location, options = {}) => {
    const { area, city, state, pincode } = location;
    
    if (!area?.trim() && !city?.trim() && !pincode?.trim()) {
      throw new Error('Area, city, or pincode is required');
    }
    
    return api.post(ENDPOINTS.NEARBY, {
      area: area?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      pincode: pincode?.trim(),
      types: options.types || ['police', 'hospital', 'transport', 'commercial'],
      limit: options.limit || 10,
    });
  },

  /**
   * Search voter records
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>}
   */
  searchVoters: async (params) => {
    const { name, fatherName, area, city, state, age } = params;
    
    if (!name?.trim()) {
      throw new Error('Name is required for voter search');
    }
    
    return api.post(ENDPOINTS.VOTERS, {
      name: name?.trim(),
      fatherName: fatherName?.trim(),
      area: area?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      age: age ? parseInt(age, 10) : undefined,
    });
  },

  /**
   * List of Indian states
   * @returns {string[]}
   */
  getStates: () => [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep', 'Puducherry',
  ],
};

export default personLocationService;
