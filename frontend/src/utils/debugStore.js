const MAX_ENTRIES = 50;
const listeners = new Set();

const state = {
  startedAt: new Date().toISOString(),
  frontendErrors: [],
  apiCalls: [],
  events: []
};

const isEnabled = () =>
  import.meta.env.DEV || import.meta.env.VITE_DEBUG_PANEL === 'true';

const shouldIgnoreFrontendError = (error, context = {}) => {
  const message = String(error?.message || '');
  const source = String(context?.source || '');

  if (
    message.includes("reading 'addListener'") &&
    (source.startsWith(`blob:${window.location.origin}`) || source.startsWith('blob:https://'))
  ) {
    return true;
  }

  return false;
};

const pushLimited = (collection, entry) => {
  collection.unshift(entry);
  if (collection.length > MAX_ENTRIES) {
    collection.length = MAX_ENTRIES;
  }
};

const notify = () => {
  const snapshot = getDebugSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

export const recordFrontendError = (error, context = {}) => {
  if (!isEnabled()) return;
  if (shouldIgnoreFrontendError(error, context)) return;

  pushLimited(state.frontendErrors, {
    id: `fe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack || null,
    context
  });

  notify();
};

export const recordApiCall = (payload) => {
  if (!isEnabled()) return;

  pushLimited(state.apiCalls, {
    id: `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...payload
  });

  notify();
};

export const recordDebugEvent = (label, details = {}) => {
  if (!isEnabled()) return;

  pushLimited(state.events, {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    label,
    details
  });

  notify();
};

export const getDebugSnapshot = () => ({
  startedAt: state.startedAt,
  frontendErrors: [...state.frontendErrors],
  apiCalls: [...state.apiCalls],
  events: [...state.events]
});

export const clearDebugSnapshot = () => {
  state.frontendErrors = [];
  state.apiCalls = [];
  state.events = [];
  notify();
};

export const subscribeToDebugStore = (listener) => {
  listeners.add(listener);
  listener(getDebugSnapshot());

  return () => {
    listeners.delete(listener);
  };
};

export const installDebugHooks = () => {
  if (!isEnabled() || typeof window === 'undefined' || window.__cyberDebugInstalled) {
    return;
  }

  window.__cyberDebugInstalled = true;

  window.addEventListener('error', (event) => {
    recordFrontendError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      column: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason =
      event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    recordFrontendError(reason, { type: 'unhandledrejection' });
  });

  window.logError = (error, context = {}) => {
    recordFrontendError(error, context);
  };

  window.__cyberDebug = {
    getSnapshot: getDebugSnapshot,
    recordEvent: recordDebugEvent,
    clear: clearDebugSnapshot
  };
};
