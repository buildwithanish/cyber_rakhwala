import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  ListChecks,
  RefreshCw,
  Server,
  Trash2,
  Wifi
} from 'lucide-react';
import { getDebugSnapshot, subscribeToDebugStore } from '../../utils/debugStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const DEBUG_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEBUG_PANEL === 'true';

const formatTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString('en-IN', { hour12: false });
};

const truncate = (value, max = 180) => {
  if (!value) return '';
  const text = String(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const safeJson = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '[unserializable]';
  }
};

const Section = ({ title, count, children }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/70">
    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
        {title}
      </h4>
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
        {count}
      </span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const TabButton = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-colors ${
      active
        ? 'bg-cyan-500/20 text-cyan-300'
        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
    }`}
  >
    {label}
  </button>
);

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [reportExpanded, setReportExpanded] = useState(false);
  const [snapshot, setSnapshot] = useState(getDebugSnapshot());
  const [backendState, setBackendState] = useState({ loading: false, error: null, data: null });
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    if (!DEBUG_ENABLED) return undefined;
    return subscribeToDebugStore(setSnapshot);
  }, []);

  const sessionStartedAt = useMemo(
    () => new Date(snapshot.startedAt || Date.now()).getTime(),
    [snapshot.startedAt]
  );

  const sessionBackendErrors = useMemo(
    () =>
      (backendState.data?.recentErrors || []).filter((entry) => {
        if (!entry?.timestamp) return true;
        return new Date(entry.timestamp).getTime() >= sessionStartedAt;
      }),
    [backendState.data?.recentErrors, sessionStartedAt]
  );

  const failedApiCalls = useMemo(
    () => snapshot.apiCalls.filter((entry) => !entry.ok),
    [snapshot.apiCalls]
  );

  const apiEntries = useMemo(
    () => (failedApiCalls.length > 0 ? failedApiCalls : snapshot.apiCalls).slice(0, 10),
    [failedApiCalls, snapshot.apiCalls]
  );

  const fetchBackendDebug = async () => {
    setBackendState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_URL}/debug/status`, {
        credentials: 'include'
      });
      const payload = await response.json();
      setBackendState({
        loading: false,
        error: null,
        data: payload?.data || payload
      });
    } catch (error) {
      setBackendState({
        loading: false,
        error: error.message || 'Failed to load backend debug status',
        data: null
      });
    }
  };

  useEffect(() => {
    if (!DEBUG_ENABLED) return undefined;
    fetchBackendDebug();
    const interval = window.setInterval(fetchBackendDebug, isOpen ? 5000 : 15000);
    return () => window.clearInterval(interval);
  }, [isOpen]);

  const counts = useMemo(
    () => ({
      frontendErrors: snapshot.frontendErrors.length,
      apiFailures: failedApiCalls.length,
      backendErrors: sessionBackendErrors.length,
      backendStatus: backendState.data?.app?.status || '...'
    }),
    [backendState.data?.app?.status, failedApiCalls.length, sessionBackendErrors.length, snapshot.frontendErrors.length]
  );

  useEffect(() => {
    if (!DEBUG_ENABLED) return;
    if (counts.frontendErrors > 0 || counts.apiFailures > 0 || counts.backendErrors > 0) {
      setIsOpen(true);
    }
  }, [counts.apiFailures, counts.backendErrors, counts.frontendErrors]);

  const reportText = useMemo(() => {
    const frontendErrors = snapshot.frontendErrors.slice(0, 8).map((entry) => ({
      time: formatTime(entry.timestamp),
      name: entry.name,
      message: entry.message,
      stack: entry.stack,
      context: entry.context
    }));

    const apiFailures = failedApiCalls.slice(0, 10).map((entry) => ({
      time: formatTime(entry.timestamp),
      method: entry.method,
      endpoint: entry.endpoint,
      status: entry.status,
      requestId: entry.requestId,
      error: entry.error,
      response: entry.response
    }));

    const backendErrors = sessionBackendErrors.slice(0, 10).map((entry) => ({
      time: formatTime(entry.timestamp),
      message: entry.message,
      method: entry.method,
      path: entry.path,
      requestId: entry.requestId,
      statusCode: entry.statusCode,
      code: entry.code
    }));

    return [
      'CYBER RAKHWALA DEBUG REPORT',
      `Generated: ${new Date().toISOString()}`,
      `Session started: ${snapshot.startedAt}`,
      `Frontend errors: ${snapshot.frontendErrors.length}`,
      `API failures: ${failedApiCalls.length}`,
      `Backend errors: ${sessionBackendErrors.length}`,
      '',
      'FRONTEND ERRORS',
      safeJson(frontendErrors),
      '',
      'API FAILURES',
      safeJson(apiFailures),
      '',
      'BACKEND STATUS',
      safeJson({
        app: backendState.data?.app || null,
        mongo: backendState.data?.mongo || null
      }),
      '',
      'SESSION BACKEND ERRORS',
      safeJson(backendErrors)
    ].join('\n');
  }, [
    backendState.data?.app,
    backendState.data?.mongo,
    failedApiCalls,
    sessionBackendErrors,
    snapshot.frontendErrors,
    snapshot.startedAt
  ]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyState('Report copied');
      window.setTimeout(() => setCopyState(''), 2000);
    } catch (error) {
      console.error('[DebugPanel] Failed to copy report', error);
      setCopyState('Copy failed');
      window.setTimeout(() => setCopyState(''), 2000);
    }
  };

  const clearLocalDebug = () => {
    if (typeof window !== 'undefined' && window.__cyberDebug?.clear) {
      window.__cyberDebug.clear();
    }
    setSnapshot(getDebugSnapshot());
  };

  const clearBackendDebug = async () => {
    try {
      setBackendState((prev) => ({ ...prev, loading: true }));
      const response = await fetch(`${API_URL}/debug/clear`, {
        method: 'POST',
        credentials: 'include'
      });
      const payload = await response.json();
      setBackendState({
        loading: false,
        error: null,
        data: payload?.data || payload
      });
    } catch (error) {
      setBackendState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to clear backend debug status'
      }));
    }
  };

  if (!DEBUG_ENABLED) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[10000]">
      <div className="flex flex-col items-start gap-2">
        {isOpen ? (
          <div className="w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/95 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
            <div className="border-b border-white/10 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                    <Bug className="h-4 w-4" />
                    Debug Center
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Compact runtime inspector for this page session
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-slate-300 hover:bg-slate-700"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-slate-500">Frontend</div>
                  <div className="mt-1 text-lg font-semibold text-red-400">{counts.frontendErrors}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-slate-500">API</div>
                  <div className="mt-1 text-lg font-semibold text-amber-400">{counts.apiFailures}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-slate-500">Backend</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-400">{counts.backendStatus}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-slate-500">Server Errors</div>
                  <div className="mt-1 text-lg font-semibold text-rose-400">{counts.backendErrors}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchBackendDebug}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-[11px] text-cyan-300 hover:bg-cyan-500/30"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${backendState.loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={copyReport}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-[11px] text-emerald-300 hover:bg-emerald-500/30"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copy Report
                </button>
                <button
                  onClick={clearLocalDebug}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Local
                </button>
                <button
                  onClick={clearBackendDebug}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Backend
                </button>
              </div>

              {copyState ? <p className="text-[11px] text-emerald-300">{copyState}</p> : null}

              <div className="flex flex-wrap gap-2">
                <TabButton
                  active={activeTab === 'summary'}
                  label="Summary"
                  onClick={() => setActiveTab('summary')}
                />
                <TabButton
                  active={activeTab === 'frontend'}
                  label="Frontend"
                  onClick={() => setActiveTab('frontend')}
                />
                <TabButton
                  active={activeTab === 'api'}
                  label="API"
                  onClick={() => setActiveTab('api')}
                />
                <TabButton
                  active={activeTab === 'backend'}
                  label="Backend"
                  onClick={() => setActiveTab('backend')}
                />
              </div>

              <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {activeTab === 'summary' ? (
                  <>
                    <Section title="Session Report" count={1}>
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-400">
                          Only errors captured after this page load are shown here.
                        </p>
                        <pre
                          className={`overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/80 p-3 text-[10px] text-slate-300 ${
                            reportExpanded ? 'max-h-64' : 'max-h-24'
                          }`}
                        >
                          {reportText}
                        </pre>
                        <button
                          onClick={() => setReportExpanded((prev) => !prev)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-700"
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          {reportExpanded ? 'Collapse Report' : 'Expand Report'}
                        </button>
                      </div>
                    </Section>

                    <Section title="Quick Health" count={3}>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-900/80 p-2 text-slate-300">
                          Frontend errors: <span className="text-red-300">{counts.frontendErrors}</span>
                        </div>
                        <div className="rounded-lg bg-slate-900/80 p-2 text-slate-300">
                          Failed API calls: <span className="text-amber-300">{counts.apiFailures}</span>
                        </div>
                        <div className="rounded-lg bg-slate-900/80 p-2 text-slate-300">
                          Backend session errors: <span className="text-rose-300">{counts.backendErrors}</span>
                        </div>
                      </div>
                    </Section>
                  </>
                ) : null}

                {activeTab === 'frontend' ? (
                  <Section title="Frontend Errors" count={snapshot.frontendErrors.length}>
                    {snapshot.frontendErrors.length === 0 ? (
                      <p className="text-xs text-slate-500">No frontend runtime errors captured.</p>
                    ) : (
                      <div className="space-y-3">
                        {snapshot.frontendErrors.slice(0, 8).map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-red-500/5 p-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-red-300">{entry.name}</span>
                              <span className="text-slate-500">{formatTime(entry.timestamp)}</span>
                            </div>
                            <p className="mt-1 text-slate-200">{truncate(entry.message, 220)}</p>
                            {entry.context?.componentStack ? (
                              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[10px] text-slate-500">
                                {truncate(entry.context.componentStack, 500)}
                              </pre>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                ) : null}

                {activeTab === 'api' ? (
                  <Section title="Recent API Calls" count={apiEntries.length}>
                    {apiEntries.length === 0 ? (
                      <p className="text-xs text-slate-500">No API calls recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {apiEntries.map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-slate-900/80 p-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className={entry.ok ? 'text-emerald-300' : 'text-amber-300'}>
                                {entry.method} {entry.endpoint}
                              </span>
                              <span className="text-slate-500">
                                {entry.status} • {entry.duration}ms
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              requestId: {entry.requestId || 'n/a'}
                            </div>
                            {entry.response ? (
                              <pre className="mt-1 overflow-auto whitespace-pre-wrap text-[10px] text-slate-500">
                                {truncate(safeJson(entry.response), 320)}
                              </pre>
                            ) : null}
                            {!entry.ok && entry.error ? (
                              <div className="mt-1 text-[11px] text-red-300">
                                {truncate(entry.error, 180)}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                ) : null}

                {activeTab === 'backend' ? (
                  <Section title="Backend Status" count={sessionBackendErrors.length}>
                    {backendState.error ? (
                      <p className="text-xs text-red-300">{backendState.error}</p>
                    ) : backendState.data ? (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-slate-900/80 p-2">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Server className="h-3 w-3" />
                              Mongo
                            </div>
                            <div className="mt-1 text-slate-200">
                              {backendState.data.mongo?.stateLabel || 'unknown'}
                            </div>
                          </div>
                          <div className="rounded-lg bg-slate-900/80 p-2">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Wifi className="h-3 w-3" />
                              Uptime
                            </div>
                            <div className="mt-1 text-slate-200">
                              {backendState.data.app?.uptimeSeconds ?? 0}s
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-[11px] uppercase tracking-[0.15em] text-slate-500">
                            Session Backend Errors
                          </div>
                          <div className="space-y-2">
                            {sessionBackendErrors.slice(0, 5).map((entry) => (
                              <div key={entry.id} className="rounded-lg bg-red-500/5 p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-red-300">{entry.message}</span>
                                  <span className="text-slate-500">{formatTime(entry.timestamp)}</span>
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">
                                  {entry.method} {entry.path} • requestId: {entry.requestId || 'n/a'}
                                </div>
                              </div>
                            ))}
                            {sessionBackendErrors.length === 0 ? (
                              <p className="text-slate-500">No backend errors captured in this session.</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Waiting for backend debug data.</p>
                    )}
                  </Section>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-cyan-300 shadow-lg shadow-cyan-950/40 backdrop-blur-xl"
        >
          {counts.frontendErrors > 0 || counts.apiFailures > 0 || counts.backendErrors > 0 ? (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          ) : (
            <Bug className="h-4 w-4" />
          )}
          Debug
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;
