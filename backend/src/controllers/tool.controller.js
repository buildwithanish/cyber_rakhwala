import { asyncHandler } from '../utils/asyncHandler.js';
import {
  clearSearchHistory,
  deleteSearchHistoryItem,
  executeOsintAction,
  executeToolAction,
  exportSearchResults,
  getSearchResult,
  listSearchHistory,
  setSearchBookmark
} from '../services/tool.service.js';

export const executeTool = asyncHandler(async (req, res) => {
  const result = await executeToolAction({
    category: req.validated.params.category,
    action: req.validated.params.action,
    entityId: req.validated.params.entityId,
    body: req.body,
    files: req.files,
    user: req.user,
    req
  });
  res.success({
    message: 'Tool action completed',
    data: result
  });
});

export const executeOsint = asyncHandler(async (req, res) => {
  const result = await executeOsintAction({
    action: req.validated.params.action,
    body: req.body,
    user: req.user,
    req
  });
  res.success({
    message: 'OSINT action completed',
    data: result
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const result = await listSearchHistory({
    query: req.validated.query,
    user: req.user
  });
  res.success({
    message: 'Search history loaded',
    data: result.items,
    meta: result.meta
  });
});

export const clearHistory = asyncHandler(async (req, res) => {
  await clearSearchHistory(req.user._id, req.validated?.query?.toolId);
  res.success({
    message: 'Search history cleared'
  });
});

export const removeHistoryItem = asyncHandler(async (req, res) => {
  await deleteSearchHistoryItem({
    id: req.validated.params.id,
    userId: req.user._id
  });
  res.success({
    message: 'Search history item removed'
  });
});

export const updateBookmark = asyncHandler(async (req, res) => {
  const item = await setSearchBookmark({
    id: req.validated.params.id,
    userId: req.user._id,
    bookmarked: req.validated.body.bookmarked
  });
  res.success({
    message: 'Bookmark updated',
    data: item
  });
});

export const getResult = asyncHandler(async (req, res) => {
  const item = await getSearchResult({
    id: req.params.id,
    userId: req.user._id
  });
  res.success({
    message: 'Search result loaded',
    data: item
  });
});

export const exportResults = asyncHandler(async (req, res) => {
  const ids = req.query.ids ? String(req.query.ids).split(',') : [];
  const data = await exportSearchResults({
    userId: req.user._id,
    ids,
    format: req.query.format || 'json'
  });
  res.success({
    message: 'Search results exported',
    data
  });
});
