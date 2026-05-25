// Services Index - Export all services from a single entry point
export { default as api, ApiError, setAuthToken, getAuthToken } from './api';
export { default as accountService } from './accountService';
export { default as authService } from './authService';
export { default as caseService } from './caseService';
export { default as evidenceService } from './evidenceService';
export { default as osintService } from './osintService';
export { default as paymentService } from './paymentService';
export { default as publicService } from './publicService';
export { default as searchHistoryService } from './searchHistoryService';
export { default as threatMapService } from './threatMapService';
export { default as adminService } from './adminService';

// Export all tool services
export * from './tools';

// Re-export individual functions for convenience
export {
  accountService as account,
  authService as auth,
  caseService as cases,
  evidenceService as evidence,
  osintService as osint,
  paymentService as payments,
  publicService as public,
  searchHistoryService as searchHistory,
  threatMapService as threatMap,
  adminService as admin
};
