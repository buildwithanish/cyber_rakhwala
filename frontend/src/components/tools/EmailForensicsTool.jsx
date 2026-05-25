import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, X, Search, Zap, Shield, Globe, Server, User, AlertTriangle,
  CheckCircle, Clock, RefreshCw, AtSign, Hash, Link2, Eye, Database,
  FileWarning, Inbox, Send, Archive, Lock, Unlock, Copy
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const EmailForensicsTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [email, setEmail] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('validation');
  const [scanProgress, setScanProgress] = useState(0);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [lastLookupTime, setLastLookupTime] = useState(null);
  const canvasRef = useRef(null);

  // Handle new search - reset for new entry
  const handleRefresh = () => {
    setEmail('');
    setResults(null);
    setEnvelopeOpen(false);
    setScanProgress(0);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `email_forensics_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `email_forensics_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Animated mail particles background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.y += p.speedY;
        p.x += p.speedX;
        
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleAnalyze = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    trackToolUsage('email-forensics', 'analyze', 'start');
    setIsAnalyzing(true);
    setEnvelopeOpen(false);
    setScanProgress(0);
    onConsume?.(6);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => Math.min(prev + 2, 95));
    }, 50);

    setTimeout(() => {
      clearInterval(progressInterval);
      setScanProgress(100);
      setEnvelopeOpen(true);
      const resultData = {
        email: email,
        validation: {
          valid: true,
          format: true,
          mxRecords: true,
          smtp: true,
          disposable: false,
          role: false,
          freeProvider: true,
          score: 92,
        },
        domain: {
          name: email.split('@')[1] || 'unknown',
          mxRecords: ['mx1.google.com', 'mx2.google.com', 'mx3.google.com'],
          spf: 'v=spf1 include:_spf.google.com ~all',
          dkim: 'DKIM record found',
          dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com',
        },
        reputation: {
          score: 85,
          spam: false,
          blacklisted: false,
          breached: 2,
          firstSeen: '2018-03-15',
          lastSeen: '2024-11-20',
        },
        breaches: [
          { name: 'Company X Data Leak', date: '2021-08-20', records: '2.5M', data: ['Email', 'Password Hash'] },
          { name: 'Social Platform Breach', date: '2019-05-12', records: '150M', data: ['Email', 'Username', 'Phone'] },
        ],
        socialMedia: [
          { platform: 'LinkedIn', found: true, url: '#' },
          { platform: 'Twitter', found: true, url: '#' },
          { platform: 'GitHub', found: true, url: '#' },
          { platform: 'Facebook', found: false, url: null },
        ],
      };
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('email-forensics', email, resultData);
      trackToolUsage('email-forensics', 'analyze', 'success');
      toast.success('Email analysis complete!');
      setIsAnalyzing(false);
    }, 3000);
  };

  const tabs = [
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'domain', label: 'Domain Intel', icon: Globe },
    { id: 'reputation', label: 'Reputation', icon: Shield },
    { id: 'breaches', label: 'Breaches', icon: FileWarning },
    { id: 'social', label: 'Social', icon: User },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30 shadow-[0_0_80px_rgba(52,211,153,0.15)]"
      >
        {/* Animated background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-emerald-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <motion.div
                className="relative flex-shrink-0"
                animate={{ rotateY: envelopeOpen ? 0 : [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: envelopeOpen ? 0 : Infinity, repeatDelay: 2 }}
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 overflow-hidden">
                  <motion.div
                    animate={{ rotateX: envelopeOpen ? -180 : 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {envelopeOpen ? <Inbox className="w-5 h-5 sm:w-7 sm:h-7 text-white" /> : <Mail className="w-5 h-5 sm:w-7 sm:h-7 text-white" />}
                  </motion.div>
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-400 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AtSign className="w-2 h-2 sm:w-3 sm:h-3 text-slate-900" />
                </motion.div>
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Email Forensics</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">OSINT</span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-300/70 flex items-center gap-1 sm:gap-2">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Validation, reputation & breach detection</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span className="hidden sm:inline text-xs text-emerald-200">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-emerald-200">JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-emerald-200">CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">6</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(92vh-100px)]">
          {/* Search Input */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-sm">
            <label className="text-emerald-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
              <AtSign className="w-3 h-3 sm:w-4 sm:h-4" />
              Email Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g., target@example.com"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-slate-800/80 border-2 border-emerald-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_30px_rgba(52,211,153,0.2)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(52,211,153,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || !email.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/30"
              >
                {isAnalyzing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isAnalyzing ? 'Scanning...' : 'Investigate'}</span>
              </motion.button>
            </div>

            {/* Progress Bar */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-emerald-300">Scanning email...</span>
                  <span className="text-emerald-400 font-mono">{scanProgress}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%]"
                    style={{ width: `${scanProgress}%` }}
                    animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {['Syntax', 'MX Records', 'SMTP', 'Reputation', 'Breaches'].map((step, i) => (
                    <motion.div
                      key={step}
                      className={`text-center p-2 rounded-lg ${scanProgress > i * 20 ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-800/50'}`}
                      initial={{ scale: 0.9, opacity: 0.5 }}
                      animate={{ scale: scanProgress > i * 20 ? 1 : 0.9, opacity: scanProgress > i * 20 ? 1 : 0.5 }}
                    >
                      <div className={`text-xs ${scanProgress > i * 20 ? 'text-emerald-300' : 'text-gray-500'}`}>{step}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Email Overview */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="text-sm text-emerald-300/70 mb-1">Target Email</div>
                      <div className="text-2xl font-bold text-white font-mono">{results.email}</div>
                    </div>
                    <div className="flex gap-4">
                      <div className={`px-6 py-3 rounded-xl ${results.validation.valid ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
                        <div className="flex items-center gap-2">
                          {results.validation.valid ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-red-400" />}
                          <span className={`text-lg font-bold ${results.validation.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {results.validation.valid ? 'Valid' : 'Invalid'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Email Status</div>
                      </div>
                      <div className="px-6 py-3 rounded-xl bg-slate-800/50 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400">{results.validation.score}%</div>
                        <div className="text-xs text-gray-400">Quality Score</div>
                      </div>
                      <div className="px-6 py-3 rounded-xl bg-slate-800/50 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-amber-400">{results.reputation.breached}</div>
                        <div className="text-xs text-gray-400">Breaches</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-emerald-500/20'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20"
                  >
                    {activeTab === 'validation' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h3 className="text-emerald-300 font-semibold mb-4">Validation Checks</h3>
                          {[
                            { label: 'Format Valid', value: results.validation.format, icon: Hash },
                            { label: 'MX Records', value: results.validation.mxRecords, icon: Server },
                            { label: 'SMTP Verify', value: results.validation.smtp, icon: Send },
                            { label: 'Not Disposable', value: !results.validation.disposable, icon: Archive },
                            { label: 'Not Role Email', value: !results.validation.role, icon: User },
                          ].map(item => (
                            <motion.div
                              key={item.label}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className={`p-4 rounded-xl flex items-center justify-between ${
                                item.value ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${item.value ? 'text-emerald-400' : 'text-red-400'}`} />
                                <span className="text-white">{item.label}</span>
                              </div>
                              {item.value ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-emerald-300 font-semibold mb-4">Deliverability</h3>
                          <div className="p-5 rounded-xl bg-slate-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Can Deliver</span>
                              <span className={`flex items-center gap-2 ${results.deliverability.canDeliver ? 'text-emerald-400' : 'text-red-400'}`}>
                                {results.deliverability.canDeliver ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {results.deliverability.canDeliver ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Inbox Type</span>
                              <span className="text-white">{results.deliverability.inbox}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Provider</span>
                              <span className="text-emerald-300">{results.deliverability.provider}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Catch-All</span>
                              <span className={results.deliverability.catchAll ? 'text-amber-400' : 'text-gray-500'}>
                                {results.deliverability.catchAll ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'domain' && (
                      <div className="space-y-6">
                        <div className="p-5 rounded-xl bg-slate-800/50">
                          <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-6 h-6 text-emerald-400" />
                            <span className="text-xl font-bold text-white">{results.domain.name}</span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-slate-900/50">
                              <div className="text-emerald-400 text-sm mb-2">MX Records</div>
                              {results.domain.mxRecords.map((mx, i) => (
                                <div key={i} className="text-sm text-gray-300 font-mono">{mx}</div>
                              ))}
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900/50">
                              <div className="text-emerald-400 text-sm mb-2">SPF Record</div>
                              <code className="text-xs text-gray-300 break-all">{results.domain.spf}</code>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900/50">
                              <div className="text-emerald-400 text-sm mb-2">DMARC</div>
                              <code className="text-xs text-gray-300 break-all">{results.domain.dmarc}</code>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'reputation' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                          <div className="text-center mb-6">
                            <motion.div
                              className="text-6xl font-bold text-emerald-400 mb-2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.2 }}
                            >
                              {results.reputation.score}
                            </motion.div>
                            <div className="text-gray-400">Reputation Score</div>
                          </div>
                          <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${results.reputation.score}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          {[
                            { label: 'Spam Reports', value: results.reputation.spam, bad: true },
                            { label: 'Blacklisted', value: results.reputation.blacklisted, bad: true },
                          ].map(item => (
                            <div key={item.label} className={`p-4 rounded-xl flex items-center justify-between ${
                              item.value && item.bad ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'
                            }`}>
                              <span className="text-white">{item.label}</span>
                              <span className={item.value && item.bad ? 'text-red-400' : 'text-emerald-400'}>
                                {item.value ? 'Yes' : 'No'}
                              </span>
                            </div>
                          ))}
                          <div className="p-4 rounded-xl bg-slate-800/50 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400">First Seen</span>
                              <span className="text-white">{results.reputation.firstSeen}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Last Seen</span>
                              <span className="text-white">{results.reputation.lastSeen}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'breaches' && (
                      <div>
                        {results.breaches.length > 0 ? (
                          <div className="space-y-4">
                            {results.breaches.map((breach, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 }}
                                className="p-5 rounded-xl bg-red-500/10 border border-red-500/30"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                      <FileWarning className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                      <div className="text-white font-semibold">{breach.name}</div>
                                      <div className="text-sm text-gray-400">{breach.date}</div>
                                    </div>
                                  </div>
                                  <div className="text-red-400 font-mono">{breach.records} records</div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {breach.data.map(type => (
                                    <span key={type} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm">
                                      {type}
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                            <div className="text-xl text-emerald-300">No breaches found!</div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'social' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        {results.socialMedia.map((social, i) => (
                          <motion.div
                            key={social.platform}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.03 }}
                            className={`p-5 rounded-xl flex items-center justify-between ${
                              social.found ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50 border border-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                social.found ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                              }`}>
                                <User className={`w-6 h-6 ${social.found ? 'text-emerald-400' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <div className={`font-semibold ${social.found ? 'text-white' : 'text-gray-500'}`}>
                                  {social.platform}
                                </div>
                                <div className={`text-sm ${social.found ? 'text-emerald-300' : 'text-gray-600'}`}>
                                  {social.found ? 'Profile Found' : 'Not Found'}
                                </div>
                              </div>
                            </div>
                            {social.found && (
                              <Eye className="w-5 h-5 text-emerald-400" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isAnalyzing && (
            <div className="text-center py-20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Mail className="w-24 h-24 text-emerald-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter an email to investigate</h3>
              <p className="text-gray-500">Validate, check reputation, and find data breaches</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmailForensicsTool;
