import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  MonitorSmartphone,
  Phone,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { ADMIN_LOGIN_PATH } from '../../utils/appRoutes';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const profileFromUser = (user) => ({
  name: user?.name || '',
  username: user?.username || '',
  email: user?.email || '',
  phone: user?.phone || '',
  organization: user?.organization || '',
  bio: user?.bio || '',
  avatar: user?.avatar || ''
});

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500/50';

const cardClassName =
  'rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(2,6,23,0.35)]';

const sessionLabel = (session) => {
  const device = session?.device?.kind || session?.device?.device || 'Desktop';
  const os = session?.device?.os || 'Unknown OS';
  const browser = session?.device?.browser || 'Unknown Browser';
  return [device, os, browser].filter(Boolean).join(' | ');
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

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
    {children}
    {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
  </label>
);

const Section = ({ title, description, children, actions }) => (
  <section className={cardClassName}>
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

const AdminProfilePanel = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profileData, setProfileData] = useState(profileFromUser(user));
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [sessions, setSessions] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setProfileData(profileFromUser(user));
  }, [user]);

  const currentAvatar = useMemo(() => {
    if (!profileData.avatar) {
      return '';
    }

    return profileData.avatar.startsWith('http') ? profileData.avatar : `${API_ORIGIN}${profileData.avatar}`;
  }, [profileData.avatar]);

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ type, text });
    window.setTimeout(() => {
      setMessage((current) => (current.text === text ? { type: '', text: '' } : current));
    }, 4000);
  }, []);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const payload = await authService.getSessions();
      setSessions(Array.isArray(payload) ? payload : []);
    } catch (error) {
      showMessage(error.message || 'Failed to load sessions', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const updatedUser = await authService.updateProfile({
        name: profileData.name || undefined,
        username: profileData.username || undefined,
        email: profileData.email || undefined,
        phone: profileData.phone || undefined,
        organization: profileData.organization || undefined,
        bio: profileData.bio || undefined,
        avatar: profileData.avatar || undefined
      });

      updateUser?.(updatedUser);
      showMessage(
        updatedUser?.isEmailVerified === false && updatedUser?.email === profileData.email
          ? 'Profile updated. Verify the new email if SMTP is configured.'
          : 'Admin profile updated'
      );
    } catch (error) {
      showMessage(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const upload = await authService.uploadAvatar(file);
      const nextAvatar = upload?.absoluteUrl || upload?.url || '';
      setProfileData((current) => ({
        ...current,
        avatar: nextAvatar
      }));
      showMessage('Photo uploaded. Save profile to apply the new avatar.');
    } catch (error) {
      showMessage(error.message || 'Failed to upload avatar', 'error');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New password and confirm password do not match', 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      await logout();
      navigate(ADMIN_LOGIN_PATH, { replace: true });
    } catch (error) {
      showMessage(error.message || 'Failed to change password', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setIsRevokingSessions(true);
    try {
      await authService.revokeSession(sessionId);
      await loadSessions();
      showMessage('Session revoked');
    } catch (error) {
      showMessage(error.message || 'Failed to revoke session', 'error');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsRevokingSessions(true);
    try {
      await authService.revokeAllSessions();
      await loadSessions();
      showMessage('All sessions revoked');
    } catch (error) {
      showMessage(error.message || 'Failed to revoke sessions', 'error');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[340px,minmax(0,1fr)]">
      <div className="space-y-6">
        <section className={cardClassName}>
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-slate-950">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt="Admin avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-cyan-300" />
                  )}
                </div>
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/90 text-white shadow-lg transition hover:scale-105">
                {isUploadingAvatar ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">{user?.name || user?.email || 'Admin'}</h2>
            <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
            <span className="mt-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
              {user?.role || 'admin'}
            </span>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Email Status</div>
              <div className={`mt-1 text-sm font-medium ${user?.isEmailVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
                {user?.isEmailVerified ? 'Verified' : 'Pending verification'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Department</div>
              <div className="mt-1 text-sm font-medium text-white">{user?.department || 'Operations'}</div>
            </div>
          </div>
        </section>

        {message.text ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {message.type === 'error' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <Section
          title="Profile Details"
          description="Update name, email, phone, avatar, and operator identity fields used across the admin console."
          actions={
            <button
              type="submit"
              form="admin-profile-form"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProfile ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </button>
          }
        >
          <form id="admin-profile-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleProfileSave}>
            <Field label="Full Name">
              <input
                className={inputClassName}
                value={profileData.name}
                onChange={(event) => setProfileData((current) => ({ ...current, name: event.target.value }))}
                placeholder="Admin full name"
              />
            </Field>
            <Field label="Username">
              <input
                className={inputClassName}
                value={profileData.username}
                onChange={(event) => setProfileData((current) => ({ ...current, username: event.target.value }))}
                placeholder="admin-username"
              />
            </Field>
            <Field label="Email Address" hint="Changing email will reset verification status until the new address is verified.">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  className={`${inputClassName} pl-11`}
                  value={profileData.email}
                  onChange={(event) => setProfileData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin@company.com"
                />
              </div>
            </Field>
            <Field label="Phone Number">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputClassName} pl-11`}
                  value={profileData.phone}
                  onChange={(event) => setProfileData((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+91..."
                />
              </div>
            </Field>
            <Field label="Organization">
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className={`${inputClassName} pl-11`}
                  value={profileData.organization}
                  onChange={(event) => setProfileData((current) => ({ ...current, organization: event.target.value }))}
                  placeholder="Cyber Rakhwala Ops"
                />
              </div>
            </Field>
            <Field label="Avatar URL" hint="This will auto-fill after photo upload, but you can also paste a hosted image URL.">
              <input
                className={inputClassName}
                value={profileData.avatar}
                onChange={(event) => setProfileData((current) => ({ ...current, avatar: event.target.value }))}
                placeholder="https://..."
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Bio">
                <textarea
                  className={`${inputClassName} min-h-[120px] resize-y`}
                  value={profileData.bio}
                  onChange={(event) => setProfileData((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="Short admin/operator bio"
                />
              </Field>
            </div>
          </form>
        </Section>

        <Section
          title="Security"
          description="Change the admin password and lock down stale sessions before going live."
          actions={
            <button
              type="submit"
              form="admin-password-form"
              disabled={isSavingPassword}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingPassword ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Change Password
            </button>
          }
        >
          <form id="admin-password-form" className="grid gap-4 md:grid-cols-3" onSubmit={handlePasswordSave}>
            <Field label="Current Password">
              <input
                type="password"
                className={inputClassName}
                value={passwordData.currentPassword}
                onChange={(event) =>
                  setPasswordData((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                className={inputClassName}
                value={passwordData.newPassword}
                onChange={(event) =>
                  setPasswordData((current) => ({ ...current, newPassword: event.target.value }))
                }
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                className={inputClassName}
                value={passwordData.confirmPassword}
                onChange={(event) =>
                  setPasswordData((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </Field>
          </form>
        </Section>

        <Section
          title="Active Sessions"
          description="Revoke risky devices or force a full session reset before production launch."
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadSessions}
                disabled={isLoadingSessions}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleRevokeAllSessions}
                disabled={isRevokingSessions || sessions.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                Revoke All
              </button>
            </div>
          }
        >
          {isLoadingSessions ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-400">
              Loading active sessions...
            </div>
          ) : sessions.length ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id || session._id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <MonitorSmartphone className="h-4 w-4 text-cyan-300" />
                      <span className="truncate">{sessionLabel(session)}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Last active {formatDateTime(session.lastSeenAt || session.updatedAt || session.createdAt)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      IP {session.ipAddress || session.ip || 'Unknown'} {session.isCurrent ? '| Current session' : ''}
                    </div>
                  </div>
                  {!session.isCurrent ? (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.id || session._id)}
                      disabled={isRevokingSessions}
                      className="inline-flex items-center gap-2 self-start rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Revoke
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      <KeyRound className="h-4 w-4" />
                      Current
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-8 text-center text-sm text-slate-500">
              No active sessions found.
            </div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default AdminProfilePanel;
