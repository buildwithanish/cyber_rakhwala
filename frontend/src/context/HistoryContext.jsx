import { createContext, useContext, useMemo, useState } from 'react';
import { useSearchHistory } from './SearchHistoryContext';

const HistoryContext = createContext();

const TOOL_ALIAS_MAP = {
  'ip-intelligence': 'ip-trace',
  'domain-analysis': 'domain',
  'email-forensics': 'email',
  'phone-lookup': 'phone',
  'hash-analyzer': 'hash',
  'url-scanner': 'url',
  geolocation: 'geo',
  'breach-database': 'breach',
  'dns-records': 'dns',
  'data-mining': 'database',
  'social-profiler': 'social',
  'image-exif': 'image',
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

const normalizeToolId = (toolId) => TOOL_ALIAS_MAP[toolId] || toolId;

export const HistoryProvider = ({ children }) => {
  const {
    addSearch,
    getToolHistory: getToolSearchHistory,
    getRecentSearches,
    clearAllHistory,
    removeSearch
  } = useSearchHistory();
  const [manualBookmarks, setManualBookmarks] = useState([]);

  const history = useMemo(
    () =>
      getRecentSearches(200).map((item) => ({
        id: item.id,
        tool: item.toolId,
        query: item.query,
        result: item.resultsSummary || '',
        timestamp: item.timestamp,
        bookmarked: item.bookmarked
      })),
    [getRecentSearches]
  );

  const bookmarks = useMemo(() => manualBookmarks, [manualBookmarks]);

  const addToHistory = (tool, query, result) => {
    const entry = addSearch(normalizeToolId(tool), query, result);
    return entry?.id || Date.now();
  };

  const removeFromHistory = (id) => {
    const entry = history.find((item) => item.id === id);
    if (!entry) return;
    removeSearch(entry.tool, entry.id);
  };

  const clearHistory = () => {
    clearAllHistory();
  };

  const getToolHistory = (toolName) => {
    const normalized = normalizeToolId(toolName);
    return getToolSearchHistory(normalized).map((item) => ({
      id: item.id,
      tool: normalized,
      query: item.query,
      result: item.resultsSummary || '',
      timestamp: item.timestamp,
      bookmarked: item.bookmarked
    }));
  };

  const searchHistory = (query) => {
    const normalized = query.toLowerCase();
    return history.filter(
      (item) =>
        item.query?.toLowerCase().includes(normalized) ||
        item.tool?.toLowerCase().includes(normalized) ||
        item.result?.toLowerCase().includes(normalized)
    );
  };

  const addBookmark = (item) => {
    const bookmark = {
      id: item.id || Date.now(),
      timestamp: item.timestamp || new Date().toISOString(),
      ...item
    };

    setManualBookmarks((previous) => {
      const exists = previous.some((entry) => entry.tool === bookmark.tool && entry.query === bookmark.query);
      return exists ? previous : [bookmark, ...previous];
    });

    return bookmark.id;
  };

  const removeBookmark = (id) => {
    setManualBookmarks((previous) => previous.filter((item) => item.id !== id));
  };

  const isBookmarked = (tool, query) =>
    manualBookmarks.some((item) => item.tool === tool && item.query === query);

  const toggleBookmark = (item) => {
    const existing = manualBookmarks.find(
      (entry) => entry.tool === item.tool && entry.query === item.query
    );

    if (existing) {
      removeBookmark(existing.id);
      return false;
    }

    addBookmark(item);
    return true;
  };

  const clearBookmarks = () => {
    setManualBookmarks([]);
  };

  const getToolBookmarks = (toolName) =>
    manualBookmarks.filter((item) => item.tool === normalizeToolId(toolName));

  const exportHistory = () => JSON.stringify({ history, bookmarks }, null, 2);

  const importHistory = () => false;

  const value = {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getToolHistory,
    searchHistory,
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
    clearBookmarks,
    getToolBookmarks,
    exportHistory,
    importHistory
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within HistoryProvider');
  }
  return context;
};

export default HistoryContext;
