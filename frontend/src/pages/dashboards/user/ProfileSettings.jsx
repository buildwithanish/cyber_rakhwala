import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Shield,
  Bell,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Camera,
  Save,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  Folder,
  Zap,
  ChevronRight,
  Edit3,
  Key,
  History,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useActivity } from '../../../context/ActivityContext';
import { useCases } from '../../../context/CaseContext';
import { useSession } from '../../../context/SessionContext';
import authService from '../../../services/authService';
import LoginActivityLog from '../../../components/common/LoginActivityLog';

const SettingToggle = ({ label, description, value, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-800 p-5 transition-colors hover:border-slate-600">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700">
        <Icon className="h-6 w-6 text-cyan-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-white">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(!value)}
      className={`relative h-7 w-14 rounded-full transition-colors ${value ? 'bg-cyan-500' : 'bg-slate-600'}`}
    >
      <motion.div
        animate={{ x: value ? 28 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg"
      />
    </motion.button>
  </div>
);

const profileFromUser = (user) => ({
  name: user?.name || '',
  username: user?.username || '',
  email: user?.email || '',
  phone: user?.phone || '',
  organization: user?.organization || '',
  bio: user?.bio || ''
});

const settingsFromUser = (user) => ({
  darkMode: user?.preferences?.theme !== 'light',
  soundEffects: user?.preferences?.ui?.soundEffects ?? true,
  autoSave: user?.preferences?.ui?.autoSave ?? true,
  twoFactor: user?.preferences?.security?.twoFactor ?? false,
  emailAlerts: user?.preferences?.notifications?.email ?? true,
  pushNotifications: user?.preferences?.notifications?.push ?? true,
  weeklyReport: user?.preferences?.notifications?.weeklyReport ?? false,
  loginAlerts: user?.preferences?.security?.loginAlerts ?? true
});

const toPreferencePayload = (settings) => ({
  preferences: {
    theme: settings.darkMode ? 'dark' : 'light',
    notifications: {
      email: settings.emailAlerts,
      push: settings.pushNotifications,
      weeklyReport: settings.weeklyReport
    },
    ui: {
      soundEffects: settings.soundEffects,
      autoSave: settings.autoSave
    },
    security: {
      twoFactor: settings.twoFactor,
      loginAlerts: settings.loginAlerts
    }
  }
});

const sessionLabel = (session) => {
  const device = session?.device?.kind || session?.device?.device || 'Desktop';
  const os = session?.device?.os || 'Unknown';
  const browser = session?.device?.browser || 'Unknown';
  return [device, os, browser].filter(Boolean).join(' | ');
};

const ProfileSettings = () => {
  const { user, logout, updateUser } = useAuth();
  const { activities, getRecentActivities, formatTimeAgo } = useActivity();
  const { getStatistics: getCaseStats } = useCases();
  const { getActivityStats } = useSession();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showLoginActivity, setShowLoginActivity] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [profileData, setProfileData] = useState(profileFromUser(user));
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settings, setSettings] = useState(settingsFromUser(user));

  useEffect(() => {
    setProfileData(profileFromUser(user));
    setSettings(settingsFromUser(user));
  }, [user]);

  const loginStats = getActivityStats();
  const caseStats = getCaseStats();
  const recentActivities = getRecentActivities(5);
  const toolsUsedCount = activities?.filter((entry) => entry.type === 'tool').length || 0;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  const showSuccess = useCallback((message) => {
    setSaveError('');
    setSaveSuccess(message);
    window.setTimeout(() => setSaveSuccess(''), 3000);
  }, []);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const payload = await authService.getSessions();
      setSessions(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('[ProfileSettings] Failed to load sessions:', error);
      setSaveError(error.message || 'Failed to load active sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const persistSettings = useCallback(
    async (nextSettings) => {
      setSettings(nextSettings);
      setIsSaving(true);
      setSaveError('');

      try {
        const updatedUser = await authService.updateProfile(toPreferencePayload(nextSettings));
        updateUser?.(updatedUser);
        showSuccess('Preferences updated');
      } catch (error) {
        console.error('[ProfileSettings] Failed to save preferences:', error);
        setSaveError(error.message || 'Failed to save preferences');
      } finally {
        setIsSaving(false);
      }
    },
    [showSuccess, updateUser]
  );

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');

    try {
      const updatedUser = await authService.updateProfile({
        name: profileData.name,
        username: profileData.username,
        phone: profileData.phone,
        organization: profileData.organization,
        bio: profileData.bio
      });

      updateUser?.(updatedUser);
      setIsEditing(false);
      showSuccess('Profile updated');
    } catch (error) {
      console.error('[ProfileSettings] Failed to save profile:', error);
      setSaveError(error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveError('Passwords do not match');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('[ProfileSettings] Failed to change password:', error);
      setSaveError(error.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSession = useCallback(
    async (sessionId) => {
      setIsRevokingSessions(true);
      setSaveError('');

      try {
        await authService.revokeSession(sessionId);
        await loadSessions();
        showSuccess('Session revoked');
      } catch (error) {
        console.error('[ProfileSettings] Failed to revoke session:', error);
        setSaveError(error.message || 'Failed to revoke session');
      } finally {
        setIsRevokingSessions(false);
      }
    },
    [loadSessions, showSuccess]
  );

  const handleRevokeAllSessions = useCallback(async () => {
    setIsRevokingSessions(true);
    setSaveError('');

    try {
      await authService.revokeAllSessions();
      await loadSessions();
      showSuccess('All sessions revoked');
    } catch (error) {
      console.error('[ProfileSettings] Failed to revoke sessions:', error);
      setSaveError(error.message || 'Failed to revoke sessions');
    } finally {
      setIsRevokingSessions(false);
    }
  }, [loadSessions, showSuccess]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/user')}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 transition-colors hover:border-cyan-500/50"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-sm text-gray-400">Manage your profile and preferences</p>
              </div>
            </div>

            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-2"
              >
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">{saveSuccess}</span>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {saveError && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {saveError}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-1">
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-900">
                      <User className="h-12 w-12 text-cyan-400" />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-cyan-500 opacity-70"
                    title="Avatar upload will be enabled after storage configuration is connected."
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{user?.name || user?.username || 'User'}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="mt-2 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400">
                  {user?.role || 'user'}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800 p-3 text-center">
                  <p className="text-xl font-bold text-cyan-400">{caseStats?.completed || 0}</p>
                  <p className="text-xs text-gray-500">Cases</p>
                </div>
                <div className="rounded-xl bg-slate-800 p-3 text-center">
                  <p className="text-xl font-bold text-violet-400">{toolsUsedCount}</p>
                  <p className="text-xs text-gray-500">Tools</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    activeTab === tab.id
                      ? 'border border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight
                    className={`ml-auto h-4 w-4 transition-transform ${
                      activeTab === tab.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              ))}
            </nav>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                Account Closure
              </h4>
              <p className="mb-3 text-xs text-gray-400">
                For investigation integrity, account deletion requests are handled by support.
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/30"
              >
                <Trash2 className="h-4 w-4" />
                Contact Support
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Personal Information</h2>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isEditing) {
                          setProfileData(profileFromUser(user));
                        }
                        setIsEditing((previous) => !previous);
                      }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                        isEditing
                          ? 'bg-slate-700 text-gray-300'
                          : 'border border-cyan-500/30 bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </motion.button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(event) =>
                          setProfileData((previous) => ({ ...previous, name: event.target.value }))
                        }
                        disabled={!isEditing}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Username</label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(event) =>
                          setProfileData((previous) => ({ ...previous, username: event.target.value }))
                        }
                        disabled={!isEditing}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(event) =>
                          setProfileData((previous) => ({ ...previous, phone: event.target.value }))
                        }
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Organization</label>
                      <input
                        type="text"
                        value={profileData.organization}
                        onChange={(event) =>
                          setProfileData((previous) => ({
                            ...previous,
                            organization: event.target.value
                          }))
                        }
                        disabled={!isEditing}
                        placeholder="Enter organization"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-400">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(event) =>
                          setProfileData((previous) => ({ ...previous, bio: event.target.value }))
                        }
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex justify-end"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                          />
                        ) : (
                          <Save className="h-5 w-5" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </motion.div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-6 text-xl font-bold text-white">Recent Activity</h2>
                  <div className="space-y-3">
                    {recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div
                          key={activity.id || index}
                          className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              activity.type === 'tool'
                                ? 'bg-violet-500/20'
                                : activity.type === 'credits'
                                  ? 'bg-amber-500/20'
                                  : activity.type === 'case'
                                    ? 'bg-cyan-500/20'
                                    : 'bg-slate-700'
                            }`}
                          >
                            {activity.type === 'tool' ? (
                              <Target className="h-5 w-5 text-violet-400" />
                            ) : activity.type === 'credits' ? (
                              <Zap className="h-5 w-5 text-amber-400" />
                            ) : activity.type === 'case' ? (
                              <Folder className="h-5 w-5 text-cyan-400" />
                            ) : (
                              <Activity className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white">{activity.action}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <Activity className="mx-auto mb-3 h-12 w-12 opacity-30" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                    <Key className="h-6 w-6 text-cyan-400" />
                    Change Password
                  </h2>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(event) =>
                            setPasswordData((previous) => ({
                              ...previous,
                              currentPassword: event.target.value
                            }))
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((previous) => !previous)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(event) =>
                          setPasswordData((previous) => ({
                            ...previous,
                            newPassword: event.target.value
                          }))
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-400">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(event) =>
                          setPasswordData((previous) => ({
                            ...previous,
                            confirmPassword: event.target.value
                          }))
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:outline-none"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePasswordChange}
                      disabled={
                        isSaving ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword
                      }
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Lock className="h-5 w-5" />
                      Update Password
                    </motion.button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                    <Shield className="h-6 w-6 text-cyan-400" />
                    Security Settings
                  </h2>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                      value={settings.twoFactor}
                      onChange={(value) => persistSettings({ ...settings, twoFactor: value })}
                      icon={Shield}
                    />
                    <SettingToggle
                      label="Login Alerts"
                      description="Get notified when someone logs into your account"
                      value={settings.loginAlerts}
                      onChange={(value) => persistSettings({ ...settings, loginAlerts: value })}
                      icon={Bell}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-white">Active Sessions</h2>
                    <button
                      onClick={handleRevokeAllSessions}
                      disabled={isRevokingSessions || sessions.length === 0}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Revoke All Sessions
                    </button>
                  </div>
                  <div className="space-y-3">
                    {isLoadingSessions ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-6 text-center text-sm text-gray-400">
                        Loading active sessions...
                      </div>
                    ) : sessions.length > 0 ? (
                      sessions.map((session) => {
                        const active = !session.revokedAt;

                        return (
                          <div
                            key={session._id || session.id}
                            className={`flex items-center justify-between rounded-xl border p-4 ${
                              session.isCurrent
                                ? 'border-emerald-500/30 bg-slate-800'
                                : 'border-slate-700 bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                  active ? 'bg-emerald-500/20' : 'bg-slate-700'
                                }`}
                              >
                                <CheckCircle
                                  className={`h-5 w-5 ${active ? 'text-emerald-400' : 'text-gray-400'}`}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {session.isCurrent ? 'Current Session' : 'Linked Session'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {sessionLabel(session)} | {active ? 'Active now' : 'Revoked'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Last activity:{' '}
                                  {formatTimeAgo(
                                    session.lastActivityAt || session.updatedAt || session.createdAt
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs ${
                                  active
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-700 text-gray-400'
                                }`}
                              >
                                {active ? 'Active' : 'Revoked'}
                              </span>
                              {!session.isCurrent && active && (
                                <button
                                  onClick={() => handleRevokeSession(session._id || session.id)}
                                  disabled={isRevokingSessions}
                                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-6 text-center text-sm text-gray-400">
                        No active sessions found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-white">
                    <History className="h-6 w-6 text-violet-400" />
                    Login Activity
                  </h2>
                  <p className="mb-4 text-sm text-gray-400">
                    Monitor your account&apos;s login history for security
                  </p>
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-slate-800 p-4 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{loginStats?.totalLogins || 0}</p>
                      <p className="text-xs text-gray-500">Total Logins</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 p-4 text-center">
                      <p className="text-2xl font-bold text-amber-400">{loginStats?.sessionExpiries || 0}</p>
                      <p className="text-xs text-gray-500">Expired Sessions</p>
                    </div>
                    <div className="rounded-xl bg-slate-800 p-4 text-center">
                      <p className="text-2xl font-bold text-rose-400">{loginStats?.failedAttempts || 0}</p>
                      <p className="text-xs text-gray-500">Failed Attempts</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLoginActivity(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/20 py-3 font-medium text-violet-400 transition-colors hover:bg-violet-500/30"
                  >
                    <LogIn className="h-5 w-5" />
                    View Full Login History
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                    <Settings className="h-6 w-6 text-cyan-400" />
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Sound Effects"
                      description="Play sounds for notifications and actions"
                      value={settings.soundEffects}
                      onChange={(value) => persistSettings({ ...settings, soundEffects: value })}
                      icon={Bell}
                    />
                    <SettingToggle
                      label="Auto-Save Progress"
                      description="Automatically save investigation progress"
                      value={settings.autoSave}
                      onChange={(value) => persistSettings({ ...settings, autoSave: value })}
                      icon={Save}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-white">
                    <Bell className="h-6 w-6 text-cyan-400" />
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Push Notifications"
                      description="Receive browser push notifications"
                      value={settings.pushNotifications}
                      onChange={(value) => persistSettings({ ...settings, pushNotifications: value })}
                      icon={Bell}
                    />
                    <SettingToggle
                      label="Email Alerts"
                      description="Get important updates via email"
                      value={settings.emailAlerts}
                      onChange={(value) => persistSettings({ ...settings, emailAlerts: value })}
                      icon={Mail}
                    />
                    <SettingToggle
                      label="Weekly Report"
                      description="Receive weekly activity summary"
                      value={settings.weeklyReport}
                      onChange={(value) => persistSettings({ ...settings, weeklyReport: value })}
                      icon={Activity}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <LoginActivityLog isOpen={showLoginActivity} onClose={() => setShowLoginActivity(false)} />
    </div>
  );
};

export default ProfileSettings;
