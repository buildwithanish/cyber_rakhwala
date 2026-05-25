import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import evidenceService from '../services/evidenceService';
import { useAuth } from './AuthContext';
import { useCases } from './CaseContext';

const EvidenceContext = createContext(null);

const normalizeEvidence = (item = {}, caseMap = new Map()) => {
  const backendId = item._documentId || item._id || item.id;
  const rawCaseId = item.caseId || item.case?._id || item.case || null;
  const linkedCase = rawCaseId ? caseMap.get(String(rawCaseId)) : null;
  const displayId = item.metadata?.displayId || item.id || `EVD-${String(backendId).slice(-6).toUpperCase()}`;

  return {
    ...item,
    _documentId: backendId,
    id: displayId,
    type: item.type || 'document',
    title: item.title || 'Evidence item',
    data: item.data || '',
    case: linkedCase?._documentId || rawCaseId || null,
    caseId: linkedCase?.id || item.caseId || rawCaseId || '',
    collected: item.collected || item.createdAt || new Date().toISOString(),
    correlations: Array.isArray(item.correlations)
      ? item.correlations.map((entry) =>
          typeof entry === 'string' ? entry : String(entry.evidenceId || entry.id || '')
        )
      : [],
    notes: item.notes || item.description || item.metadata?.description || '',
    description: item.description || item.notes || item.metadata?.description || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    source: item.source || 'Manual Entry',
    verified: Boolean(item.verified),
    metadata: item.metadata || {},
    linkedEvidence: item.linkedEvidence || item.metadata?.linkedEvidence || [],
    chainOfCustody: item.chainOfCustody || item.metadata?.chainOfCustody || [],
    addedAt: item.addedAt || item.createdAt || item.collected || new Date().toISOString(),
    addedBy: item.addedBy || item.metadata?.addedBy || 'Current User'
  };
};

const stringifyValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const sanitizeEvidencePayload = (updates = {}, resolveCaseIdentifier) => {
  const payload = {};

  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.data !== undefined) payload.data = stringifyValue(updates.data);
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.description !== undefined) payload.notes = updates.description;
  if (updates.source !== undefined) payload.source = updates.source;
  if (updates.verified !== undefined) payload.verified = updates.verified;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.caseId !== undefined) payload.case = updates.caseId ? resolveCaseIdentifier(updates.caseId) : null;
  if (updates.case !== undefined) payload.case = updates.case ? resolveCaseIdentifier(updates.case) : null;
  if (updates.metadata !== undefined) payload.metadata = updates.metadata;

  return payload;
};

export const useEvidence = () => {
  const context = useContext(EvidenceContext);
  if (!context) {
    throw new Error('useEvidence must be used within EvidenceProvider');
  }
  return context;
};

export const EvidenceProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { cases, refreshCases } = useCases();
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const caseMap = useMemo(() => {
    const map = new Map();

    cases.forEach((item) => {
      if (item._documentId) {
        map.set(String(item._documentId), item);
      }
      if (item.id) {
        map.set(String(item.id), item);
      }
    });

    return map;
  }, [cases]);

  const resolveEvidenceIdentifier = useCallback(
    (evidenceId) => {
      const match =
        evidence.find((item) => item.id === evidenceId || item._documentId === evidenceId) || null;

      return match?._documentId || evidenceId;
    },
    [evidence]
  );

  const resolveCaseIdentifier = useCallback(
    (caseId) => {
      const match = cases.find((item) => item.id === caseId || item._documentId === caseId) || null;
      return match?._documentId || caseId;
    },
    [cases]
  );

  const upsertEvidence = useCallback(
    (nextEvidence) => {
      const normalized = normalizeEvidence(nextEvidence, caseMap);

      setEvidence((previous) => {
        const exists = previous.some(
          (item) => item.id === normalized.id || item._documentId === normalized._documentId
        );

        if (!exists) {
          return [normalized, ...previous];
        }

        return previous.map((item) =>
          item.id === normalized.id || item._documentId === normalized._documentId ? normalized : item
        );
      });

      setSelectedEvidence((previous) => {
        if (!previous) {
          return previous;
        }

        return previous.id === normalized.id || previous._documentId === normalized._documentId
          ? normalized
          : previous;
      });

      return normalized;
    },
    [caseMap]
  );

  const loadEvidence = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setEvidence([]);
      setSelectedEvidence(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const payload = await evidenceService.getAll({
        limit: 200
      });

      const items = Array.isArray(payload) ? payload.map((entry) => normalizeEvidence(entry, caseMap)) : [];
      setEvidence(items);
      setSelectedEvidence((previous) =>
        previous
          ? items.find((item) => item.id === previous.id || item._documentId === previous._documentId) || null
          : null
      );
    } catch (error) {
      console.error('[EvidenceContext] Failed to load evidence:', error);
      setEvidence([]);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, caseMap, isAuthenticated]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const createEvidence = useCallback(
    async (evidenceData) => {
      try {
        const created = await evidenceService.create({
          type: evidenceData.type || 'document',
          title: evidenceData.title,
          data: stringifyValue(evidenceData.data),
          case:
            evidenceData.case || evidenceData.caseId
              ? resolveCaseIdentifier(evidenceData.case || evidenceData.caseId)
              : undefined,
          notes: evidenceData.notes || '',
          tags: evidenceData.tags || [],
          source: evidenceData.source || 'Manual Entry',
          metadata: {
            description: evidenceData.description || '',
            url: evidenceData.url || '',
            linkedEvidence: evidenceData.linkedEvidence || [],
            chainOfCustody: evidenceData.chainOfCustody || [],
            addedBy: evidenceData.addedBy || 'Current User'
          }
        });

        const normalized = upsertEvidence(created);
        if (normalized.case) {
          await refreshCases();
        }

        return { success: true, evidence: normalized };
      } catch (error) {
        console.error('[EvidenceContext] Failed to create evidence:', error);
        return { success: false, error: error.message || 'Failed to create evidence' };
      }
    },
    [refreshCases, resolveCaseIdentifier, upsertEvidence]
  );

  const updateEvidence = useCallback(
    async (evidenceId, updates) => {
      try {
        const payload = sanitizeEvidencePayload(updates, resolveCaseIdentifier);
        const updated = await evidenceService.update(resolveEvidenceIdentifier(evidenceId), payload);
        const normalized = upsertEvidence(updated);

        if (payload.case !== undefined) {
          await refreshCases();
        }

        return { success: true, evidence: normalized };
      } catch (error) {
        console.error('[EvidenceContext] Failed to update evidence:', error);
        return { success: false, error: error.message || 'Failed to update evidence' };
      }
    },
    [refreshCases, resolveCaseIdentifier, resolveEvidenceIdentifier, upsertEvidence]
  );

  const deleteEvidence = useCallback(
    async (evidenceId) => {
      const match = evidence.find((item) => item.id === evidenceId || item._documentId === evidenceId) || null;

      try {
        await evidenceService.delete(resolveEvidenceIdentifier(evidenceId));
        setEvidence((previous) =>
          previous.filter((item) => item.id !== evidenceId && item._documentId !== evidenceId)
        );
        setSelectedEvidence((previous) =>
          previous && (previous.id === evidenceId || previous._documentId === evidenceId) ? null : previous
        );

        if (match?.case) {
          await refreshCases();
        }

        return { success: true };
      } catch (error) {
        console.error('[EvidenceContext] Failed to delete evidence:', error);
        return { success: false, error: error.message || 'Failed to delete evidence' };
      }
    },
    [evidence, refreshCases, resolveEvidenceIdentifier]
  );

  const addCorrelation = useCallback(
    async (evidenceId1, evidenceId2) => {
      try {
        const updated = await evidenceService.addCorrelation(
          resolveEvidenceIdentifier(evidenceId1),
          resolveEvidenceIdentifier(evidenceId2)
        );
        return { success: true, evidence: upsertEvidence(updated) };
      } catch (error) {
        console.error('[EvidenceContext] Failed to add correlation:', error);
        return { success: false, error: error.message || 'Failed to add correlation' };
      }
    },
    [resolveEvidenceIdentifier, upsertEvidence]
  );

  const verifyEvidence = useCallback(
    async (evidenceId) => {
      try {
        const updated = await evidenceService.verify(resolveEvidenceIdentifier(evidenceId));
        return { success: true, evidence: upsertEvidence(updated) };
      } catch (error) {
        console.error('[EvidenceContext] Failed to verify evidence:', error);
        return { success: false, error: error.message || 'Failed to verify evidence' };
      }
    },
    [resolveEvidenceIdentifier, upsertEvidence]
  );

  const linkToCase = useCallback(
    async (evidenceId, caseId) => updateEvidence(evidenceId, { caseId }),
    [updateEvidence]
  );

  const unlinkFromCase = useCallback(
    async (evidenceId) => updateEvidence(evidenceId, { caseId: null }),
    [updateEvidence]
  );

  const addTag = useCallback(
    async (evidenceId, tag) => {
      try {
        const updated = await evidenceService.addTag(resolveEvidenceIdentifier(evidenceId), tag);
        return { success: true, evidence: upsertEvidence(updated) };
      } catch (error) {
        console.error('[EvidenceContext] Failed to add tag:', error);
        return { success: false, error: error.message || 'Failed to add tag' };
      }
    },
    [resolveEvidenceIdentifier, upsertEvidence]
  );

  const removeTag = useCallback(
    async (evidenceId, tag) => {
      try {
        const updated = await evidenceService.removeTag(resolveEvidenceIdentifier(evidenceId), tag);
        return { success: true, evidence: upsertEvidence(updated) };
      } catch (error) {
        console.error('[EvidenceContext] Failed to remove tag:', error);
        return { success: false, error: error.message || 'Failed to remove tag' };
      }
    },
    [resolveEvidenceIdentifier, upsertEvidence]
  );

  const getEvidenceById = useCallback(
    (evidenceId) => evidence.find((item) => item.id === evidenceId || item._documentId === evidenceId) || null,
    [evidence]
  );

  const getEvidenceByCase = useCallback(
    (caseId) => evidence.filter((item) => item.caseId === caseId || item.case === caseId),
    [evidence]
  );

  const getEvidenceByType = useCallback(
    (type) => (type === 'all' ? evidence : evidence.filter((item) => item.type === type)),
    [evidence]
  );

  const searchEvidence = useCallback(
    (query) => {
      const normalized = query.toLowerCase();
      return evidence.filter(
        (item) =>
          item.title.toLowerCase().includes(normalized) ||
          item.data.toLowerCase().includes(normalized) ||
          item.notes.toLowerCase().includes(normalized) ||
          item.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    },
    [evidence]
  );

  const getStatistics = useCallback(() => {
    const types = evidence.reduce((accumulator, item) => {
      accumulator[item.type] = (accumulator[item.type] || 0) + 1;
      return accumulator;
    }, {});

    return {
      total: evidence.length,
      verified: evidence.filter((item) => item.verified).length,
      unverified: evidence.filter((item) => !item.verified).length,
      linked: evidence.filter((item) => item.case).length,
      unlinked: evidence.filter((item) => !item.case).length,
      totalCorrelations: evidence.reduce((sum, item) => sum + item.correlations.length, 0),
      byType: types,
      types,
      uniqueCases: new Set(evidence.filter((item) => item.case).map((item) => item.case)).size
    };
  }, [evidence]);

  const getAllTags = useCallback(
    () => [...new Set(evidence.flatMap((item) => item.tags))],
    [evidence]
  );

  const value = useMemo(
    () => ({
      evidence,
      selectedEvidence,
      setSelectedEvidence,
      isLoading,
      createEvidence,
      updateEvidence,
      deleteEvidence,
      addCorrelation,
      verifyEvidence,
      linkToCase,
      unlinkFromCase,
      addTag,
      removeTag,
      getEvidenceById,
      getEvidenceByCase,
      getEvidenceByType,
      searchEvidence,
      getStatistics,
      getAllTags,
      refreshEvidence: loadEvidence
    }),
    [
      addCorrelation,
      addTag,
      createEvidence,
      deleteEvidence,
      evidence,
      getAllTags,
      getEvidenceByCase,
      getEvidenceById,
      getEvidenceByType,
      getStatistics,
      isLoading,
      linkToCase,
      loadEvidence,
      removeTag,
      searchEvidence,
      selectedEvidence,
      unlinkFromCase,
      updateEvidence,
      verifyEvidence
    ]
  );

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
};

export default EvidenceContext;
