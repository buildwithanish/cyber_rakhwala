import mongoose from 'mongoose';

const MAX_DEBUG_ENTRIES = 100;

const debugState = {
  startedAt: new Date().toISOString(),
  recentRequests: [],
  recentErrors: []
};

const pushLimited = (collection, entry) => {
  collection.unshift(entry);
  if (collection.length > MAX_DEBUG_ENTRIES) {
    collection.length = MAX_DEBUG_ENTRIES;
  }
};

export const recordDebugRequest = (payload) => {
  pushLimited(debugState.recentRequests, {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...payload
  });
};

export const recordDebugError = (payload) => {
  pushLimited(debugState.recentErrors, {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...payload
  });
};

const getMongoStateLabel = (readyState) => {
  switch (readyState) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

export const getDebugSnapshot = () => ({
  app: {
    status: 'ok',
    startedAt: debugState.startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  },
  mongo: {
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    readyState: mongoose.connection.readyState,
    stateLabel: getMongoStateLabel(mongoose.connection.readyState)
  },
  recentRequests: [...debugState.recentRequests],
  recentErrors: [...debugState.recentErrors]
});

export const clearDebugSnapshot = () => {
  debugState.recentRequests = [];
  debugState.recentErrors = [];
};
