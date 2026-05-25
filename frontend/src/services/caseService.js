// Case Service - API calls for case management
import api, { ApiError } from './api';

const ENDPOINT = '/cases';

// Fallback to localStorage if API is unavailable
const useFallback = false;
const STORAGE_KEY = 'cyberRakhwala_cases';

// Helper to get from localStorage
const getFromStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper to save to localStorage
const saveToStorage = (cases) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
};

export const caseService = {
  // Get all cases
  getAll: async (params = {}) => {
    if (useFallback) {
      let cases = getFromStorage();
      
      // Apply filters
      if (params.status) {
        cases = cases.filter(c => c.status === params.status);
      }
      if (params.priority) {
        cases = cases.filter(c => c.priority === params.priority);
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        cases = cases.filter(c => 
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.caseId.toLowerCase().includes(search)
        );
      }
      
      // Apply sorting
      if (params.sortBy) {
        cases.sort((a, b) => {
          const aVal = a[params.sortBy];
          const bVal = b[params.sortBy];
          const direction = params.sortOrder === 'desc' ? -1 : 1;
          
          if (typeof aVal === 'string') {
            return aVal.localeCompare(bVal) * direction;
          }
          return (aVal - bVal) * direction;
        });
      }
      
      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const start = (page - 1) * limit;
      const paginatedCases = cases.slice(start, start + limit);
      
      return {
        cases: paginatedCases,
        total: cases.length,
        page,
        limit,
        totalPages: Math.ceil(cases.length / limit)
      };
    }

    const queryParams = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINT}${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get a single case by ID
  getById: async (id) => {
    if (useFallback) {
      const cases = getFromStorage();
      const foundCase = cases.find(c => c.id === id || c.caseId === id);
      if (!foundCase) {
        throw new ApiError('Case not found', 404);
      }
      return foundCase;
    }

    return api.get(`${ENDPOINT}/${id}`);
  },

  // Create a new case
  create: async (caseData) => {
    if (useFallback) {
      const cases = getFromStorage();
      const newCase = {
        id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        caseId: `CR-${Date.now().toString().slice(-6)}`,
        ...caseData,
        status: caseData.status || 'active',
        progress: caseData.progress || 0,
        evidence: [],
        timeline: [{
          id: `tl_${Date.now()}`,
          action: 'Case Created',
          timestamp: new Date().toISOString(),
          user: 'Current User'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      cases.unshift(newCase);
      saveToStorage(cases);
      return newCase;
    }

    return api.post(ENDPOINT, caseData);
  },

  // Update an existing case
  update: async (id, updates) => {
    if (useFallback) {
      const cases = getFromStorage();
      const index = cases.findIndex(c => c.id === id || c.caseId === id);
      
      if (index === -1) {
        throw new ApiError('Case not found', 404);
      }
      
      const updatedCase = {
        ...cases[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        timeline: [
          ...(cases[index].timeline || []),
          {
            id: `tl_${Date.now()}`,
            action: 'Case Updated',
            details: Object.keys(updates).join(', '),
            timestamp: new Date().toISOString(),
            user: 'Current User'
          }
        ]
      };
      
      cases[index] = updatedCase;
      saveToStorage(cases);
      return updatedCase;
    }

    return api.put(`${ENDPOINT}/${id}`, updates);
  },

  // Delete a case
  delete: async (id) => {
    if (useFallback) {
      const cases = getFromStorage();
      const index = cases.findIndex(c => c.id === id || c.caseId === id);
      
      if (index === -1) {
        throw new ApiError('Case not found', 404);
      }
      
      const deletedCase = cases[index];
      cases.splice(index, 1);
      saveToStorage(cases);
      return { success: true, deleted: deletedCase };
    }

    return api.delete(`${ENDPOINT}/${id}`);
  },

  // Add evidence to a case
  addEvidence: async (caseId, evidenceId) => {
    if (useFallback) {
      const cases = getFromStorage();
      const index = cases.findIndex(c => c.id === caseId || c.caseId === caseId);
      
      if (index === -1) {
        throw new ApiError('Case not found', 404);
      }
      
      if (!cases[index].evidence.includes(evidenceId)) {
        cases[index].evidence.push(evidenceId);
        cases[index].timeline.push({
          id: `tl_${Date.now()}`,
          action: 'Evidence Added',
          details: `Evidence ${evidenceId} linked`,
          timestamp: new Date().toISOString(),
          user: 'Current User'
        });
        cases[index].updatedAt = new Date().toISOString();
        saveToStorage(cases);
      }
      
      return cases[index];
    }

    return api.post(`${ENDPOINT}/${caseId}/evidence`, { evidenceId });
  },

  addNote: async (caseId, content) => api.post(`${ENDPOINT}/${caseId}/notes`, { content }),

  addTimelineEvent: async (caseId, payload) => api.post(`${ENDPOINT}/${caseId}/timeline`, payload),

  updateTimelineEvent: async (caseId, timelineId, payload) =>
    api.patch(`${ENDPOINT}/${caseId}/timeline/${timelineId}`, payload),

  deleteTimelineEvent: async (caseId, timelineId) =>
    api.delete(`${ENDPOINT}/${caseId}/timeline/${timelineId}`),

  addTeamMember: async (caseId, memberData) => api.post(`${ENDPOINT}/${caseId}/team`, memberData),

  updateTeamMemberRole: async (caseId, memberId, role) =>
    api.patch(`${ENDPOINT}/${caseId}/team/${memberId}`, { role }),

  removeTeamMember: async (caseId, memberId) =>
    api.delete(`${ENDPOINT}/${caseId}/team/${memberId}`),

  // Remove evidence from a case
  removeEvidence: async (caseId, evidenceId) => {
    if (useFallback) {
      const cases = getFromStorage();
      const index = cases.findIndex(c => c.id === caseId || c.caseId === caseId);
      
      if (index === -1) {
        throw new ApiError('Case not found', 404);
      }
      
      cases[index].evidence = cases[index].evidence.filter(e => e !== evidenceId);
      cases[index].updatedAt = new Date().toISOString();
      saveToStorage(cases);
      
      return cases[index];
    }

    return api.delete(`${ENDPOINT}/${caseId}/evidence/${evidenceId}`);
  },

  // Update case status
  updateStatus: async (id, status) => {
    return caseService.update(id, { status });
  },

  // Get case statistics
  getStatistics: async () => {
    if (useFallback) {
      const cases = getFromStorage();
      
      return {
        total: cases.length,
        active: cases.filter(c => c.status === 'active').length,
        pending: cases.filter(c => c.status === 'pending').length,
        closed: cases.filter(c => c.status === 'closed').length,
        critical: cases.filter(c => c.priority === 'critical').length,
        high: cases.filter(c => c.priority === 'high').length,
        medium: cases.filter(c => c.priority === 'medium').length,
        low: cases.filter(c => c.priority === 'low').length,
        avgProgress: cases.length > 0 
          ? Math.round(cases.reduce((sum, c) => sum + (c.progress || 0), 0) / cases.length)
          : 0
      };
    }

    return api.get(`${ENDPOINT}/statistics`);
  },

  // Search cases
  search: async (query) => {
    return caseService.getAll({ search: query });
  },

  // Export cases
  export: async (format = 'json') => {
    if (useFallback) {
      const cases = getFromStorage();
      
      if (format === 'json') {
        return JSON.stringify(cases, null, 2);
      }
      
      // CSV format
      if (format === 'csv') {
        const headers = ['caseId', 'title', 'status', 'priority', 'progress', 'createdAt'];
        const rows = cases.map(c => headers.map(h => c[h] || '').join(','));
        return [headers.join(','), ...rows].join('\n');
      }
      
      return cases;
    }

    return api.get(`${ENDPOINT}/export?format=${format}`);
  }
};

export default caseService;
