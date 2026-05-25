import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import caseService from '../services/caseService';
import evidenceService from '../services/evidenceService';
import { useAuth } from './AuthContext';

const CaseContext = createContext(null);

const toDateString = (value) => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
};

const buildAvatar = (name = 'TM') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'TM';

const normalizeTimeline = (entry = {}) => ({
  ...entry,
  id: entry.id || entry._id || `timeline-${Math.random().toString(36).slice(2, 10)}`,
  time: entry.time || entry.timestamp || new Date().toISOString(),
  event: entry.event || entry.action || 'Case updated',
  type: entry.type || 'action'
});

const normalizeNote = (entry = {}) => ({
  ...entry,
  id: entry.id || entry._id || `note-${Math.random().toString(36).slice(2, 10)}`,
  content: entry.content || entry.text || '',
  text: entry.text || entry.content || '',
  author: entry.author || entry.authorName || 'Unknown',
  authorName: entry.authorName || entry.author || 'Unknown',
  createdAt: entry.createdAt || entry.timestamp || new Date().toISOString(),
  timestamp: entry.timestamp || entry.createdAt || new Date().toISOString()
});

const normalizeEvidenceReference = (entry = {}) => {
  if (!entry || typeof entry !== 'object') {
    return entry;
  }

  const backendId = entry._documentId || entry._id || entry.id;
  return {
    ...entry,
    _documentId: backendId,
    id: entry.metadata?.displayId || entry.id || entry._id || backendId,
    caseId: entry.caseId || entry.caseNumber || entry.case || null
  };
};

const normalizeTeamMember = (member = {}) => ({
  ...member,
  id: member.id || member._id || `team-${Math.random().toString(36).slice(2, 10)}`,
  name: member.name || member.email || 'Team Member',
  email: member.email || '',
  role: member.role || 'viewer',
  avatar: member.avatar || buildAvatar(member.name || member.email || 'TM'),
  online: Boolean(member.online)
});

const normalizeCase = (caseItem = {}) => {
  const backendId = caseItem._documentId || caseItem._id || caseItem.id;
  const publicId = caseItem.caseId || caseItem.caseNumber || caseItem.id || backendId;
  const evidence = Array.isArray(caseItem.evidence)
    ? caseItem.evidence.map(normalizeEvidenceReference)
    : [];

  return {
    ...caseItem,
    _documentId: backendId,
    id: publicId,
    caseId: publicId,
    caseNumber: publicId,
    created: caseItem.created || toDateString(caseItem.createdAt),
    lastActivity: caseItem.lastActivity || caseItem.updatedAt || caseItem.createdAt || new Date().toISOString(),
    progress: Number(caseItem.progress || 0),
    dataPoints: Number(caseItem.dataPoints ?? evidence.length ?? 0),
    correlations: Number(caseItem.correlations || 0),
    creditsSpent: Number(caseItem.creditsSpent || 0),
    tags: Array.isArray(caseItem.tags) ? caseItem.tags : [],
    checklist: Array.isArray(caseItem.checklist) ? caseItem.checklist : [],
    graphNodes: Array.isArray(caseItem.graphNodes) ? caseItem.graphNodes : [],
    graphEdges: Array.isArray(caseItem.graphEdges) ? caseItem.graphEdges : [],
    toolResults: Array.isArray(caseItem.toolResults) ? caseItem.toolResults : [],
    watchlistItems: Array.isArray(caseItem.watchlistItems) ? caseItem.watchlistItems : [],
    watchlistAlerts: Array.isArray(caseItem.watchlistAlerts) ? caseItem.watchlistAlerts : [],
    evidence,
    notes: Array.isArray(caseItem.notes) ? caseItem.notes.map(normalizeNote) : [],
    timeline: Array.isArray(caseItem.timeline) ? caseItem.timeline.map(normalizeTimeline) : [],
    team: Array.isArray(caseItem.team) ? caseItem.team.map(normalizeTeamMember) : []
  };
};

const sanitizeCasePayload = (updates = {}) => {
  const allowed = [
    'title',
    'description',
    'status',
    'priority',
    'progress',
    'dataPoints',
    'correlations',
    'creditsSpent',
    'tags',
    'checklist',
    'graphNodes',
    'graphEdges',
    'toolResults',
    'watchlistItems',
    'watchlistAlerts'
  ];

  return Object.fromEntries(
    Object.entries(updates).filter(([key, value]) => allowed.includes(key) && value !== undefined)
  );
};

const stringifyEvidenceData = (value) => {
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

export const useCases = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within CaseProvider');
  }
  return context;
};

export const CaseProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveCaseIdentifier = useCallback(
    (caseId) => {
      const match =
        cases.find((item) => item.id === caseId || item.caseId === caseId || item._documentId === caseId) || null;

      return match?._documentId || caseId;
    },
    [cases]
  );

  const upsertCase = useCallback((nextCase) => {
    const normalized = normalizeCase(nextCase);

    setCases((previous) => {
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

    setSelectedCase((previous) => {
      if (!previous) {
        return previous;
      }

      return previous.id === normalized.id || previous._documentId === normalized._documentId
        ? normalized
        : previous;
    });

    return normalized;
  }, []);

  const loadCases = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setCases([]);
      setSelectedCase(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const payload = await caseService.getAll({
        limit: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });

      const nextCases = Array.isArray(payload) ? payload.map(normalizeCase) : [];
      setCases(nextCases);
      setSelectedCase((previous) =>
        previous ? nextCases.find((item) => item.id === previous.id || item._documentId === previous._documentId) || null : null
      );
    } catch (error) {
      console.error('[CaseContext] Failed to load cases:', error);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const createCase = useCallback(
    async (caseData) => {
      try {
        const created = await caseService.create(caseData);
        const nextCase = upsertCase(created);
        return { success: true, case: nextCase };
      } catch (error) {
        console.error('[CaseContext] Failed to create case:', error);
        return { success: false, error: error.message || 'Failed to create case' };
      }
    },
    [upsertCase]
  );

  const updateCase = useCallback(
    async (caseId, updates) => {
      try {
        const payload = sanitizeCasePayload(updates);
        const nextCase =
          Object.keys(payload).length > 0
            ? await caseService.update(resolveCaseIdentifier(caseId), payload)
            : await caseService.getById(resolveCaseIdentifier(caseId));

        const normalized = upsertCase(nextCase);
        return { success: true, case: normalized };
      } catch (error) {
        console.error('[CaseContext] Failed to update case:', error);
        return { success: false, error: error.message || 'Failed to update case' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const deleteCase = useCallback(
    async (caseId) => {
      try {
        const backendId = resolveCaseIdentifier(caseId);
        await caseService.delete(backendId);
        setCases((previous) =>
          previous.filter((item) => item.id !== caseId && item._documentId !== backendId)
        );
        setSelectedCase((previous) =>
          previous && (previous.id === caseId || previous._documentId === backendId) ? null : previous
        );
        return { success: true };
      } catch (error) {
        console.error('[CaseContext] Failed to delete case:', error);
        return { success: false, error: error.message || 'Failed to delete case' };
      }
    },
    [resolveCaseIdentifier]
  );

  const addEvidenceToCase = useCallback(
    async (caseId, evidenceId) => {
      try {
        const nextCase = await caseService.addEvidence(resolveCaseIdentifier(caseId), evidenceId);
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to add evidence to case:', error);
        return { success: false, error: error.message || 'Failed to add evidence' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const addEvidence = useCallback(
    async (caseId, evidenceData) => {
      try {
        const backendCaseId = resolveCaseIdentifier(caseId);
        const createdEvidence = await evidenceService.create({
          case: backendCaseId,
          type: evidenceData.type || 'document',
          title: evidenceData.title || 'Evidence item',
          data: stringifyEvidenceData(
            evidenceData.data ??
              evidenceData.query ??
              evidenceData.description ??
              evidenceData.source ??
              evidenceData.title
          ),
          notes: evidenceData.notes || evidenceData.description || '',
          source: evidenceData.source || evidenceData.tool || 'Manual Entry',
          tags: evidenceData.tags || []
        });

        const refreshedCase = await caseService.getById(backendCaseId);
        const normalizedCase = upsertCase(refreshedCase);

        return {
          success: true,
          case: normalizedCase,
          evidence: normalizeEvidenceReference(createdEvidence)
        };
      } catch (error) {
        console.error('[CaseContext] Failed to create evidence from case:', error);
        return { success: false, error: error.message || 'Failed to create evidence' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const addNoteToCase = useCallback(
    async (caseId, noteText) => {
      try {
        const nextCase = await caseService.addNote(resolveCaseIdentifier(caseId), noteText);
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to add note:', error);
        return { success: false, error: error.message || 'Failed to add note' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const addNote = useCallback((caseId, noteText) => addNoteToCase(caseId, noteText), [addNoteToCase]);

  const addTimelineEvent = useCallback(
    async (caseId, event, type = 'action') => {
      try {
        const payload =
          typeof event === 'object' && event !== null
            ? event
            : {
                event,
                type
              };

        const nextCase = await caseService.addTimelineEvent(resolveCaseIdentifier(caseId), payload);
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to add timeline event:', error);
        return { success: false, error: error.message || 'Failed to add timeline event' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const updateTimelineEvent = useCallback(
    async (caseId, timelineId, updates) => {
      try {
        const nextCase = await caseService.updateTimelineEvent(
          resolveCaseIdentifier(caseId),
          timelineId,
          updates
        );
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to update timeline event:', error);
        return { success: false, error: error.message || 'Failed to update timeline event' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const deleteTimelineEvent = useCallback(
    async (caseId, timelineId) => {
      try {
        const nextCase = await caseService.deleteTimelineEvent(resolveCaseIdentifier(caseId), timelineId);
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to delete timeline event:', error);
        return { success: false, error: error.message || 'Failed to delete timeline event' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const updateProgress = useCallback(
    (caseId, progress) => updateCase(caseId, { progress: Math.min(100, Math.max(0, progress)) }),
    [updateCase]
  );

  const spendCreditsOnCase = useCallback(
    async (caseId, amount) => {
      const caseItem = cases.find(
        (item) => item.id === caseId || item.caseId === caseId || item._documentId === caseId
      );

      if (!caseItem) {
        return { success: false, error: 'Case not found' };
      }

      return updateCase(caseId, {
        creditsSpent: Number(caseItem.creditsSpent || 0) + Number(amount || 0)
      });
    },
    [cases, updateCase]
  );

  const addTeamMember = useCallback(
    async (caseId, memberData) => {
      try {
        const nextCase = await caseService.addTeamMember(resolveCaseIdentifier(caseId), memberData);
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to add team member:', error);
        return { success: false, error: error.message || 'Failed to add team member' };
      }
    },
    [resolveCaseIdentifier, upsertCase]
  );

  const removeTeamMember = useCallback(
    async (caseId, memberId) => {
      const caseItem = cases.find(
        (item) => item.id === caseId || item.caseId === caseId || item._documentId === caseId
      );
      const member = caseItem?.team?.find((entry) => entry.id === memberId || entry._id === memberId);

      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      try {
        const nextCase = await caseService.removeTeamMember(resolveCaseIdentifier(caseId), member.id || memberId);
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to remove team member:', error);
        return { success: false, error: error.message || 'Failed to remove team member' };
      }
    },
    [cases, resolveCaseIdentifier, upsertCase]
  );

  const updateTeamMemberRole = useCallback(
    async (caseId, memberId, newRole) => {
      const caseItem = cases.find(
        (item) => item.id === caseId || item.caseId === caseId || item._documentId === caseId
      );
      const member = caseItem?.team?.find((entry) => entry.id === memberId || entry._id === memberId);

      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      try {
        const nextCase = await caseService.updateTeamMemberRole(
          resolveCaseIdentifier(caseId),
          member.id || memberId,
          newRole
        );
        return { success: true, case: upsertCase(nextCase) };
      } catch (error) {
        console.error('[CaseContext] Failed to update team role:', error);
        return { success: false, error: error.message || 'Failed to update team role' };
      }
    },
    [cases, resolveCaseIdentifier, upsertCase]
  );

  const getCaseById = useCallback(
    (caseId) =>
      cases.find((item) => item.id === caseId || item.caseId === caseId || item._documentId === caseId) || null,
    [cases]
  );

  const getCasesByStatus = useCallback(
    (status) => (status === 'all' ? cases : cases.filter((item) => item.status === status)),
    [cases]
  );

  const getStatistics = useCallback(() => {
    const total = cases.length;
    const active = cases.filter((item) => item.status === 'active').length;
    const paused = cases.filter((item) => item.status === 'paused').length;
    const completed = cases.filter((item) => item.status === 'completed').length;

    return {
      total,
      active,
      paused,
      completed,
      pending: cases.filter((item) => item.status === 'pending').length,
      closed: completed,
      totalDataPoints: cases.reduce((sum, item) => sum + Number(item.dataPoints || 0), 0),
      totalCorrelations: cases.reduce((sum, item) => sum + Number(item.correlations || 0), 0),
      totalCreditsSpent: cases.reduce((sum, item) => sum + Number(item.creditsSpent || 0), 0),
      byPriority: {
        low: cases.filter((item) => item.priority === 'low').length,
        medium: cases.filter((item) => item.priority === 'medium').length,
        high: cases.filter((item) => item.priority === 'high').length,
        critical: cases.filter((item) => item.priority === 'critical').length
      }
    };
  }, [cases]);

  const value = useMemo(
    () => ({
      cases,
      selectedCase,
      setSelectedCase,
      isLoading,
      createCase,
      updateCase,
      deleteCase,
      addEvidenceToCase,
      addEvidence,
      addNoteToCase,
      addNote,
      addTimelineEvent,
      updateTimelineEvent,
      deleteTimelineEvent,
      updateProgress,
      spendCreditsOnCase,
      addTeamMember,
      removeTeamMember,
      updateTeamMemberRole,
      getCaseById,
      getCasesByStatus,
      getStatistics,
      refreshCases: loadCases,
      currentUser: user
    }),
    [
      addEvidence,
      addEvidenceToCase,
      addNote,
      addNoteToCase,
      addTeamMember,
      addTimelineEvent,
      deleteTimelineEvent,
      cases,
      createCase,
      deleteCase,
      getCaseById,
      getCasesByStatus,
      getStatistics,
      isLoading,
      loadCases,
      removeTeamMember,
      selectedCase,
      spendCreditsOnCase,
      updateCase,
      updateTimelineEvent,
      updateProgress,
      updateTeamMemberRole,
      user
    ]
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};

export default CaseContext;
