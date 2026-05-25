import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, Search, MapPin, Shield, Clock, Activity, Zap, Download,
  ChevronRight, AlertTriangle, CheckCircle, Server, Wifi, Lock,
  Radio, Crosshair, Navigation, Eye, Target, Waves, Copy, FolderPlus,
  History, FileText, RefreshCw
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useCredits } from '../../context/CreditContext';
import { useSearchHistory } from '../../context/SearchHistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import ExportReportModal from '../common/ExportReportModal';
import SaveToCaseModal from '../common/SaveToCaseModal';
import SearchHistoryPanel from '../common/SearchHistoryPanel';
import ipIntelligenceService from '../../services/tools/ipIntelligenceService';
import { adaptIpIntelligenceResponse } from '../../utils/toolResponseAdapters';

const IPIntelligenceTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { refreshCredits } = useCredits();
  const { addSearch, getToolHistory } = useSearchHistory();
  const { copy, copied } = useClipboard();
  
  const [ipAddress, setIpAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [scanProgress, setScanProgress] = useState(0);
  const [pulseRings, setPulseRings] = useState([]);
  const [scanLine, setScanLine] = useState(0);
  const [orbitAngle, setOrbitAngle] = useState(0);
  const [particles, setParticles] = useState([]);
  
  // New state for modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveToCaseModal, setShowSaveToCaseModal] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [lastLookupTime, setLastLookupTime] = useState(null);

  // Get recent searches for this tool
  const recentSearches = getToolHistory('ip-trace');

  // Handle new search - reset for new entry
  const handleRefresh = () => {
    setIpAddress('');
    setResults(null);
    setScanProgress(0);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  const handleExportJSON = () => {
    if (!results) {
      toast.error('No results to export');
      return;
    }
    const ok = exportToJSON(results, `ip_intelligence_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) {
      toast.error('No results to export');
      return;
    }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `ip_intelligence_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Handle selecting from search history
  const handleSelectFromHistory = (search) => {
    setIpAddress(search.query);
    setShowSearchHistory(false);
  };

  // Orbiting satellites animation
  useEffect(() => {
    const interval = setInterval(() => {
      setOrbitAngle(prev => (prev + 0.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Particle generation
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(newParticles);
  }, []);

  // Radar sweep during analysis
  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setScanLine(prev => (prev + 4) % 360);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!ipAddress.trim()) {
      toast.error('Please enter an IP address');
      return;
    }
    
    trackToolUsage('ip-intelligence', 'lookup', 'start');
    setIsAnalyzing(true);
    setScanProgress(0);
    setPulseRings([]);

    // Emit pulse rings
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 250));
      setPulseRings(prev => [...prev, { id: Date.now() + i }]);
    }

    const interval = setInterval(() => {
      setScanProgress(prev => Math.min(100, prev + Math.random() * 8 + 2));
    }, 100);

    try {
      const settled = await Promise.allSettled([
        ipIntelligenceService.lookup(ipAddress),
        ipIntelligenceService.checkReputation(ipAddress),
        ipIntelligenceService.getWhois(ipAddress),
        ipIntelligenceService.getASN(ipAddress),
        ipIntelligenceService.getThreatIntel(ipAddress),
        ipIntelligenceService.scanPorts(ipAddress)
      ]);

      const responses = {
        lookup: settled[0].status === 'fulfilled' ? settled[0].value : null,
        reputation: settled[1].status === 'fulfilled' ? settled[1].value : null,
        whois: settled[2].status === 'fulfilled' ? settled[2].value : null,
        asn: settled[3].status === 'fulfilled' ? settled[3].value : null,
        threatIntel: settled[4].status === 'fulfilled' ? settled[4].value : null,
        ports: settled[5].status === 'fulfilled' ? settled[5].value : null
      };

      if (!Object.values(responses).some(Boolean)) {
        throw settled.find((item) => item.status === 'rejected')?.reason || new Error('IP analysis failed');
      }

      clearInterval(interval);
      setScanProgress(100);

      const resultData = adaptIpIntelligenceResponse(ipAddress, responses);
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('ip-intelligence', ipAddress, resultData);
      addSearch('ip-trace', ipAddress, resultData);
      trackToolUsage('ip-intelligence', 'lookup', 'success');
      await refreshCredits?.();
      toast.success(resultData.sourceNotice ? 'IP analysis complete with limited data' : 'IP analysis complete!');
      if (resultData.sourceNotice) {
        toast.info(resultData.sourceNotice);
      }
    } catch (error) {
      clearInterval(interval);
      setScanProgress(0);
      trackToolUsage('ip-intelligence', 'lookup', 'error');
      toast.error(error.message || 'IP analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const threatColors = {
    low: { bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/40', text: 'text-emerald-400' },
    medium: { bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/40', text: 'text-amber-400' },
    high: { bg: 'from-red-500/20 to-red-600/5', border: 'border-red-500/40', text: 'text-red-400' },
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'history', label: 'Timeline', icon: Clock },
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
        initial={{ scale: 0.8, rotateY: -10, opacity: 0 }}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotateY: 10, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-500/30 shadow-[0_0_80px_rgba(34,211,238,0.2)]"
      >
        {/* Animated cosmic background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          
          {/* Floating particles */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-cyan-400"
              style={{ width: p.size, height: p.size, left: `${p.x}%`, opacity: p.opacity }}
              animate={{ y: [0, -500], opacity: [p.opacity, 0] }}
              transition={{ duration: 10 / p.speed, repeat: Infinity, delay: p.id * 0.1 }}
            />
          ))}
          
          {/* Radial gradients */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-cyan-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40"
                  animate={{ boxShadow: ['0 0 20px rgba(34,211,238,0.4)', '0 0 40px rgba(34,211,238,0.6)', '0 0 20px rgba(34,211,238,0.4)'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Orbiting dots - hidden on mobile */}
                <div className="hidden sm:block">
                  {[0, 120, 240].map((offset, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `rotate(${orbitAngle + offset}deg) translateX(32px) translateY(-50%)`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="truncate">IP Intelligence</span>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"
                  />
                </h2>
                <p className="text-xs sm:text-sm text-cyan-300/70 flex items-center gap-1 sm:gap-2">
                  <Radio className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Global network reconnaissance & threat analysis</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              {/* Search History Button - hidden on mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowSearchHistory(true)}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 transition-all items-center gap-2 relative"
              >
                <History className="w-5 h-5 text-violet-400" />
                <span className="text-xs text-violet-200">History</span>
                {recentSearches.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">
                    {recentSearches.length > 9 ? '9+' : recentSearches.length}
                  </span>
                )}
              </motion.button>
              
              {/* Export Report Button - hidden on mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={() => setShowExportModal(true)}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-emerald-200">Export</span>
              </motion.button>
              
              {/* Save to Case Button - hidden on mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={() => setShowSaveToCaseModal(true)}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-amber-200">Save to Case</span>
              </motion.button>
              
              {/* New Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                <span className="hidden sm:inline text-xs text-cyan-200">New Search</span>
              </motion.button>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">10</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(92vh-100px)]">
          {/* Globe & Input Section */}
          <div className="grid lg:grid-cols-5 gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* 3D Globe Visualization */}
            <div className="lg:col-span-2 relative h-72 rounded-2xl bg-slate-900/60 border border-cyan-500/20 overflow-hidden">
              {/* Globe wireframe */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-52 h-52">
                  {/* Latitude circles */}
                  {[-60, -30, 0, 30, 60].map((lat, i) => (
                    <motion.div
                      key={lat}
                      className="absolute inset-0 border border-cyan-500/20 rounded-full"
                      style={{
                        transform: `rotateX(75deg) scale(${Math.cos(lat * Math.PI / 180)})`,
                        top: `${50 + Math.sin(lat * Math.PI / 180) * 50}%`,
                      }}
                    />
                  ))}
                  {/* Longitude lines */}
                  {[0, 30, 60, 90, 120, 150].map(lng => (
                    <motion.div
                      key={lng}
                      className="absolute inset-0 border border-cyan-500/15 rounded-full"
                      animate={{ rotateY: orbitAngle }}
                      style={{ transform: `rotateY(${lng}deg)` }}
                    />
                  ))}
                  {/* Center glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent" />
                  
                  {/* Radar sweep during scan */}
                  {isAnalyzing && (
                    <motion.div
                      className="absolute top-1/2 left-1/2 w-28 h-1 origin-left"
                      style={{
                        background: 'linear-gradient(90deg, rgba(34,211,238,0.8), transparent)',
                        transform: `rotate(${scanLine}deg)`,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Pulse rings */}
              <AnimatePresence>
                {pulseRings.map(ring => (
                  <motion.div
                    key={ring.id}
                    className="absolute top-1/2 left-1/2 rounded-full border-2 border-cyan-400"
                    initial={{ width: 0, height: 0, x: '-50%', y: '-50%', opacity: 1 }}
                    animate={{ width: 300, height: 300, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                  />
                ))}
              </AnimatePresence>

              {/* Corner labels */}
              <div className="absolute top-3 left-3 flex items-center gap-2 text-xs text-cyan-300/60">
                <Crosshair className="w-3 h-3" /> GLOBAL SCAN
              </div>
              <div className="absolute bottom-3 right-3 text-xs text-cyan-300/60 font-mono">
                LAT: 37.77° LON: -122.42°
              </div>
            </div>

            {/* Input Panel */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-sm">
                <label className="text-cyan-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  Target IP Address
                </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 relative group">
                    <Globe className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={e => setIpAddress(e.target.value)}
                      placeholder="e.g., 1.1.1.1 or 8.8.8.8"
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-cyan-500/30 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all font-mono"
                      onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(34,211,238,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !ipAddress.trim()}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    {isAnalyzing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Waves className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span>{isAnalyzing ? 'Scanning...' : 'Analyze'}</span>
                  </motion.button>
                </div>

                {/* Progress visualization */}
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <div className="flex justify-between text-xs text-cyan-300/70 mb-2">
                      <span className="flex items-center gap-1">
                        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>●</motion.span>
                        Scanning global network...
                      </span>
                      <span className="font-mono">{Math.min(100, Math.round(scanProgress))}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden p-0.5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 shadow-[0_0_10px_#22d3ee]"
                        style={{ width: `${scanProgress}%` }}
                        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      {['DNS', 'Geolocation', 'ASN', 'Threat Intel', 'History'].map((step, i) => (
                        <motion.span
                          key={step}
                          initial={{ opacity: 0.3, scale: 0.9 }}
                          animate={{ opacity: scanProgress > i * 20 ? 1 : 0.3, scale: scanProgress > i * 20 ? 1 : 0.9 }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            scanProgress > i * 20 ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40' : 'bg-slate-800/50 text-gray-500'
                          }`}
                        >
                          {step}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1.5 rounded-2xl bg-slate-900/50 border border-cyan-500/20 w-fit backdrop-blur-sm">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="grid md:grid-cols-3 gap-5"
                    >
                      {/* Location Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/20 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-cyan-400" />
                            </div>
                            <span className="text-white font-semibold text-lg">Location</span>
                          </div>
                          <div className="text-5xl mb-3">{results.location.flag}</div>
                          <div className="text-2xl font-bold text-white">{results.location.city}</div>
                          <div className="text-cyan-300/70">{results.location.region}, {results.location.country}</div>
                          <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400 font-mono">
                            {results.location.lat.toFixed(4)}°N, {Math.abs(results.location.lng).toFixed(4)}°W
                          </div>
                        </div>
                      </motion.div>

                      {/* ISP Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-500/20 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <Server className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="text-white font-semibold text-lg">ISP Details</span>
                          </div>
                          <div className="text-xl font-bold text-white mb-1">{results.isp.name}</div>
                          <div className="text-blue-300/70">{results.isp.org}</div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-sm font-mono border border-blue-500/30">
                              {results.isp.asn}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-slate-700/50 text-gray-300 text-sm capitalize">
                              {results.isp.type}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Threat Score */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`p-6 rounded-2xl bg-gradient-to-br ${threatColors[results.security.threatLevel].bg} border ${threatColors[results.security.threatLevel].border} relative overflow-hidden`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                            <Shield className={`w-6 h-6 ${threatColors[results.security.threatLevel].text}`} />
                          </div>
                          <span className="text-white font-semibold text-lg">Threat Level</span>
                        </div>
                        <div className="flex items-end gap-3">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                            className={`text-6xl font-bold ${threatColors[results.security.threatLevel].text}`}
                          >
                            {results.security.reputation}
                          </motion.div>
                          <div className="mb-2">
                            <div className={`text-sm font-bold uppercase ${threatColors[results.security.threatLevel].text}`}>
                              {results.security.threatLevel} risk
                            </div>
                            <div className="text-xs text-gray-400">Reputation score</div>
                          </div>
                        </div>
                        <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${results.security.reputation}%` }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            className={`h-full ${
                              results.security.reputation > 80 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                              results.security.reputation > 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                              'bg-gradient-to-r from-red-400 to-rose-500'
                            }`}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="grid md:grid-cols-2 gap-6"
                    >
                      <div className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20">
                        <h4 className="text-white font-semibold mb-5 flex items-center gap-2 text-lg">
                          <Shield className="w-5 h-5 text-cyan-400" />
                          Security Indicators
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { label: 'VPN', value: results.security.vpn, icon: Lock },
                            { label: 'Proxy', value: results.security.proxy, icon: Server },
                            { label: 'Tor Exit', value: results.security.tor, icon: Eye },
                            { label: 'Datacenter', value: results.security.datacenter, icon: Server },
                            { label: 'Blacklisted', value: results.security.blacklisted, icon: AlertTriangle },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              whileHover={{ scale: 1.03 }}
                              className={`p-4 rounded-xl border ${
                                item.value
                                  ? 'bg-red-500/10 border-red-500/30'
                                  : 'bg-emerald-500/10 border-emerald-500/30'
                              }`}
                            >
                              <item.icon className={`w-5 h-5 mb-2 ${item.value ? 'text-red-400' : 'text-emerald-400'}`} />
                              <div className="text-sm text-gray-300">{item.label}</div>
                              <div className={`text-lg font-bold ${item.value ? 'text-red-400' : 'text-emerald-400'}`}>
                                {item.value ? 'Detected' : 'Clean'}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20">
                        <h4 className="text-white font-semibold mb-5 flex items-center gap-2 text-lg">
                          <Crosshair className="w-5 h-5 text-cyan-400" />
                          Geolocation Accuracy
                        </h4>
                        <div className="space-y-4">
                          {[
                            { label: 'Accuracy Radius', value: '~5km' },
                            { label: 'Timezone', value: results.location.timezone },
                            { label: 'Confidence', value: '95%' },
                          ].map((item, i) => (
                            <div key={item.label} className="p-4 rounded-xl bg-slate-800/50 flex justify-between items-center">
                              <span className="text-gray-400">{item.label}</span>
                              <span className="text-cyan-300 font-semibold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'network' && (
                    <motion.div
                      key="network"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20"
                    >
                      <h4 className="text-white font-semibold mb-5 flex items-center gap-2 text-lg">
                        <Wifi className="w-5 h-5 text-cyan-400" />
                        Network Information
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-slate-800/50">
                          <div className="text-gray-400 text-sm mb-1">Hostname</div>
                          <div className="text-cyan-300 font-mono text-lg">{results.network.hostname}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-800/50">
                          <div className="text-gray-400 text-sm mb-1">SSL/TLS</div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-300 font-semibold">Secured</span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-6">
                        <div className="text-gray-400 text-sm mb-3">Open Ports</div>
                        <div className="flex flex-wrap gap-2">
                          {results.network.ports.map(port => (
                            <motion.span
                              key={port}
                              whileHover={{ scale: 1.1 }}
                              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30"
                            >
                              :{port}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-3">Protocols</div>
                        <div className="flex flex-wrap gap-2">
                          {results.network.protocols.map(proto => (
                            <span key={proto} className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {proto}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/20"
                    >
                      <h4 className="text-white font-semibold mb-5 flex items-center gap-2 text-lg">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        Activity Timeline
                      </h4>
                      <div className="relative pl-8">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-transparent" />
                        {results.history.map((event, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.15 }}
                            className="relative mb-6 last:mb-0"
                          >
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              className={`absolute -left-5 w-4 h-4 rounded-full border-2 ${
                                event.type === 'security' ? 'bg-cyan-400 border-cyan-300' :
                                event.type === 'change' ? 'bg-amber-400 border-amber-300' :
                                'bg-gray-400 border-gray-300'
                              }`}
                            />
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-cyan-500/30 transition-colors">
                              <div className="text-xs text-cyan-300/70 mb-1 font-mono">{event.date}</div>
                              <div className="text-white">{event.event}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isAnalyzing && (
            <div className="text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotateY: [0, 180, 360] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-block"
              >
                <Globe className="w-24 h-24 text-cyan-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter an IP address to begin</h3>
              <p className="text-gray-500">Get geolocation, ISP details, and comprehensive threat intelligence</p>
              
              {/* Recent Searches Quick Access */}
              {recentSearches.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm text-gray-500 mb-3">Recent searches:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {recentSearches.slice(0, 5).map((search) => (
                      <motion.button
                        key={search.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIpAddress(search.query)}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-sm text-cyan-300 transition-all"
                      >
                        {search.query}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={results}
        title={`IP Analysis - ${ipAddress}`}
        toolName="IP Intelligence"
      />
      
      {/* Save to Case Modal */}
      <SaveToCaseModal
        isOpen={showSaveToCaseModal}
        onClose={() => setShowSaveToCaseModal(false)}
        data={results}
        toolName="IP Intelligence"
        query={ipAddress}
      />
      
      {/* Search History Panel */}
      <SearchHistoryPanel
        isOpen={showSearchHistory}
        onClose={() => setShowSearchHistory(false)}
        onSelectSearch={handleSelectFromHistory}
        activeToolId="ip-trace"
      />
    </motion.div>
  );
};

export default IPIntelligenceTool;
