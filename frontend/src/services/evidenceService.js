// Evidence Service - API calls for evidence management
import api, { ApiError } from './api';

const ENDPOINT = '/evidence';

// Fallback to localStorage if API is unavailable
const useFallback = false;
const STORAGE_KEY = 'cyberRakhwala_evidence';

// Helper to get from localStorage
const getFromStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper to save to localStorage
const saveToStorage = (evidence) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evidence));
};

export const evidenceService = {
  // Get all evidence
  getAll: async (params = {}) => {
    if (useFallback) {
      let evidence = getFromStorage();
      
      // Apply filters
      if (params.type) {
        evidence = evidence.filter(e => e.type === params.type);
      }
      if (params.verified !== undefined) {
        evidence = evidence.filter(e => e.verified === params.verified);
      }
      if (params.caseId) {
        evidence = evidence.filter(e => e.caseId === params.caseId);
      }
      if (params.tags && params.tags.length > 0) {
        evidence = evidence.filter(e => 
          params.tags.some(tag => e.tags?.includes(tag))
        );
      }
      if (params.search) {
        const search = params.search.toLowerCase();
        evidence = evidence.filter(e => 
          e.title?.toLowerCase().includes(search) ||
          e.description?.toLowerCase().includes(search) ||
          e.source?.toLowerCase().includes(search)
        );
      }
      
      // Apply sorting
      if (params.sortBy) {
        evidence.sort((a, b) => {
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
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const paginatedEvidence = evidence.slice(start, start + limit);
      
      return {
        evidence: paginatedEvidence,
        total: evidence.length,
        page,
        limit,
        totalPages: Math.ceil(evidence.length / limit)
      };
    }

    const queryParams = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINT}${queryParams ? `?${queryParams}` : ''}`);
  },

  // Get a single evidence by ID
  getById: async (id) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const found = evidence.find(e => e.id === id);
      if (!found) {
        throw new ApiError('Evidence not found', 404);
      }
      return found;
    }

    return api.get(`${ENDPOINT}/${id}`);
  },

  // Create new evidence
  create: async (evidenceData) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const newEvidence = {
        id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...evidenceData,
        verified: false,
        tags: evidenceData.tags || [],
        correlations: evidenceData.correlations || [],
        metadata: {
          ...evidenceData.metadata,
          createdAt: new Date().toISOString(),
          collector: 'Current User'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      evidence.unshift(newEvidence);
      saveToStorage(evidence);
      return newEvidence;
    }

    return api.post(ENDPOINT, evidenceData);
  },

  // Update existing evidence
  update: async (id, updates) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      const updatedEvidence = {
        ...evidence[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      evidence[index] = updatedEvidence;
      saveToStorage(evidence);
      return updatedEvidence;
    }

    return api.put(`${ENDPOINT}/${id}`, updates);
  },

  // Delete evidence
  delete: async (id) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      const deleted = evidence[index];
      evidence.splice(index, 1);
      saveToStorage(evidence);
      return { success: true, deleted };
    }

    return api.delete(`${ENDPOINT}/${id}`);
  },

  // Verify evidence
  verify: async (id, verificationData = {}) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      evidence[index] = {
        ...evidence[index],
        verified: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: verificationData.verifiedBy || 'Current User',
        verificationNotes: verificationData.notes || '',
        updatedAt: new Date().toISOString()
      };
      
      saveToStorage(evidence);
      return evidence[index];
    }

    return api.post(`${ENDPOINT}/${id}/verify`, verificationData);
  },

  // Unverify evidence
  unverify: async (id) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      evidence[index] = {
        ...evidence[index],
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        updatedAt: new Date().toISOString()
      };
      
      saveToStorage(evidence);
      return evidence[index];
    }

    return api.post(`${ENDPOINT}/${id}/unverify`);
  },

  // Add tag to evidence
  addTag: async (id, tag) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      if (!evidence[index].tags) {
        evidence[index].tags = [];
      }
      
      if (!evidence[index].tags.includes(tag)) {
        evidence[index].tags.push(tag);
        evidence[index].updatedAt = new Date().toISOString();
        saveToStorage(evidence);
      }
      
      return evidence[index];
    }

    return api.post(`${ENDPOINT}/${id}/tags`, { tag });
  },

  // Remove tag from evidence
  removeTag: async (id, tag) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      evidence[index].tags = (evidence[index].tags || []).filter(t => t !== tag);
      evidence[index].updatedAt = new Date().toISOString();
      saveToStorage(evidence);
      
      return evidence[index];
    }

    return api.delete(`${ENDPOINT}/${id}/tags/${encodeURIComponent(tag)}`);
  },

  // Add correlation
  addCorrelation: async (id, correlatedId, correlationType = 'related') => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      if (!evidence[index].correlations) {
        evidence[index].correlations = [];
      }
      
      const correlation = {
        evidenceId: correlatedId,
        type: correlationType,
        addedAt: new Date().toISOString()
      };
      
      if (!evidence[index].correlations.find(c => c.evidenceId === correlatedId)) {
        evidence[index].correlations.push(correlation);
        evidence[index].updatedAt = new Date().toISOString();
        saveToStorage(evidence);
      }
      
      return evidence[index];
    }

    return api.post(`${ENDPOINT}/${id}/correlations`, { correlatedId, correlationType });
  },

  // Remove correlation
  removeCorrelation: async (id, correlatedId) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const index = evidence.findIndex(e => e.id === id);
      
      if (index === -1) {
        throw new ApiError('Evidence not found', 404);
      }
      
      evidence[index].correlations = (evidence[index].correlations || [])
        .filter(c => c.evidenceId !== correlatedId);
      evidence[index].updatedAt = new Date().toISOString();
      saveToStorage(evidence);
      
      return evidence[index];
    }

    return api.delete(`${ENDPOINT}/${id}/correlations/${correlatedId}`);
  },

  // Get evidence by case
  getByCase: async (caseId) => {
    return evidenceService.getAll({ caseId });
  },

  // Get evidence statistics
  getStatistics: async () => {
    if (useFallback) {
      const evidence = getFromStorage();
      
      const typeCount = {};
      evidence.forEach(e => {
        typeCount[e.type] = (typeCount[e.type] || 0) + 1;
      });
      
      return {
        total: evidence.length,
        verified: evidence.filter(e => e.verified).length,
        unverified: evidence.filter(e => !e.verified).length,
        byType: typeCount,
        recentlyAdded: evidence.filter(e => {
          const createdAt = new Date(e.createdAt);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return createdAt > dayAgo;
        }).length
      };
    }

    return api.get(`${ENDPOINT}/statistics`);
  },

  // Search evidence
  search: async (query) => {
    return evidenceService.getAll({ search: query });
  },

  // Export evidence
  export: async (format = 'json', ids = null) => {
    if (useFallback) {
      let evidence = getFromStorage();
      
      if (ids && ids.length > 0) {
        evidence = evidence.filter(e => ids.includes(e.id));
      }
      
      if (format === 'json') {
        return JSON.stringify(evidence, null, 2);
      }
      
      // CSV format
      if (format === 'csv') {
        const headers = ['id', 'type', 'title', 'source', 'verified', 'createdAt'];
        const rows = evidence.map(e => headers.map(h => e[h] || '').join(','));
        return [headers.join(','), ...rows].join('\n');
      }
      
      return evidence;
    }

    const params = new URLSearchParams({ format });
    if (ids) {
      params.append('ids', ids.join(','));
    }
    return api.get(`${ENDPOINT}/export?${params.toString()}`);
  },

  // Bulk operations
  bulkDelete: async (ids) => {
    if (useFallback) {
      const evidence = getFromStorage();
      const filtered = evidence.filter(e => !ids.includes(e.id));
      saveToStorage(filtered);
      return { success: true, deletedCount: evidence.length - filtered.length };
    }

    return api.post(`${ENDPOINT}/bulk-delete`, { ids });
  },

  bulkVerify: async (ids) => {
    if (useFallback) {
      const evidence = getFromStorage();
      let verifiedCount = 0;
      
      evidence.forEach(e => {
        if (ids.includes(e.id) && !e.verified) {
          e.verified = true;
          e.verifiedAt = new Date().toISOString();
          e.updatedAt = new Date().toISOString();
          verifiedCount++;
        }
      });
      
      saveToStorage(evidence);
      return { success: true, verifiedCount };
    }

    return api.post(`${ENDPOINT}/bulk-verify`, { ids });
  }
};

export default evidenceService;
