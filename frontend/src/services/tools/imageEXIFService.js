/**
 * Image EXIF Tool Service
 * Extract and analyze EXIF metadata from images
 */

import { api } from '../api';
import { validateFileType, validateFileSize } from '../../utils/validators';

const ENDPOINTS = {
  ANALYZE: '/tools/image/exif',
  STRIP: '/tools/image/strip-exif',
  GEOLOCATION: '/tools/image/geolocation',
};

const validateImageFile = (file, types) => {
  const typeValidation = validateFileType(file.name, types);
  if (!typeValidation.valid) {
    throw new Error(typeValidation.error);
  }

  const sizeValidation = validateFileSize(file.size, 10);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.error);
  }
};

const sendImage = async (endpoint, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post(endpoint, formData);
};

const imageEXIFService = {
  analyzeImage: async (file) => {
    validateImageFile(file, ['jpg', 'jpeg', 'png', 'tiff', 'heic']);
    return sendImage(ENDPOINTS.ANALYZE, file);
  },

  stripEXIF: async (file) => {
    validateImageFile(file, ['jpg', 'jpeg', 'png']);
    return sendImage(ENDPOINTS.STRIP, file);
  },

  getGeolocation: async (file) => {
    validateImageFile(file, ['jpg', 'jpeg', 'tiff', 'heic']);
    return sendImage(ENDPOINTS.GEOLOCATION, file);
  },
};

export default imageEXIFService;
