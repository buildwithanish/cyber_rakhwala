import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Database,
  FileKey2,
  FileSearch,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Network,
  Radar,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Ticket,
  User,
  Users,
  Wrench
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import adminService from '../../../services/adminService';
import AdminProfilePanel from '../../../components/admin/AdminProfilePanel';

const MODULES = [
  { id: 'profile', label: 'Profile', icon: User, helper: 'Identity, password, sessions' },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, helper: 'KPIs + operational health' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, helper: 'Deep drilldown and events' },
  { id: 'threatMap', label: 'Threat Map', icon: Radar, helper: 'Alerts and live threat feed' },
  { id: 'teams', label: 'Departments', icon: Building2, helper: 'Staff by department and role' },
  { id: 'users', label: 'Users', icon: Users, helper: 'Create, ban, role assign' },
  { id: 'roles', label: 'Roles', icon: ShieldCheck, helper: 'Permission profiles' },
  { id: 'plans', label: 'Plans', icon: CreditCard, helper: 'Credits + subscriptions' },
  { id: 'coupons', label: 'Coupons', icon: FileKey2, helper: 'Redeem codes and offers' },
  { id: 'payments', label: 'Payments', icon: CreditCard, helper: 'Orders and gateway state' },
  { id: 'subscriptions', label: 'Subscriptions', icon: Activity, helper: 'Manual grants and status' },
  { id: 'providers', label: 'Providers', icon: Network, helper: 'External API connectors' },
  { id: 'tools', label: 'Tools', icon: Wrench, helper: 'Tool visibility and costs' },
  { id: 'apiKeys', label: 'API Keys', icon: KeyRound, helper: 'Operator-issued keys' },
  { id: 'datasets', label: 'Datasets', icon: Database, helper: 'Leak/data source registry' },
  { id: 'content', label: 'Content', icon: FileText, helper: 'Homepage and site blocks' },
  { id: 'settings', label: 'Settings', icon: Settings, helper: 'Runtime config + toggles' },
  { id: 'tickets', label: 'Tickets', icon: Ticket, helper: 'Contact and feedback queue' },
  { id: 'logs', label: 'Search Logs', icon: FileSearch, helper: 'Investigations and search audit' }
];

const createBucket = () => ({
  loading: false,
  loaded: false,
  error: '',
  items: [],
  data: null
});

const initialForms = {
  user: {
    name: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    credits: 100
  },
  role: {
    name: '',
    slug: '',
    baseRole: 'admin',
    department: '',
    description: '',
    permissions: '',
    accessibleModules: ''
  },
  plan: {
    name: '',
    slug: '',
    category: 'credits',
    billingInterval: 'one_time',
    price: 199,
    credits: 250,
    trialDays: 0,
    features: '',
    isActive: true
  },
  coupon: {
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    applicablePlanSlugs: '',
    isActive: true
  },
  subscription: {
    userId: '',
    planId: '',
    provider: 'internal',
    status: 'active',
    autoRenew: true
  },
  provider: {
    name: '',
    slug: '',
    type: 'http',
    baseUrl: '',
    method: 'POST',
    authType: 'none',
    secretRef: '',
    toolIds: '',
    enabled: false,
    headers: '{}',
    queryTemplate: '{}',
    bodyTemplate: '{}'
  },
  tool: {
    name: '',
    toolId: '',
    category: 'osint',
    description: '',
    studentCost: 0,
    userCost: 0,
    tags: '',
    isEnabled: true
  },
  apiKey: {
    owner: '',
    name: '',
    scopes: '',
    expiresAt: ''
  },
  dataset: {
    name: '',
    slug: '',
    description: '',
    toolIds: '',
    sourceType: 'manual',
    format: 'json',
    fileUrl: '',
    enabled: false,
    restricted: false,
    mapping: '{}'
  },
  content: {
    key: '',
    section: 'homepage',
    title: '',
    isPublished: true,
    body: '{}'
  },
  setting: {
    group: 'public',
    key: '',
    isPublic: false,
    description: '',
    value: '""'
  },
  toggle: {
    key: '',
    description: '',
    enabled: true,
    roles: ''
  },
  threatAlert: {
    title: '',
    message: '',
    severity: 'HIGH',
    regions: '',
    attackTypes: ''
  }
};

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseJsonText = (value, fallback = {}) => {
  if (!String(value || '').trim()) {
    return fallback;
  }

  return JSON.parse(value);
};

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_12px_40px_rgba(2,6,23,0.35)]">
    <div className="mb-4 flex items-center justify-between">
      <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{hint}</span>
    </div>
    <div className="text-3xl font-semibold text-white">{value}</div>
    <div className="mt-1 text-sm text-slate-400">{label}</div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
    {children}
  </label>
);

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500/50';

const textareaClassName = `${inputClassName} min-h-[110px] resize-y`;

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition ${
      checked
        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
        : 'border-white/10 bg-white/5 text-slate-300'
    }`}
  >
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        checked ? 'bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]' : 'bg-slate-500'
      }`}
    />
    {label}
  </button>
);

const Card = ({ title, description, actions, children }) => (
  <section className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions}
    </div>
    {children}
  </section>
);

const EmptyState = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-500">
    {text}
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('overview');
  const [flash, setFlash] = useState({ type: '', message: '' });
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  const [modules, setModules] = useState({
    profile: createBucket(),
    overview: createBucket(),
    analytics: createBucket(),
    threatMap: createBucket(),
    teams: createBucket(),
    users: createBucket(),
    pendingUsers: createBucket(),
    roles: createBucket(),
    plans: createBucket(),
    coupons: createBucket(),
    payments: createBucket(),
    subscriptions: createBucket(),
    providers: createBucket(),
    tools: createBucket(),
    apiKeys: createBucket(),
    datasets: createBucket(),
    content: createBucket(),
    settings: createBucket(),
    tickets: createBucket(),
    logs: createBucket()
  });
  const [forms, setForms] = useState(initialForms);

  const setModuleState = (moduleId, updater) => {
    setModules((current) => ({
      ...current,
      [moduleId]:
        typeof updater === 'function' ? updater(current[moduleId]) : { ...current[moduleId], ...updater }
    }));
  };

  const showFlash = (message, type = 'success') => {
    setFlash({ message, type });
  };

  const updateForm = (formKey, field, value) => {
    setForms((current) => ({
      ...current,
      [formKey]: {
        ...current[formKey],
        [field]: value
      }
    }));
  };

  const resetForm = (formKey) => {
    setForms((current) => ({
      ...current,
      [formKey]: initialForms[formKey]
    }));
  };

  const loadModule = async (moduleId, force = false) => {
    if (moduleId === 'profile') {
      setModuleState(moduleId, {
        loading: false,
        loaded: true,
        error: '',
        data: null
      });
      return;
    }

    if (!force && modules[moduleId]?.loaded && moduleId !== 'overview') {
      return;
    }

    setModuleState(moduleId, {
      loading: true,
      error: ''
    });

    try {
      if (moduleId === 'overview') {
        const [dashboard, analytics] = await Promise.all([
          adminService.getDashboard(),
          adminService.getAnalytics()
        ]);

        setModuleState(moduleId, {
          loading: false,
          loaded: true,
          data: {
            dashboard,
            analytics
          }
        });
        return;
      }

      if (moduleId === 'analytics') {
        const analytics = await adminService.getAnalytics();
        setModuleState(moduleId, {
          loading: false,
          loaded: true,
          data: analytics
        });
        return;
      }

      if (moduleId === 'threatMap') {
        const [events, alerts] = await Promise.all([
          adminService.getThreatEvents('limit=100'),
          adminService.getThreatAlerts('limit=100')
        ]);

        setModuleState(moduleId, {
          loading: false,
          loaded: true,
          data: {
            events: Array.isArray(events) ? events : [],
            alerts: Array.isArray(alerts) ? alerts : []
          }
        });
        return;
      }

      if (moduleId === 'teams') {
        const [users, roles] = await Promise.all([
          adminService.getUsers('limit=200'),
          adminService.getRoles('limit=100')
        ]);

        setModuleState(moduleId, {
          loading: false,
          loaded: true,
          data: {
            users: Array.isArray(users) ? users : [],
            roles: Array.isArray(roles) ? roles : []
          }
        });
        return;
      }

      if (moduleId === 'settings') {
        const [settings, featureToggles] = await Promise.all([
          adminService.getSettings('limit=100'),
          adminService.getFeatureToggles('limit=100')
        ]);

        setModuleState(moduleId, {
          loading: false,
          loaded: true,
          data: {
            settings: Array.isArray(settings) ? settings : [],
            featureToggles: Array.isArray(featureToggles) ? featureToggles : []
          }
        });
        return;
      }

      const actionMap = {
        users: () => adminService.getUsers('limit=100'),
        pendingUsers: () => adminService.getPendingUsers('limit=100'),
        roles: () => adminService.getRoles('limit=100'),
        plans: () => adminService.getPlans('limit=100'),
        coupons: () => adminService.getCoupons('limit=100'),
        payments: () => adminService.getPayments('limit=100'),
        subscriptions: () => adminService.getSubscriptions('limit=100'),
        providers: () => adminService.getProviders('limit=100'),
        tools: () => adminService.getTools('limit=100'),
        apiKeys: () => adminService.getApiKeys('limit=100'),
        datasets: () => adminService.getDatasets('limit=100'),
        content: () => adminService.getContent('limit=100'),
        tickets: () => adminService.getTickets('limit=100'),
        logs: () => adminService.getSearchLogs('limit=100')
      };

      const result = await actionMap[moduleId]();
      setModuleState(moduleId, {
        loading: false,
        loaded: true,
        items: Array.isArray(result) ? result : [],
        data: Array.isArray(result) ? null : result
      });
    } catch (error) {
      setModuleState(moduleId, {
        loading: false,
        loaded: false,
        error: error.message || `Failed to load ${moduleId}`
      });
    }
  };

  useEffect(() => {
    loadModule('overview', true);
    loadModule('settings');
    loadModule('providers');
    loadModule('profile');
  }, []);

  useEffect(() => {
    loadModule(activeModule, true);

    if (activeModule === 'subscriptions') {
      loadModule('users');
      loadModule('plans');
    }

    if (activeModule === 'teams') {
      loadModule('users');
      loadModule('roles');
    }

    if (activeModule === 'users') {
      loadModule('pendingUsers');
    }

    if (activeModule === 'providers' || activeModule === 'tools' || activeModule === 'datasets') {
      loadModule('tools');
    }

    if (activeModule === 'apiKeys') {
      loadModule('users');
    }
  }, [activeModule]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    try {
      await adminService.createUser({
        ...forms.user,
        credits: Number(forms.user.credits || 0)
      });
      showFlash('User created successfully');
      resetForm('user');
      await Promise.all([loadModule('users', true), loadModule('overview', true)]);
    } catch (error) {
      showFlash(error.message || 'Failed to create user', 'error');
    }
  };

  const handleSaveRole = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveRole({
        ...forms.role,
        permissions: parseCsv(forms.role.permissions),
        accessibleModules: parseCsv(forms.role.accessibleModules)
      });
      showFlash('Role profile saved');
      resetForm('role');
      await loadModule('roles', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save role', 'error');
    }
  };

  const handleSavePlan = async (event) => {
    event.preventDefault();
    try {
      await adminService.savePlan({
        ...forms.plan,
        price: Number(forms.plan.price || 0),
        credits: Number(forms.plan.credits || 0),
        trialDays: Number(forms.plan.trialDays || 0),
        features: parseCsv(forms.plan.features)
      });
      showFlash('Plan saved');
      resetForm('plan');
      await Promise.all([loadModule('plans', true), loadModule('overview', true)]);
    } catch (error) {
      showFlash(error.message || 'Failed to save plan', 'error');
    }
  };

  const handleSaveCoupon = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveCoupon({
        ...forms.coupon,
        discountValue: Number(forms.coupon.discountValue || 0),
        applicablePlanSlugs: parseCsv(forms.coupon.applicablePlanSlugs)
      });
      showFlash('Coupon saved');
      resetForm('coupon');
      await loadModule('coupons', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save coupon', 'error');
    }
  };

  const handleSaveSubscription = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveSubscription({
        userId: forms.subscription.userId,
        planId: forms.subscription.planId,
        provider: forms.subscription.provider,
        status: forms.subscription.status,
        autoRenew: forms.subscription.autoRenew
      });
      showFlash('Subscription saved');
      resetForm('subscription');
      await loadModule('subscriptions', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save subscription', 'error');
    }
  };

  const handleSaveProvider = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveProvider({
        ...forms.provider,
        toolIds: parseCsv(forms.provider.toolIds),
        headers: parseJsonText(forms.provider.headers),
        queryTemplate: parseJsonText(forms.provider.queryTemplate),
        bodyTemplate: parseJsonText(forms.provider.bodyTemplate)
      });
      showFlash('Provider saved');
      resetForm('provider');
      await Promise.all([loadModule('providers', true), loadModule('overview', true)]);
    } catch (error) {
      showFlash(error.message || 'Failed to save provider', 'error');
    }
  };

  const handleSaveTool = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveTool({
        toolId: forms.tool.toolId,
        name: forms.tool.name,
        category: forms.tool.category,
        description: forms.tool.description,
        tags: parseCsv(forms.tool.tags),
        isEnabled: forms.tool.isEnabled,
        creditCost: {
          student: Number(forms.tool.studentCost || 0),
          user: Number(forms.tool.userCost || 0)
        }
      });
      showFlash('Tool configuration saved');
      resetForm('tool');
      await loadModule('tools', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save tool', 'error');
    }
  };

  const handleSaveApiKey = async (event) => {
    event.preventDefault();
    try {
      const response = await adminService.saveApiKey({
        owner: forms.apiKey.owner || undefined,
        name: forms.apiKey.name,
        scopes: parseCsv(forms.apiKey.scopes),
        expiresAt: forms.apiKey.expiresAt || undefined
      });
      setGeneratedApiKey(response?.rawKey || '');
      showFlash('API key created');
      resetForm('apiKey');
      await loadModule('apiKeys', true);
    } catch (error) {
      showFlash(error.message || 'Failed to create API key', 'error');
    }
  };

  const handleSaveDataset = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveDataset({
        ...forms.dataset,
        toolIds: parseCsv(forms.dataset.toolIds),
        mapping: parseJsonText(forms.dataset.mapping)
      });
      showFlash('Dataset registry saved');
      resetForm('dataset');
      await loadModule('datasets', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save dataset', 'error');
    }
  };

  const handleSaveContent = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveContent({
        ...forms.content,
        body: parseJsonText(forms.content.body)
      });
      showFlash('Content block saved');
      resetForm('content');
      await loadModule('content', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save content', 'error');
    }
  };

  const handleSaveSetting = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveSetting({
        ...forms.setting,
        value: parseJsonText(forms.setting.value, '')
      });
      showFlash('Setting saved');
      resetForm('setting');
      await loadModule('settings', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save setting', 'error');
    }
  };

  const handleSaveToggle = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveFeatureToggle({
        ...forms.toggle,
        roles: parseCsv(forms.toggle.roles)
      });
      showFlash('Feature toggle saved');
      resetForm('toggle');
      await loadModule('settings', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save feature toggle', 'error');
    }
  };

  const handleSaveThreatAlert = async (event) => {
    event.preventDefault();
    try {
      await adminService.saveThreatAlert({
        ...forms.threatAlert,
        regions: parseCsv(forms.threatAlert.regions),
        attackTypes: parseCsv(forms.threatAlert.attackTypes)
      });
      showFlash('Threat alert saved');
      resetForm('threatAlert');
      await loadModule('threatMap', true);
    } catch (error) {
      showFlash(error.message || 'Failed to save threat alert', 'error');
    }
  };

  const handleTicketUpdate = async (ticketId, status) => {
    try {
      await adminService.updateTicket(ticketId, { status });
      showFlash('Ticket updated');
      await loadModule('tickets', true);
    } catch (error) {
      showFlash(error.message || 'Failed to update ticket', 'error');
    }
  };

  const handleUserBanToggle = async (entry) => {
    try {
      if (entry.isBanned) {
        await adminService.unbanUser(entry._id || entry.id);
        showFlash('User unbanned');
      } else {
        await adminService.banUser(entry._id || entry.id, 'Administrative restriction');
        showFlash('User banned');
      }
      await loadModule('users', true);
    } catch (error) {
      showFlash(error.message || 'Failed to update user status', 'error');
    }
  };

  const handleUserApproval = async (entry, approvalStatus) => {
    try {
      await adminService.reviewUserApproval(entry._id || entry.id, {
        approvalStatus,
        approvalNotes:
          approvalStatus === 'approved'
            ? 'Approved from admin console'
            : 'Rejected from admin console'
      });
      showFlash(`User ${approvalStatus === 'approved' ? 'approved' : 'rejected'}`);
      await Promise.all([loadModule('users', true), loadModule('pendingUsers', true), loadModule('overview', true)]);
    } catch (error) {
      showFlash(error.message || 'Failed to review approval', 'error');
    }
  };

  const moduleState = modules[activeModule] || createBucket();
  const overviewState = modules.overview;
  const overview = overviewState.data?.dashboard?.analytics || overviewState.data?.analytics?.overview || {};
  const recentUsers = overviewState.data?.dashboard?.recentUsers || [];
  const recentPayments = overviewState.data?.dashboard?.recentPayments || [];
  const recentTickets = overviewState.data?.dashboard?.recentTickets || [];
  const settingsData = modules.settings.data || { settings: [], featureToggles: [] };
  const analyticsData = modules.analytics.data || {};
  const threatData = modules.threatMap.data || { events: [], alerts: [] };
  const teamData = modules.teams.data || { users: [], roles: [] };
  const availableUsers = modules.users.items || [];
  const pendingUsers = modules.pendingUsers.items || [];
  const availablePlans = modules.plans.items || [];
  const departments = Object.entries(
    (teamData.users || []).reduce((accumulator, entry) => {
      const key = entry.department || 'unassigned';
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(entry);
      return accumulator;
    }, {})
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#071224_100%)] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px]">
        <div className="mb-6 rounded-[32px] border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_30px_100px_rgba(2,6,23,0.55)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Hidden Admin Console</p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Cyber Rakhwala Operations Center
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                Users, subscriptions, API providers, tool readiness, content blocks, support tickets,
                and search operations are all managed here through the protected admin API surface.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  'Protected route access',
                  'RBAC staff controls',
                  'Provider orchestration',
                  'Audit-ready operations'
                ].map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Signed in as <span className="font-semibold text-white">{user?.email}</span>
                <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-cyan-200">
                  {user?.role || 'staff'}
                </span>
              </div>
              <button
                onClick={() => loadModule(activeModule, true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${moduleState.loading ? 'animate-spin' : ''}`} />
                Refresh Module
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>

          {flash.message ? (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                flash.type === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {flash.message}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Active Module</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {MODULES.find((entry) => entry.id === activeModule)?.label || 'Overview'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Role Scope</div>
              <div className="mt-2 text-sm font-semibold text-white">{user?.role || 'staff'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Data Plane</div>
              <div className="mt-2 text-sm font-semibold text-emerald-300">Mongo + Protected API</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Control Surface</div>
              <div className="mt-2 text-sm font-semibold text-cyan-200">Users, Billing, Providers, Tools</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[290px,minmax(0,1fr)]">
          <aside className="rounded-[32px] border border-white/10 bg-slate-950/75 p-4 shadow-[0_18px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl xl:sticky xl:top-6 xl:self-start">
            <div className="mb-4 px-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Modules</p>
              <p className="mt-2 text-sm text-slate-400">
                Enterprise control rail for identity, billing, providers, content, investigations, and support workflows.
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 xl:block xl:space-y-2 xl:overflow-visible xl:pb-0">
              {MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`min-w-[220px] rounded-2xl border px-4 py-3 text-left transition xl:w-full ${
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-500/10 text-white shadow-[0_10px_30px_rgba(6,182,212,0.18)]'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${isActive ? 'bg-cyan-500/15 text-cyan-200' : 'bg-white/5'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{module.label}</div>
                          <div className="text-xs text-slate-400">{module.helper}</div>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
                          isActive ? 'bg-cyan-500/15 text-cyan-100' : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {isActive ? 'Open' : 'View'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="space-y-6">
            {moduleState.error ? (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {moduleState.error}
              </div>
            ) : null}

            {activeModule === 'profile' ? <AdminProfilePanel /> : null}

            {activeModule === 'overview' ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  <StatCard
                    icon={Users}
                    label="Registered users"
                    value={overview.totalUsers ?? recentUsers.length}
                    hint="Identity"
                  />
                  <StatCard
                    icon={Search}
                    label="Tracked searches"
                    value={overview.totalSearches ?? 0}
                    hint="Investigations"
                  />
                  <StatCard
                    icon={Network}
                    label="Provider readiness"
                    value={overview.activeProviders ?? modules.providers.items.length}
                    hint="External APIs"
                  />
                  <StatCard
                    icon={Ticket}
                    label="Open tickets"
                    value={overview.openTickets ?? recentTickets.length}
                    hint="Support"
                  />
                </div>

                <div className="grid gap-6 2xl:grid-cols-[1.2fr,0.8fr]">
                  <Card title="Recent commercial activity" description="Latest user registrations, payments, and queue movement.">
                    <div className="space-y-3">
                      {(recentPayments.length ? recentPayments : recentUsers).slice(0, 8).map((item, index) => (
                        <div
                          key={item._id || item.id || index}
                          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-medium text-white">
                                {item.user?.name || item.name || item.email || item.orderId || 'Recent record'}
                              </div>
                              <div className="text-xs text-slate-400">
                                {item.user?.email || item.email || item.status || item.role || 'Operational event'}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Support + runtime health" description="Ticket queue and current configuration counts.">
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-300">
                          Settings records
                          <div className="mt-2 text-2xl font-semibold text-white">{settingsData.settings.length}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-300">
                          Feature toggles
                          <div className="mt-2 text-2xl font-semibold text-white">{settingsData.featureToggles.length}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {recentTickets.slice(0, 5).map((ticket) => (
                          <div
                            key={ticket._id || ticket.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-medium text-white">{ticket.ticketNumber || ticket.subject}</div>
                              <div className="text-xs uppercase tracking-wide text-slate-400">{ticket.status}</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-400">{ticket.email || ticket.subject}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            ) : null}

            {activeModule === 'analytics' ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  <StatCard icon={Users} label="Total users" value={analyticsData.overview?.totalUsers ?? 0} hint="Audience" />
                  <StatCard icon={Search} label="Total searches" value={analyticsData.overview?.totalSearches ?? 0} hint="Usage" />
                  <StatCard icon={CreditCard} label="Payments" value={analyticsData.overview?.totalPayments ?? 0} hint="Revenue" />
                  <StatCard icon={Ticket} label="Tickets" value={analyticsData.overview?.openTickets ?? 0} hint="Support" />
                </div>

                <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                  <Card title="Usage pulse" description="High-level operational metrics pulled from analytics service.">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-slate-300">
                        Avg searches / user
                        <div className="mt-2 text-2xl font-semibold text-white">
                          {analyticsData.overview?.averageSearchesPerUser ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-slate-300">
                        Revenue (gross)
                        <div className="mt-2 text-2xl font-semibold text-white">
                          ₹{analyticsData.overview?.grossRevenue ?? 0}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-slate-300">
                        Active providers
                        <div className="mt-2 text-2xl font-semibold text-white">
                          {analyticsData.overview?.activeProviders ?? modules.providers.items.length}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-slate-300">
                        Feature toggles
                        <div className="mt-2 text-2xl font-semibold text-white">
                          {analyticsData.overview?.featureToggles ?? settingsData.featureToggles.length}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Recent analytics events" description="Newest telemetry and runtime events stored by backend analytics.">
                    <div className="space-y-3">
                      {(analyticsData.events || []).slice(0, 12).map((entry) => (
                        <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold text-white">{entry.eventName || entry.type || 'Analytics event'}</div>
                              <div className="mt-1 text-sm text-slate-400">{entry.path || entry.category || 'system'}</div>
                            </div>
                            <div className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                      {!(analyticsData.events || []).length ? <EmptyState text="No analytics events captured yet." /> : null}
                    </div>
                  </Card>
                </div>
              </>
            ) : null}

            {activeModule === 'threatMap' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Publish threat alert" description="Create operator alerts that surface current attack campaigns and severity.">
                  <form className="grid gap-4" onSubmit={handleSaveThreatAlert}>
                    <Field label="Title">
                      <input className={inputClassName} value={forms.threatAlert.title} onChange={(event) => updateForm('threatAlert', 'title', event.target.value)} required />
                    </Field>
                    <Field label="Message">
                      <textarea className={textareaClassName} value={forms.threatAlert.message} onChange={(event) => updateForm('threatAlert', 'message', event.target.value)} required />
                    </Field>
                    <Field label="Severity">
                      <select className={inputClassName} value={forms.threatAlert.severity} onChange={(event) => updateForm('threatAlert', 'severity', event.target.value)}>
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </Field>
                    <Field label="Regions">
                      <input className={inputClassName} value={forms.threatAlert.regions} onChange={(event) => updateForm('threatAlert', 'regions', event.target.value)} placeholder="APAC, EMEA" />
                    </Field>
                    <Field label="Attack types">
                      <input className={inputClassName} value={forms.threatAlert.attackTypes} onChange={(event) => updateForm('threatAlert', 'attackTypes', event.target.value)} placeholder="Phishing, DDoS" />
                    </Field>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <AlertTriangle className="h-4 w-4" />
                      Save threat alert
                    </button>
                  </form>
                </Card>

                <div className="space-y-6">
                  <Card title="Threat alerts" description="Backend-managed alert inventory for operators.">
                    <div className="space-y-3">
                      {(threatData.alerts || []).slice(0, 10).map((entry) => (
                        <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold text-white">{entry.title}</div>
                              <div className="mt-1 text-sm text-slate-400">{entry.message}</div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="font-semibold text-white">{entry.severity}</div>
                              <div className="text-slate-500">{formatDateTime(entry.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!(threatData.alerts || []).length ? <EmptyState text="No threat alerts configured." /> : null}
                    </div>
                  </Card>

                  <Card title="Threat events feed" description="Recent backend threat events for map/drilldown pages.">
                    <div className="space-y-3">
                      {(threatData.events || []).slice(0, 12).map((entry) => (
                        <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="font-semibold text-white">{entry.attackType}</div>
                              <div className="mt-1 text-sm text-slate-400">
                                {(entry.sourceCity?.name || 'Unknown')} → {(entry.targetCity?.name || 'Unknown')} • {entry.region || 'Unknown region'}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="font-semibold text-white">Severity {entry.severity}</div>
                              <div className="text-slate-500">{formatDateTime(entry.detectedAt || entry.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!(threatData.events || []).length ? <EmptyState text="No threat events available." /> : null}
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {activeModule === 'teams' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Departments and staff coverage" description="Department-wise distribution of admins, support teams, analysts, and operators.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {departments.length ? departments.map(([department, members]) => (
                      <div key={department} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="font-semibold text-white">{department}</div>
                        <div className="mt-2 text-2xl font-semibold text-cyan-200">{members.length}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                          {[...new Set(members.map((item) => item.role))].map((role) => (
                            <span key={role} className="rounded-full bg-white/5 px-3 py-1">{role}</span>
                          ))}
                        </div>
                      </div>
                    )) : <EmptyState text="No department assignments found." />}
                  </div>
                </Card>

                <div className="space-y-6">
                  <Card title="Role profiles by team" description="Department-facing permission bundles currently available.">
                    <div className="space-y-3">
                      {(teamData.roles || []).map((entry) => (
                        <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold text-white">{entry.name}</div>
                              <div className="mt-1 text-sm text-slate-400">{entry.department || 'No department'} • {entry.baseRole}</div>
                            </div>
                            <div className="text-xs text-slate-500">{entry.permissions?.length || 0} permissions</div>
                          </div>
                        </div>
                      ))}
                      {!(teamData.roles || []).length ? <EmptyState text="No role profiles found." /> : null}
                    </div>
                  </Card>

                  <Card title="Team roster snapshot" description="Quick roster of current internal staff accounts.">
                    <div className="space-y-3">
                      {(teamData.users || [])
                        .filter((entry) => !['user', 'student'].includes(entry.role))
                        .slice(0, 20)
                        .map((entry) => (
                          <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="font-semibold text-white">{entry.name}</div>
                                <div className="mt-1 text-sm text-slate-400">{entry.email}</div>
                              </div>
                              <div className="text-right text-xs text-slate-300">
                                <div>{entry.role}</div>
                                <div className="text-slate-500">{entry.department || 'unassigned'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      {!((teamData.users || []).filter((entry) => !['user', 'student'].includes(entry.role)).length) ? (
                        <EmptyState text="No internal team accounts found." />
                      ) : null}
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {activeModule === 'users' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Create user or staff account" description="Create standard users, students, or internal department staff.">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
                    <Field label="Full name">
                      <input className={inputClassName} value={forms.user.name} onChange={(event) => updateForm('user', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Email">
                      <input className={inputClassName} type="email" value={forms.user.email} onChange={(event) => updateForm('user', 'email', event.target.value)} required />
                    </Field>
                    <Field label="Password">
                      <input className={inputClassName} type="password" value={forms.user.password} onChange={(event) => updateForm('user', 'password', event.target.value)} required />
                    </Field>
                    <Field label="Role">
                      <select className={inputClassName} value={forms.user.role} onChange={(event) => updateForm('user', 'role', event.target.value)}>
                        <option value="student">student</option>
                        <option value="user">user</option>
                        <option value="support_agent">support_agent</option>
                        <option value="support_admin">support_admin</option>
                        <option value="provider_manager">provider_manager</option>
                        <option value="content_manager">content_manager</option>
                        <option value="analyst">analyst</option>
                        <option value="operations_manager">operations_manager</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </Field>
                    <Field label="Department">
                      <input className={inputClassName} value={forms.user.department} onChange={(event) => updateForm('user', 'department', event.target.value)} placeholder="support / providers / content" />
                    </Field>
                    <Field label="Credits">
                      <input className={inputClassName} type="number" min="0" value={forms.user.credits} onChange={(event) => updateForm('user', 'credits', event.target.value)} />
                    </Field>
                    <div className="md:col-span-2">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                        <Save className="h-4 w-4" />
                        Create account
                      </button>
                    </div>
                  </form>
                </Card>

                <div className="space-y-6">
                  <Card
                    title="Pending approval queue"
                    description="New law enforcement and student signups that need manual admin review before login is enabled."
                  >
                    <div className="space-y-3">
                      {pendingUsers.length ? pendingUsers.map((entry) => (
                        <div key={entry._id || entry.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="font-semibold text-white">{entry.name}</div>
                              <div className="mt-1 text-sm text-slate-400">{entry.email}</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200">
                                  {entry.role}
                                </span>
                                {entry.department ? (
                                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">{entry.department}</span>
                                ) : null}
                                <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">
                                  Requested {formatDateTime(entry.approvalRequestedAt || entry.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleUserApproval(entry, 'approved')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleUserApproval(entry, 'rejected')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200"
                              >
                                <Ban className="h-4 w-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : <EmptyState text="No pending approvals." />}
                    </div>
                  </Card>

                  <Card title="User directory" description="Ban, unban, and inspect platform users and department staff.">
                    <div className="space-y-3">
                      {moduleState.items.length ? moduleState.items.map((entry) => (
                        <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="font-semibold text-white">{entry.name}</div>
                              <div className="mt-1 text-sm text-slate-400">{entry.email}</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{entry.role}</span>
                                {entry.department ? <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">{entry.department}</span> : null}
                                <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{entry.credits ?? 0} credits</span>
                                <span
                                  className={`rounded-full px-3 py-1 ${
                                    (entry.approvalStatus || 'approved') === 'approved'
                                      ? 'bg-emerald-500/10 text-emerald-200'
                                      : (entry.approvalStatus || 'approved') === 'pending'
                                        ? 'bg-amber-500/10 text-amber-200'
                                        : 'bg-red-500/10 text-red-200'
                                  }`}
                                >
                                  {(entry.approvalStatus || 'approved').replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(entry.approvalStatus || 'approved') === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleUserApproval(entry, 'approved')}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUserApproval(entry, 'rejected')}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Reject
                                  </button>
                                </>
                              ) : null}
                              <button
                                onClick={() => handleUserBanToggle(entry)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                                  entry.isBanned ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'
                                }`}
                              >
                                {entry.isBanned ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                {entry.isBanned ? 'Unban user' : 'Ban user'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )) : <EmptyState text="No users loaded yet." />}
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {activeModule === 'roles' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Create role profile" description="Department-specific admin/staff permission bundle.">
                  <form className="grid gap-4" onSubmit={handleSaveRole}>
                    <Field label="Role name">
                      <input className={inputClassName} value={forms.role.name} onChange={(event) => updateForm('role', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Slug">
                      <input className={inputClassName} value={forms.role.slug} onChange={(event) => updateForm('role', 'slug', event.target.value)} placeholder="operations-admin" />
                    </Field>
                    <Field label="Base role">
                      <select className={inputClassName} value={forms.role.baseRole} onChange={(event) => updateForm('role', 'baseRole', event.target.value)}>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                        <option value="operations_manager">operations_manager</option>
                        <option value="support_admin">support_admin</option>
                        <option value="support_agent">support_agent</option>
                        <option value="analyst">analyst</option>
                        <option value="provider_manager">provider_manager</option>
                        <option value="content_manager">content_manager</option>
                      </select>
                    </Field>
                    <Field label="Department">
                      <input className={inputClassName} value={forms.role.department} onChange={(event) => updateForm('role', 'department', event.target.value)} />
                    </Field>
                    <Field label="Description">
                      <textarea className={textareaClassName} value={forms.role.description} onChange={(event) => updateForm('role', 'description', event.target.value)} />
                    </Field>
                    <Field label="Permissions (comma separated)">
                      <textarea className={textareaClassName} value={forms.role.permissions} onChange={(event) => updateForm('role', 'permissions', event.target.value)} />
                    </Field>
                    <Field label="Accessible modules (comma separated)">
                      <textarea className={textareaClassName} value={forms.role.accessibleModules} onChange={(event) => updateForm('role', 'accessibleModules', event.target.value)} />
                    </Field>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <Save className="h-4 w-4" />
                      Save role profile
                    </button>
                  </form>
                </Card>

                <Card title="Role catalog" description="Current role profiles and their ownership scope.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.description || entry.slug}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{entry.baseRole}</span>
                              {entry.department ? <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">{entry.department}</span> : null}
                              <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">{entry.permissions?.length || 0} permissions</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No role profiles found." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'plans' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Create or update plan" description="Configure one-time credit packs and recurring subscription plans.">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSavePlan}>
                    <Field label="Plan name">
                      <input className={inputClassName} value={forms.plan.name} onChange={(event) => updateForm('plan', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Slug">
                      <input className={inputClassName} value={forms.plan.slug} onChange={(event) => updateForm('plan', 'slug', event.target.value)} />
                    </Field>
                    <Field label="Category">
                      <select className={inputClassName} value={forms.plan.category} onChange={(event) => updateForm('plan', 'category', event.target.value)}>
                        <option value="credits">credits</option>
                        <option value="subscription">subscription</option>
                      </select>
                    </Field>
                    <Field label="Billing interval">
                      <select className={inputClassName} value={forms.plan.billingInterval} onChange={(event) => updateForm('plan', 'billingInterval', event.target.value)}>
                        <option value="one_time">one_time</option>
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                      </select>
                    </Field>
                    <Field label="Price">
                      <input className={inputClassName} type="number" min="0" value={forms.plan.price} onChange={(event) => updateForm('plan', 'price', event.target.value)} />
                    </Field>
                    <Field label="Credits">
                      <input className={inputClassName} type="number" min="0" value={forms.plan.credits} onChange={(event) => updateForm('plan', 'credits', event.target.value)} />
                    </Field>
                    <Field label="Trial days">
                      <input className={inputClassName} type="number" min="0" value={forms.plan.trialDays} onChange={(event) => updateForm('plan', 'trialDays', event.target.value)} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Features (comma separated)">
                        <textarea className={textareaClassName} value={forms.plan.features} onChange={(event) => updateForm('plan', 'features', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Toggle checked={forms.plan.isActive} onChange={(value) => updateForm('plan', 'isActive', value)} label="Plan active" />
                    </div>
                    <div className="md:col-span-2">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                        <Save className="h-4 w-4" />
                        Save plan
                      </button>
                    </div>
                  </form>
                </Card>

                <Card title="Plan catalog" description="All active/potential products available to users and students.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.slug}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold text-white">₹{entry.price}</div>
                            <div className="text-slate-400">{entry.credits || 0} credits</div>
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No plans available." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'coupons' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Create coupon" description="Manage redeem codes for students, users, and enterprise customers.">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveCoupon}>
                    <Field label="Code">
                      <input className={inputClassName} value={forms.coupon.code} onChange={(event) => updateForm('coupon', 'code', event.target.value)} required />
                    </Field>
                    <Field label="Name">
                      <input className={inputClassName} value={forms.coupon.name} onChange={(event) => updateForm('coupon', 'name', event.target.value)} />
                    </Field>
                    <Field label="Discount type">
                      <select className={inputClassName} value={forms.coupon.discountType} onChange={(event) => updateForm('coupon', 'discountType', event.target.value)}>
                        <option value="percentage">percentage</option>
                        <option value="flat">flat</option>
                      </select>
                    </Field>
                    <Field label="Discount value">
                      <input className={inputClassName} type="number" min="0" value={forms.coupon.discountValue} onChange={(event) => updateForm('coupon', 'discountValue', event.target.value)} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <textarea className={textareaClassName} value={forms.coupon.description} onChange={(event) => updateForm('coupon', 'description', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Applicable plan slugs">
                        <input className={inputClassName} value={forms.coupon.applicablePlanSlugs} onChange={(event) => updateForm('coupon', 'applicablePlanSlugs', event.target.value)} placeholder="basic, pro, professional-monthly" />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Toggle checked={forms.coupon.isActive} onChange={(value) => updateForm('coupon', 'isActive', value)} label="Coupon active" />
                    </div>
                    <div className="md:col-span-2">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                        <Save className="h-4 w-4" />
                        Save coupon
                      </button>
                    </div>
                  </form>
                </Card>

                <Card title="Coupon registry" description="Offer codes currently available to the platform.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.code}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.name || entry.description || 'Promotional coupon'}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold text-white">{entry.discountType} {entry.discountValue}</div>
                            <div className={`text-xs ${entry.isActive ? 'text-emerald-300' : 'text-slate-500'}`}>
                              {entry.isActive ? 'active' : 'inactive'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No coupons configured." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'payments' ? (
              <Card title="Payments ledger" description="Gateway orders, statuses, and customer-linked commercial records.">
                <div className="space-y-3">
                  {moduleState.items.length ? moduleState.items.map((entry) => (
                    <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="font-semibold text-white">{entry.orderId}</div>
                          <div className="mt-1 text-sm text-slate-400">
                            {entry.user?.email || 'Unknown user'} • {entry.plan?.name || 'No plan linked'}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-white">₹{entry.finalAmount}</div>
                          <div className="text-slate-400">{entry.status} • {entry.provider}</div>
                        </div>
                      </div>
                    </div>
                  )) : <EmptyState text="No payments found." />}
                </div>
              </Card>
            ) : null}

            {activeModule === 'subscriptions' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Grant subscription manually" description="Assign monthly/yearly access without waiting for payment gateway integration.">
                  <form className="grid gap-4" onSubmit={handleSaveSubscription}>
                    <Field label="User">
                      <select className={inputClassName} value={forms.subscription.userId} onChange={(event) => updateForm('subscription', 'userId', event.target.value)} required>
                        <option value="">Select user</option>
                        {availableUsers.map((entry) => (
                          <option key={entry._id || entry.id} value={entry._id || entry.id}>
                            {entry.name} ({entry.email})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Plan">
                      <select className={inputClassName} value={forms.subscription.planId} onChange={(event) => updateForm('subscription', 'planId', event.target.value)} required>
                        <option value="">Select plan</option>
                        {availablePlans.map((entry) => (
                          <option key={entry._id || entry.id} value={entry._id || entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Provider">
                      <select className={inputClassName} value={forms.subscription.provider} onChange={(event) => updateForm('subscription', 'provider', event.target.value)}>
                        <option value="internal">internal</option>
                        <option value="stripe">stripe</option>
                        <option value="razorpay">razorpay</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <select className={inputClassName} value={forms.subscription.status} onChange={(event) => updateForm('subscription', 'status', event.target.value)}>
                        <option value="trialing">trialing</option>
                        <option value="active">active</option>
                        <option value="paused">paused</option>
                        <option value="past_due">past_due</option>
                        <option value="canceled">canceled</option>
                        <option value="expired">expired</option>
                      </select>
                    </Field>
                    <Toggle checked={forms.subscription.autoRenew} onChange={(value) => updateForm('subscription', 'autoRenew', value)} label="Auto renew" />
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <Save className="h-4 w-4" />
                      Save subscription
                    </button>
                  </form>
                </Card>

                <Card title="Subscriptions" description="Current user plan assignments and lifecycle status.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.user?.email || 'Unknown user'}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.plan?.name || 'Unknown plan'} • {entry.provider}</div>
                          </div>
                          <div className="text-sm text-slate-300">{entry.status}</div>
                        </div>
                      </div>
                    )) : <EmptyState text="No subscriptions found." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'providers' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.95fr,1.05fr]">
                <Card title="Provider connector" description="Wire external OSINT/payment/communication providers. Tool activation follows provider readiness.">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveProvider}>
                    <Field label="Provider name">
                      <input className={inputClassName} value={forms.provider.name} onChange={(event) => updateForm('provider', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Slug">
                      <input className={inputClassName} value={forms.provider.slug} onChange={(event) => updateForm('provider', 'slug', event.target.value)} />
                    </Field>
                    <Field label="Type">
                      <select className={inputClassName} value={forms.provider.type} onChange={(event) => updateForm('provider', 'type', event.target.value)}>
                        <option value="http">http</option>
                        <option value="dataset">dataset</option>
                        <option value="payment">payment</option>
                        <option value="mail">mail</option>
                        <option value="chatbot">chatbot</option>
                        <option value="threat_feed">threat_feed</option>
                      </select>
                    </Field>
                    <Field label="Method">
                      <select className={inputClassName} value={forms.provider.method} onChange={(event) => updateForm('provider', 'method', event.target.value)}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Base URL">
                        <input className={inputClassName} value={forms.provider.baseUrl} onChange={(event) => updateForm('provider', 'baseUrl', event.target.value)} />
                      </Field>
                    </div>
                    <Field label="Auth type">
                      <select className={inputClassName} value={forms.provider.authType} onChange={(event) => updateForm('provider', 'authType', event.target.value)}>
                        <option value="none">none</option>
                        <option value="api_key_header">api_key_header</option>
                        <option value="bearer">bearer</option>
                        <option value="basic">basic</option>
                        <option value="query">query</option>
                      </select>
                    </Field>
                    <Field label="Secret / API key">
                      <input className={inputClassName} value={forms.provider.secretRef} onChange={(event) => updateForm('provider', 'secretRef', event.target.value)} placeholder="paste provider key here" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Tool IDs (comma separated)">
                        <input className={inputClassName} value={forms.provider.toolIds} onChange={(event) => updateForm('provider', 'toolIds', event.target.value)} placeholder="phone-lookup, breach-database" />
                      </Field>
                    </div>
                    <Field label="Headers JSON">
                      <textarea className={textareaClassName} value={forms.provider.headers} onChange={(event) => updateForm('provider', 'headers', event.target.value)} />
                    </Field>
                    <Field label="Query template JSON">
                      <textarea className={textareaClassName} value={forms.provider.queryTemplate} onChange={(event) => updateForm('provider', 'queryTemplate', event.target.value)} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Body template JSON">
                        <textarea className={textareaClassName} value={forms.provider.bodyTemplate} onChange={(event) => updateForm('provider', 'bodyTemplate', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Toggle checked={forms.provider.enabled} onChange={(value) => updateForm('provider', 'enabled', value)} label="Provider enabled" />
                    </div>
                    <div className="md:col-span-2">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                        <Save className="h-4 w-4" />
                        Save provider
                      </button>
                    </div>
                  </form>
                </Card>

                <Card title="Provider matrix" description="Enabled providers automatically unlock linked tools when credentials are present.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.type} • {entry.baseUrl || 'No URL configured'}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                              {(entry.toolIds || []).map((toolId) => (
                                <span key={toolId} className="rounded-full bg-white/5 px-3 py-1">{toolId}</span>
                              ))}
                            </div>
                          </div>
                          <div className={`text-sm ${entry.enabled ? 'text-emerald-300' : 'text-slate-500'}`}>
                            {entry.enabled ? 'enabled' : 'disabled'}
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No providers registered." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'tools' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Tool control" description="Set visibility, credits, and operational metadata for each tool.">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveTool}>
                    <Field label="Tool name">
                      <input className={inputClassName} value={forms.tool.name} onChange={(event) => updateForm('tool', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Tool ID">
                      <input className={inputClassName} value={forms.tool.toolId} onChange={(event) => updateForm('tool', 'toolId', event.target.value)} required />
                    </Field>
                    <Field label="Category">
                      <input className={inputClassName} value={forms.tool.category} onChange={(event) => updateForm('tool', 'category', event.target.value)} />
                    </Field>
                    <Field label="Tags">
                      <input className={inputClassName} value={forms.tool.tags} onChange={(event) => updateForm('tool', 'tags', event.target.value)} placeholder="osint, telecom" />
                    </Field>
                    <Field label="Student cost">
                      <input className={inputClassName} type="number" min="0" value={forms.tool.studentCost} onChange={(event) => updateForm('tool', 'studentCost', event.target.value)} />
                    </Field>
                    <Field label="User cost">
                      <input className={inputClassName} type="number" min="0" value={forms.tool.userCost} onChange={(event) => updateForm('tool', 'userCost', event.target.value)} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <textarea className={textareaClassName} value={forms.tool.description} onChange={(event) => updateForm('tool', 'description', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Toggle checked={forms.tool.isEnabled} onChange={(value) => updateForm('tool', 'isEnabled', value)} label="Tool enabled" />
                    </div>
                    <div className="md:col-span-2">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                        <Save className="h-4 w-4" />
                        Save tool
                      </button>
                    </div>
                  </form>
                </Card>

                <Card title="Tool catalog" description="Frontend tools become truly active when enabled here and backed by a provider or dataset.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.toolId} • {entry.category}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold text-white">Student {entry.creditCost?.student || 0}</div>
                            <div className="text-slate-400">User {entry.creditCost?.user || 0}</div>
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No tools configured." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'apiKeys' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Issue API key" description="Create operator-facing API keys with scopes and expiry.">
                  <form className="grid gap-4" onSubmit={handleSaveApiKey}>
                    <Field label="Owner">
                      <select className={inputClassName} value={forms.apiKey.owner} onChange={(event) => updateForm('apiKey', 'owner', event.target.value)}>
                        <option value="">No owner / system key</option>
                        {availableUsers.map((entry) => (
                          <option key={entry._id || entry.id} value={entry._id || entry.id}>
                            {entry.name} ({entry.email})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Key name">
                      <input className={inputClassName} value={forms.apiKey.name} onChange={(event) => updateForm('apiKey', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Scopes (comma separated)">
                      <textarea className={textareaClassName} value={forms.apiKey.scopes} onChange={(event) => updateForm('apiKey', 'scopes', event.target.value)} />
                    </Field>
                    <Field label="Expires at">
                      <input className={inputClassName} type="datetime-local" value={forms.apiKey.expiresAt} onChange={(event) => updateForm('apiKey', 'expiresAt', event.target.value)} />
                    </Field>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <FileKey2 className="h-4 w-4" />
                      Generate key
                    </button>
                    {generatedApiKey ? (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        Generated key: <span className="break-all font-mono">{generatedApiKey}</span>
                      </div>
                    ) : null}
                  </form>
                </Card>

                <Card title="Issued API keys" description="Audit of active credentials and ownership.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.owner?.email || 'System'} • {entry.keyPrefix}...</div>
                          </div>
                          <div className="text-sm text-slate-300">{entry.isActive ? 'active' : 'disabled'}</div>
                        </div>
                      </div>
                    )) : <EmptyState text="No API keys issued." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'datasets' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Register dataset source" description="Attach upload/manual/external-sync datasets to sensitive tools.">
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveDataset}>
                    <Field label="Dataset name">
                      <input className={inputClassName} value={forms.dataset.name} onChange={(event) => updateForm('dataset', 'name', event.target.value)} required />
                    </Field>
                    <Field label="Slug">
                      <input className={inputClassName} value={forms.dataset.slug} onChange={(event) => updateForm('dataset', 'slug', event.target.value)} />
                    </Field>
                    <Field label="Source type">
                      <select className={inputClassName} value={forms.dataset.sourceType} onChange={(event) => updateForm('dataset', 'sourceType', event.target.value)}>
                        <option value="upload">upload</option>
                        <option value="manual">manual</option>
                        <option value="external_sync">external_sync</option>
                      </select>
                    </Field>
                    <Field label="Format">
                      <select className={inputClassName} value={forms.dataset.format} onChange={(event) => updateForm('dataset', 'format', event.target.value)}>
                        <option value="json">json</option>
                        <option value="csv">csv</option>
                        <option value="jsonl">jsonl</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Tool IDs">
                        <input className={inputClassName} value={forms.dataset.toolIds} onChange={(event) => updateForm('dataset', 'toolIds', event.target.value)} placeholder="breach-database, person-location" />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <textarea className={textareaClassName} value={forms.dataset.description} onChange={(event) => updateForm('dataset', 'description', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="File URL">
                        <input className={inputClassName} value={forms.dataset.fileUrl} onChange={(event) => updateForm('dataset', 'fileUrl', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Mapping JSON">
                        <textarea className={textareaClassName} value={forms.dataset.mapping} onChange={(event) => updateForm('dataset', 'mapping', event.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <Toggle checked={forms.dataset.enabled} onChange={(value) => updateForm('dataset', 'enabled', value)} label="Dataset enabled" />
                      <Toggle checked={forms.dataset.restricted} onChange={(value) => updateForm('dataset', 'restricted', value)} label="Restricted dataset" />
                    </div>
                    <div className="md:col-span-2">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                        <Save className="h-4 w-4" />
                        Save dataset
                      </button>
                    </div>
                  </form>
                </Card>

                <Card title="Dataset registry" description="Configured leak-search and intelligence data sources.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.name}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.sourceType} • {entry.recordCount || 0} records</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                              {(entry.toolIds || []).map((toolId) => (
                                <span key={toolId} className="rounded-full bg-white/5 px-3 py-1">{toolId}</span>
                              ))}
                            </div>
                          </div>
                          <div className={`text-sm ${entry.enabled ? 'text-emerald-300' : 'text-slate-500'}`}>
                            {entry.enabled ? 'enabled' : 'disabled'}
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No datasets registered." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'content' ? (
              <div className="grid gap-6 2xl:grid-cols-[0.9fr,1.1fr]">
                <Card title="Content block editor" description="Homepage copy, pricing content, and future CMS-like blocks.">
                  <form className="grid gap-4" onSubmit={handleSaveContent}>
                    <Field label="Key">
                      <input className={inputClassName} value={forms.content.key} onChange={(event) => updateForm('content', 'key', event.target.value)} required />
                    </Field>
                    <Field label="Section">
                      <input className={inputClassName} value={forms.content.section} onChange={(event) => updateForm('content', 'section', event.target.value)} />
                    </Field>
                    <Field label="Title">
                      <input className={inputClassName} value={forms.content.title} onChange={(event) => updateForm('content', 'title', event.target.value)} />
                    </Field>
                    <Field label="Body JSON">
                      <textarea className={textareaClassName} value={forms.content.body} onChange={(event) => updateForm('content', 'body', event.target.value)} />
                    </Field>
                    <Toggle checked={forms.content.isPublished} onChange={(value) => updateForm('content', 'isPublished', value)} label="Published" />
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <Save className="h-4 w-4" />
                      Save content block
                    </button>
                  </form>
                </Card>

                <Card title="Published content blocks" description="Current content registry powering dynamic pages.">
                  <div className="space-y-3">
                    {moduleState.items.length ? moduleState.items.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="font-semibold text-white">{entry.title || entry.key}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.section} • {entry.key}</div>
                          </div>
                          <div className={`text-sm ${entry.isPublished ? 'text-emerald-300' : 'text-slate-500'}`}>
                            {entry.isPublished ? 'published' : 'draft'}
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No content blocks found." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'settings' ? (
              <div className="grid gap-6 2xl:grid-cols-2">
                <Card title="Platform setting" description="Manage public and internal runtime settings.">
                  <form className="grid gap-4" onSubmit={handleSaveSetting}>
                    <Field label="Group">
                      <input className={inputClassName} value={forms.setting.group} onChange={(event) => updateForm('setting', 'group', event.target.value)} required />
                    </Field>
                    <Field label="Key">
                      <input className={inputClassName} value={forms.setting.key} onChange={(event) => updateForm('setting', 'key', event.target.value)} required />
                    </Field>
                    <Field label="Description">
                      <input className={inputClassName} value={forms.setting.description} onChange={(event) => updateForm('setting', 'description', event.target.value)} />
                    </Field>
                    <Field label="Value JSON">
                      <textarea className={textareaClassName} value={forms.setting.value} onChange={(event) => updateForm('setting', 'value', event.target.value)} />
                    </Field>
                    <Toggle checked={forms.setting.isPublic} onChange={(value) => updateForm('setting', 'isPublic', value)} label="Public setting" />
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <Save className="h-4 w-4" />
                      Save setting
                    </button>
                  </form>
                </Card>

                <Card title="Feature toggle" description="Role-aware runtime switches for pages and tools.">
                  <form className="grid gap-4" onSubmit={handleSaveToggle}>
                    <Field label="Key">
                      <input className={inputClassName} value={forms.toggle.key} onChange={(event) => updateForm('toggle', 'key', event.target.value)} required />
                    </Field>
                    <Field label="Description">
                      <input className={inputClassName} value={forms.toggle.description} onChange={(event) => updateForm('toggle', 'description', event.target.value)} />
                    </Field>
                    <Field label="Roles (comma separated)">
                      <textarea className={textareaClassName} value={forms.toggle.roles} onChange={(event) => updateForm('toggle', 'roles', event.target.value)} />
                    </Field>
                    <Toggle checked={forms.toggle.enabled} onChange={(value) => updateForm('toggle', 'enabled', value)} label="Enabled" />
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white" type="submit">
                      <Save className="h-4 w-4" />
                      Save toggle
                    </button>
                  </form>
                </Card>

                <Card title="Settings registry" description="Current settings saved in the platform.">
                  <div className="space-y-3">
                    {settingsData.settings.length ? settingsData.settings.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="font-semibold text-white">{entry.group}.{entry.key}</div>
                        <div className="mt-1 text-sm text-slate-400">{entry.description || 'No description'}</div>
                      </div>
                    )) : <EmptyState text="No settings saved." />}
                  </div>
                </Card>

                <Card title="Feature toggles registry" description="Current runtime switches applied by backend.">
                  <div className="space-y-3">
                    {settingsData.featureToggles.length ? settingsData.featureToggles.map((entry) => (
                      <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{entry.key}</div>
                            <div className="mt-1 text-sm text-slate-400">{entry.description || 'No description'}</div>
                          </div>
                          <div className={`text-sm ${entry.enabled ? 'text-emerald-300' : 'text-slate-500'}`}>
                            {entry.enabled ? 'enabled' : 'disabled'}
                          </div>
                        </div>
                      </div>
                    )) : <EmptyState text="No toggles saved." />}
                  </div>
                </Card>
              </div>
            ) : null}

            {activeModule === 'tickets' ? (
              <Card title="Support queue" description="Contact us, feedback, bug, and support tickets visible to admin teams.">
                <div className="space-y-3">
                  {moduleState.items.length ? moduleState.items.map((entry) => (
                    <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="font-semibold text-white">{entry.ticketNumber || entry.subject}</div>
                          <div className="mt-1 text-sm text-slate-400">
                            {entry.email} • {entry.type} • {entry.priority}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleTicketUpdate(entry._id || entry.id, status)}
                              className={`rounded-full px-3 py-2 text-xs transition ${
                                entry.status === status
                                  ? 'bg-cyan-500/15 text-cyan-200'
                                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )) : <EmptyState text="No support tickets found." />}
                </div>
              </Card>
            ) : null}

            {activeModule === 'logs' ? (
              <Card title="Search log audit" description="Investigation history, user search traces, and tool consumption logs.">
                <div className="space-y-3">
                  {moduleState.items.length ? moduleState.items.map((entry) => (
                    <div key={entry._id || entry.id} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-semibold text-white">{entry.toolName || entry.toolId}</div>
                          <div className="mt-1 text-sm text-slate-400">
                            {entry.user?.email || 'Unknown user'} • {entry.searchType} • {entry.query}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-white">{entry.status}</div>
                          <div className="text-slate-400">{formatDateTime(entry.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  )) : <EmptyState text="No search logs available." />}
                </div>
              </Card>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
