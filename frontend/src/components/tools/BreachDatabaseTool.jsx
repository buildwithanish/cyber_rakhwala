import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, X, Search, Zap, Shield, AlertTriangle, Eye, Lock,
  Skull, FileWarning, Calendar, Globe, Mail, Key, CreditCard,
  Phone, User, RefreshCw, ChevronRight, Download, ExternalLink, Copy
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useCredits } from '../../context/CreditContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import breachDatabaseService from '../../services/tools/breachDatabaseService';
import { adaptBreachResponse } from '../../utils/toolResponseAdapters';

const BreachDatabaseTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { refreshCredits } = useCredits();
  const { copy } = useClipboard();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('email');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [glitchText, setGlitchText] = useState('');
  const [scanningEffect, setScanningEffect] = useState([]);
  const [lastLookupTime, setLastLookupTime] = useState(null);
  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `breach_database_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `breach_database_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Glitch text effect
  useEffect(() => {
    if (isSearching) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      const interval = setInterval(() => {
        setGlitchText(Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isSearching]);

  // Scanning effect
  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setScanningEffect(prev => [...prev.slice(-15), Date.now()]);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setScanningEffect([]);
    }
  }, [isSearching]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    trackToolUsage('breach-database', 'search', 'start');
    setIsSearching(true);

    try {
      const settled = await Promise.allSettled([
        breachDatabaseService.search(searchQuery, searchType),
        breachDatabaseService.getStatistics()
      ]);

      const responses = {
        search: settled[0].status === 'fulfilled' ? settled[0].value : null,
        stats: settled[1].status === 'fulfilled' ? settled[1].value : null
      };

      if (!Object.values(responses).some(Boolean)) {
        throw settled.find((item) => item.status === 'rejected')?.reason || new Error('Breach search failed');
      }

      const resultData = adaptBreachResponse(searchQuery, searchType, responses);
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('breach-database', searchQuery, resultData);
      trackToolUsage('breach-database', 'search', 'success');
      await refreshCredits?.();
      toast.success(resultData.sourceNotice ? 'Breach search complete with limited data' : 'Breach search complete!');
      if (resultData.sourceNotice) {
        toast.info(resultData.sourceNotice);
      }
    } catch (error) {
      trackToolUsage('breach-database', 'search', 'error');
      toast.error(error.message || 'Breach search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'red';
      case 'High': return 'orange';
      case 'Medium': return 'amber';
      default: return 'yellow';
    }
  };

  const getExposureIcon = (type) => {
    switch (String(type || '').toLowerCase()) {
      case 'email':
        return Mail;
      case 'password':
        return Key;
      case 'phone':
        return Phone;
      case 'address':
        return User;
      case 'credit card':
        return CreditCard;
      default:
        return AlertTriangle;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950 border border-violet-500/30 shadow-[0_0_100px_rgba(139,92,246,0.2)]"
      >
        {/* Dark web aesthetic background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Matrix-like falling characters */}
          {scanningEffect.map((effect, i) => (
            <motion.div
              key={effect}
              initial={{ top: -20, opacity: 1 }}
              animate={{ top: '100%', opacity: 0 }}
              transition={{ duration: 2, ease: 'linear' }}
              className="absolute text-violet-500/30 font-mono text-sm"
              style={{ left: `${(i * 7) % 100}%` }}
            >
              {glitchText.slice(0, 10)}
            </motion.div>
          ))}

          {/* Scanlines effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.1) 2px, rgba(139,92,246,0.1) 4px)',
          }} />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[120px]" />

          {/* Warning stripes */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-violet-500/20 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/50"
                  animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.5)', '0 0 40px rgba(139,92,246,0.8)', '0 0 20px rgba(139,92,246,0.5)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Skull className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Breach Database</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-red-500/30 text-red-300 rounded-full border border-red-500/50 animate-pulse hidden sm:inline">DARK WEB</span>
                </h2>
                <p className="text-xs sm:text-sm text-violet-300/70 flex items-center gap-1 sm:gap-2">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Search leaked credentials</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                <span className="hidden sm:inline text-xs text-violet-200">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-red-400" />
                <span className="text-xs text-red-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-red-400" />
                <span className="text-xs text-red-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">10</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
          {/* Search Section */}
          <div className="mb-6 p-6 rounded-2xl bg-slate-900/80 border border-violet-500/20 backdrop-blur-sm">
            {/* Search Type Toggle */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'username', label: 'Username', icon: User },
                { id: 'phone', label: 'Phone', icon: Phone },
                { id: 'domain', label: 'Domain', icon: Globe },
              ].map(type => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSearchType(type.id)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                    searchType === type.id
                      ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-violet-500/20'
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={
                    searchType === 'email' ? 'target@example.com' :
                    searchType === 'username' ? 'username123' :
                    searchType === 'phone' ? '+1234567890' :
                    'example.com'
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-violet-500/30 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-violet-400 focus:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all font-mono"
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/40"
              >
                {isSearching ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Database className="w-5 h-5" />
                )}
                <span>{isSearching ? 'Searching...' : 'Search Breaches'}</span>
              </motion.button>
            </div>

            {/* Searching Animation */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="text-center mb-4">
                  <motion.div
                    className="inline-block font-mono text-violet-400 text-xl"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    [{glitchText}]
                  </motion.div>
                </div>
                <div className="flex items-center justify-center gap-8">
                  {['Dark Web', 'Paste Sites', 'Leaked DBs', 'Forums'].map((source, i) => (
                    <motion.div
                      key={source}
                      className="text-center"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                        {[Skull, FileWarning, Database, Globe][i] && 
                          <motion.div className="text-violet-400">
                            {[<Skull className="w-5 h-5" />, <FileWarning className="w-5 h-5" />, <Database className="w-5 h-5" />, <Globe className="w-5 h-5" />][i]}
                          </motion.div>
                        }
                      </div>
                      <div className="text-xs text-violet-300/70">{source}</div>
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
                {/* Overview */}
                <div className={`mb-6 p-6 rounded-2xl border ${
                  results.riskLevel === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                  results.riskLevel === 'High' ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        results.riskLevel === 'Critical' ? 'bg-red-500/20' :
                        results.riskLevel === 'High' ? 'bg-orange-500/20' : 'bg-amber-500/20'
                      }`}>
                        <AlertTriangle className={`w-10 h-10 ${
                          results.riskLevel === 'Critical' ? 'text-red-400' :
                          results.riskLevel === 'High' ? 'text-orange-400' : 'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          results.riskLevel === 'Critical' ? 'text-red-400' :
                          results.riskLevel === 'High' ? 'text-orange-400' : 'text-amber-400'
                        }`}>
                          Found in {results.totalBreaches} Data Breaches
                        </div>
                        <div className="text-gray-400 font-mono">{results.query}</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center px-6 py-3 rounded-xl bg-slate-800/50 border border-violet-500/20">
                        <div className="text-2xl font-bold text-violet-400">{results.darkWebMentions}</div>
                        <div className="text-xs text-gray-400">Dark Web Mentions</div>
                      </div>
                      <div className="text-center px-6 py-3 rounded-xl bg-slate-800/50 border border-violet-500/20">
                        <div className="text-2xl font-bold text-purple-400">{results.pastebin}</div>
                        <div className="text-xs text-gray-400">Paste Sites</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exposed Data Types */}
                <div className="mb-6 p-6 rounded-2xl bg-slate-900/60 border border-violet-500/20">
                  <h3 className="text-violet-300 font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Exposed Data Types
                  </h3>
                  <div className="grid grid-cols-5 gap-4">
                    {results.exposedData.map((data, i) => {
                      const ExposureIcon = getExposureIcon(data.type);

                      return (
                        <motion.div
                          key={data.type}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className={`p-4 rounded-xl text-center ${
                            data.count > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/50 border border-slate-700/50'
                          }`}
                        >
                          <ExposureIcon className={`w-6 h-6 mx-auto mb-2 ${data.count > 0 ? 'text-red-400' : 'text-gray-500'}`} />
                          <div className="text-2xl font-bold text-white">{data.count}</div>
                          <div className="text-xs text-gray-400">{data.type}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Breach List */}
                <div className="mb-6 p-6 rounded-2xl bg-slate-900/60 border border-violet-500/20">
                  <h3 className="text-violet-300 font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Breach Details
                  </h3>
                  <div className="space-y-4">
                    {results.breaches.map((breach, i) => (
                      <motion.div
                        key={breach.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-5 rounded-xl bg-slate-800/50 border border-${getSeverityColor(breach.severity)}-500/30`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-${getSeverityColor(breach.severity)}-500/20 flex items-center justify-center`}>
                              <Skull className={`w-5 h-5 text-${getSeverityColor(breach.severity)}-400`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-lg">{breach.name}</span>
                                {breach.verified && (
                                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">Verified</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {breach.date}
                                </span>
                                <span>{breach.records} records</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium bg-${getSeverityColor(breach.severity)}-500/20 text-${getSeverityColor(breach.severity)}-400`}>
                            {breach.severity}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{breach.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {breach.dataTypes.map(type => (
                            <span key={type} className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-xs border border-violet-500/30">
                              {type}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                  <h3 className="text-emerald-300 font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Recommendations
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {results.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50"
                      >
                        <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{rec}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isSearching && (
            <div className="text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Skull className="w-24 h-24 text-violet-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Search the breach database</h3>
              <p className="text-gray-500">Check if your data has been exposed in known breaches</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BreachDatabaseTool;
