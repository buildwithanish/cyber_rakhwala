import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import searchHistoryService from '../services/searchHistoryService';
import { useAuth } from './AuthContext';

const SearchHistoryContext = createContext(null);
const MAX_HISTORY_PER_TOOL = 50;

const BACKEND_TO_FRONTEND_TOOL = {
  'ip-intelligence': 'ip-trace',
  'domain-analysis': 'domain',
  'email-forensics': 'email',
  'phone-lookup': 'phone',
  'social-profiler': 'social',
  'hash-analyzer': 'hash',
  'url-scanner': 'url',
  geolocation: 'geo',
  'breach-database': 'breach',
  'dns-records': 'dns',
  'data-mining': 'database',
  'whatsapp-trace': 'whatsapp',
  'face-recognition': 'face',
  'vehicle-info': 'vehicle',
  'upi-info': 'upi',
  'aadhaar-info': 'aadhaar',
  'pan-info': 'pan',
  'cdr-analysis': 'cdr',
  'ipdr-analysis': 'ipdr',
  'person-location': 'person'
};

const FRONTEND_TO_BACKEND_TOOL = Object.fromEntries(
  Object.entries(BACKEND_TO_FRONTEND_TOOL).map(([backendKey, frontendKey]) => [frontendKey, backendKey])
);

const summarizeResults = (results) => {
  if (!results) return null;

  if (Array.isArray(results)) {
    return `${results.length} results`;
  }

  if (typeof results === 'object') {
    return `${Object.keys(results).length} data points`;
  }

  return 'Data retrieved';
};

const normalizeSearchEntry = (entry = {}) => {
  const backendId = entry.backendId || entry._id || entry.id;
  const frontendToolId = BACKEND_TO_FRONTEND_TOOL[entry.toolId] || entry.toolId || 'unknown';

  return {
    ...entry,
    id: entry.id || backendId || `search-${Math.random().toString(36).slice(2, 10)}`,
    backendId,
    toolId: frontendToolId,
    rawToolId: entry.toolId || FRONTEND_TO_BACKEND_TOOL[frontendToolId] || frontendToolId,
    query: entry.query || '',
    timestamp: entry.timestamp || entry.createdAt || new Date().toISOString(),
    hasResults:
      entry.hasResults ??
      Boolean(entry.responsePayload || entry.resultsSummary || entry.resultSummary),
    resultsSummary:
      entry.resultsSummary || entry.resultSummary || summarizeResults(entry.responsePayload || null),
    bookmarked: Boolean(entry.bookmarked)
  };
};

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext);
  if (!context) {
    throw new Error('useSearchHistory must be used within SearchHistoryProvider');
  }
  return context;
};

export const SearchHistoryProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [history, setHistory] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setHistory({});
      setIsLoaded(true);
      return;
    }

    try {
      const payload = await searchHistoryService.list({ limit: 100 });
      const grouped = {};

      if (Array.isArray(payload)) {
        payload.forEach((entry) => {
          const normalized = normalizeSearchEntry(entry);
          if (!grouped[normalized.toolId]) {
            grouped[normalized.toolId] = [];
          }
          grouped[normalized.toolId].push(normalized);
        });
      }

      setHistory(grouped);
    } catch (error) {
      console.error('[SearchHistory] Failed to load history:', error);
      setHistory({});
    } finally {
      setIsLoaded(true);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addSearch = useCallback((toolId, query, results = null) => {
    if (!query?.trim()) return null;

    const normalizedToolId = toolId || 'unknown';
    const searchEntry = normalizeSearchEntry({
      id: `search-${Date.now()}`,
      toolId: normalizedToolId,
      query: query.trim(),
      timestamp: new Date().toISOString(),
      hasResults: Boolean(results),
      resultsSummary: results ? summarizeResults(results) : null,
      localOnly: true
    });

    setHistory((previous) => {
      const toolHistory = previous[normalizedToolId] || [];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const isDuplicate = toolHistory.some(
        (item) =>
          item.query.toLowerCase() === searchEntry.query.toLowerCase() &&
          new Date(item.timestamp).getTime() > fiveMinutesAgo
      );

      if (isDuplicate) {
        return previous;
      }

      return {
        ...previous,
        [normalizedToolId]: [searchEntry, ...toolHistory].slice(0, MAX_HISTORY_PER_TOOL)
      };
    });

    return searchEntry;
  }, []);

  const getToolHistory = useCallback((toolId) => history[toolId] || [], [history]);

  const getRecentSearches = useCallback(
    (limit = 20) =>
      Object.entries(history)
        .flatMap(([toolId, searches]) => searches.map((item) => ({ ...item, toolId })))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit),
    [history]
  );

  const clearToolHistory = useCallback(
    (toolId) => {
      setHistory((previous) => {
        const next = { ...previous };
        delete next[toolId];
        return next;
      });

      const backendToolId = FRONTEND_TO_BACKEND_TOOL[toolId] || toolId;
      if (isAuthenticated) {
        searchHistoryService.clear({ toolId: backendToolId }).catch((error) => {
          console.error('[SearchHistory] Failed to clear tool history:', error);
        });
      }
    },
    [isAuthenticated]
  );

  const clearAllHistory = useCallback(() => {
    setHistory({});

    if (isAuthenticated) {
      searchHistoryService.clear().catch((error) => {
        console.error('[SearchHistory] Failed to clear all history:', error);
      });
    }
  }, [isAuthenticated]);

  const removeSearch = useCallback((toolId, searchId) => {
    const entry = (history[toolId] || []).find((item) => item.id === searchId);

    setHistory((previous) => {
      const toolHistory = previous[toolId] || [];
      return {
        ...previous,
        [toolId]: toolHistory.filter((item) => item.id !== searchId)
      };
    });

    if (isAuthenticated && entry?.backendId) {
      searchHistoryService.remove(entry.backendId).catch((error) => {
        console.error('[SearchHistory] Failed to remove search item:', error);
      });
    }
  }, [history, isAuthenticated]);

  const getStats = useCallback(() => {
    const totalSearches = Object.values(history).reduce((sum, items) => sum + items.length, 0);
    const toolsUsed = Object.keys(history).length;
    const mostUsedTool = Object.entries(history).sort((a, b) => b[1].length - a[1].length)[0];

    return {
      totalSearches,
      toolsUsed,
      mostUsedTool: mostUsedTool
        ? {
            toolId: mostUsedTool[0],
            count: mostUsedTool[1].length
          }
        : null
    };
  }, [history]);

  const value = useMemo(
    () => ({
      history,
      isLoaded,
      addSearch,
      getToolHistory,
      getRecentSearches,
      clearToolHistory,
      clearAllHistory,
      removeSearch,
      getStats,
      refreshHistory: loadHistory
    }),
    [
      addSearch,
      clearAllHistory,
      clearToolHistory,
      getRecentSearches,
      getStats,
      getToolHistory,
      history,
      isLoaded,
      loadHistory,
      removeSearch
    ]
  );

  return <SearchHistoryContext.Provider value={value}>{children}</SearchHistoryContext.Provider>;
};

export default SearchHistoryContext;
