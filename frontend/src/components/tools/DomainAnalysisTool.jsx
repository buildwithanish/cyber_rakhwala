import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Globe, Shield, Clock, Activity, Zap, Server,
  Link2, ExternalLink, AlertTriangle, CheckCircle, Eye, Lock,
  FileText, Calendar, ChevronDown, Copy, Layers, Code, Database,
  Download, RefreshCw
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useCredits } from '../../context/CreditContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import domainAnalysisService from '../../services/tools/domainAnalysisService';
import { adaptDomainAnalysisResponse } from '../../utils/toolResponseAdapters';

const DomainAnalysisTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { refreshCredits } = useCredits();
  const { copy } = useClipboard();
  
  const [domain, setDomain] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedSection, setExpandedSection] = useState('whois');
  const [hexagonAngle, setHexagonAngle] = useState(0);
  const [dnaStrands, setDnaStrands] = useState([]);
  const [lastLookupTime, setLastLookupTime] = useState(null);

  // Handle new search - reset for new entry
  const handleRefresh = () => {
    setDomain('');
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  // Rotating hexagon animation
  useEffect(() => {
    const interval = setInterval(() => {
      setHexagonAngle(prev => (prev + 0.3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // DNA strand particles
  useEffect(() => {
    const strands = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      offset: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
    }));
    setDnaStrands(strands);
  }, []);

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    
    trackToolUsage('domain-analysis', 'analyze', 'start');
    setIsAnalyzing(true);

    try {
      const settled = await Promise.allSettled([
        domainAnalysisService.getWhois(domain),
        domainAnalysisService.getSubdomains(domain),
        domainAnalysisService.checkSSL(domain),
        domainAnalysisService.checkReputation(domain),
        domainAnalysisService.getTechStack(domain)
      ]);

      const responses = {
        whois: settled[0].status === 'fulfilled' ? settled[0].value : null,
        subdomains: settled[1].status === 'fulfilled' ? settled[1].value : null,
        ssl: settled[2].status === 'fulfilled' ? settled[2].value : null,
        reputation: settled[3].status === 'fulfilled' ? settled[3].value : null,
        techStack: settled[4].status === 'fulfilled' ? settled[4].value : null
      };

      if (!Object.values(responses).some(Boolean)) {
        throw settled.find((item) => item.status === 'rejected')?.reason || new Error('Domain analysis failed');
      }

      const resultData = adaptDomainAnalysisResponse(domain, responses);
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('domain-analysis', domain, resultData);
      trackToolUsage('domain-analysis', 'analyze', 'success');
      await refreshCredits?.();
      toast.success(resultData.sourceNotice ? 'Domain analysis complete with limited data' : 'Domain analysis complete!');
      if (resultData.sourceNotice) {
        toast.info(resultData.sourceNotice);
      }
    } catch (error) {
      trackToolUsage('domain-analysis', 'analyze', 'error');
      toast.error(error.message || 'Domain analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `domain_analysis_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `domain_analysis_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  const sections = [
    { id: 'whois', title: 'WHOIS Data', icon: FileText },
    { id: 'dns', title: 'DNS Records', icon: Server },
    { id: 'ssl', title: 'SSL Certificate', icon: Lock },
    { id: 'tech', title: 'Technologies', icon: Code },
    { id: 'security', title: 'Security', icon: Shield },
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
        initial={{ scale: 0.8, rotateX: 10, opacity: 0 }}
        animate={{ scale: 1, rotateX: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotateX: -10, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 border border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.2)]"
      >
        {/* Animated DNA helix background */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-10">
            {dnaStrands.map((strand, i) => {
              const y = (Date.now() * strand.speed + strand.offset) % (window.innerHeight + 200) - 100;
              return (
                <g key={strand.id}>
                  <circle
                    cx={`${strand.x}%`}
                    cy={`${(y / window.innerHeight) * 100}%`}
                    r="3"
                    fill="#a855f7"
                  />
                  <circle
                    cx={`${strand.x + 5}%`}
                    cy={`${((y + 20) / window.innerHeight) * 100}%`}
                    r="2"
                    fill="#ec4899"
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Hexagon grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          
          {/* Radial glows */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-purple-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/40"
                  style={{ transform: `rotate(${hexagonAngle}deg)` }}
                >
                  <Search className="w-5 h-5 sm:w-7 sm:h-7 text-white" style={{ transform: `rotate(-${hexagonAngle}deg)` }} />
                </motion.div>
                {/* Orbiting particles - hidden on mobile */}
                <div className="hidden sm:block">
                  {[0, 90, 180, 270].map((angle, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        background: i % 2 === 0 ? '#a855f7' : '#ec4899',
                        left: '50%',
                        top: '50%',
                        transform: `rotate(${hexagonAngle * 2 + angle}deg) translateX(30px)`,
                        boxShadow: `0 0 10px ${i % 2 === 0 ? '#a855f7' : '#ec4899'}`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                  <span className="truncate">Domain</span>
                  <span className="hidden sm:inline">Analysis</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">OSINT</span>
                </h2>
                <p className="text-xs sm:text-sm text-purple-300/70 flex items-center gap-1 sm:gap-2">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">WHOIS, DNS, SSL & technology detection</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <span className="hidden sm:inline text-xs text-purple-200">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-green-400" />
                <span className="text-xs text-green-200">JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-green-400" />
                <span className="text-xs text-green-200">CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">8</span>
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
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-sm">
            <label className="text-purple-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
              <Link2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Target Domain
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative group">
                <Globe className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g., example.com"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-slate-800/80 border-2 border-purple-500/30 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(168,85,247,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || !domain.trim()}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/30 relative overflow-hidden"
              >
                {isAnalyzing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Layers className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
              </motion.button>
            </div>

            {/* Analysis progress */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 sm:mt-5"
              >
                <div className="grid grid-cols-5 gap-1 sm:gap-3">
                  {['WHOIS', 'DNS', 'SSL', 'Tech', 'Security'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.4 }}
                      className="text-center"
                    >
                      <motion.div
                        className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1], borderColor: ['rgba(168,85,247,0.4)', 'rgba(168,85,247,0.8)', 'rgba(168,85,247,0.4)'] }}
                        transition={{ duration: 0.5, delay: i * 0.4 }}
                      >
                        {[FileText, Server, Lock, Code, Shield][i] && 
                          <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                          >
                            {[<FileText className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />, <Server className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />, <Lock className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />, <Code className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />, <Shield className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400" />][i]}
                          </motion.div>
                        }
                      </motion.div>
                      <div className="text-[10px] sm:text-xs text-purple-300/70">{step}</div>
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 sm:space-y-4"
              >
                {/* Domain Overview Card */}
                <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="text-xs sm:text-sm text-purple-300/70 mb-1">Domain</div>
                      <div className="text-xl sm:text-3xl font-bold text-white font-mono break-all">{results.domain}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4">
                      <div className="text-center px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-800/50 border border-purple-500/20">
                        <div className="text-sm sm:text-2xl font-bold text-emerald-400">Active</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Status</div>
                      </div>
                      <div className="text-center px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-800/50 border border-purple-500/20">
                        <div className="text-sm sm:text-2xl font-bold text-purple-400 truncate">{results.age}</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Age</div>
                      </div>
                      <div className="text-center px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-800/50 border border-purple-500/20">
                        <div className="text-sm sm:text-2xl font-bold text-cyan-400">{results.security.reputation}%</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Rep.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordion Sections */}
                {sections.map((section, idx) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="rounded-xl sm:rounded-2xl bg-slate-900/60 border border-purple-500/20 overflow-hidden"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(168,85,247,0.1)' }}
                      onClick={() => setExpandedSection(expandedSection === section.id ? '' : section.id)}
                      className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <span className="text-white font-semibold text-sm sm:text-lg">{section.title}</span>
                      </div>
                      <motion.div animate={{ rotate: expandedSection === section.id ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {expandedSection === section.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-purple-500/20"
                        >
                          <div className="p-3 sm:p-6">
                            {section.id === 'whois' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-2 sm:space-y-3">
                                  {[
                                    { label: 'Registrar', value: results.registrar },
                                    { label: 'Created', value: results.created },
                                    { label: 'Expires', value: results.expires },
                                    { label: 'Updated', value: results.updated },
                                  ].map(item => (
                                    <div key={item.label} className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-800/50 flex justify-between items-center">
                                      <span className="text-gray-400 text-xs sm:text-sm">{item.label}</span>
                                      <span className="text-white font-medium text-xs sm:text-sm truncate ml-2">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                  {Object.entries(results.whois).map(([key, value]) => (
                                    <div key={key} className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-800/50 flex justify-between items-center">
                                      <span className="text-gray-400 capitalize text-xs sm:text-sm">{key}</span>
                                      <span className="text-purple-300 text-xs sm:text-sm truncate ml-2">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {section.id === 'dns' && (
                              <div className="space-y-3 sm:space-y-4">
                                {Object.entries(results.dns).map(([type, records]) => (
                                  <div key={type} className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-800/50">
                                    <div className="text-purple-400 font-mono text-xs sm:text-sm mb-2">{type.toUpperCase()} Records</div>
                                    <div className="space-y-2">
                                      {records.map((record, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 gap-2">
                                          <code className="text-white text-xs sm:text-sm break-all flex-1">{record}</code>
                                          <button className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {section.id === 'ssl' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="p-3 sm:p-5 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                                    <div>
                                      <div className="text-emerald-400 font-bold text-sm sm:text-lg">Valid Certificate</div>
                                      <div className="text-gray-400 text-xs sm:text-sm">Grade: {results.ssl.grade}</div>
                                    </div>
                                  </div>
                                  <div className="space-y-2 text-xs sm:text-sm">
                                    <div className="flex justify-between gap-2">
                                      <span className="text-gray-400">Issuer</span>
                                      <span className="text-white text-right truncate">{results.ssl.issuer}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Protocol</span>
                                      <span className="text-emerald-300">{results.ssl.protocol}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Expires</span>
                                      <span className="text-white">{results.ssl.expires}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3 sm:p-5 rounded-lg sm:rounded-xl bg-slate-800/50">
                                  <div className="text-gray-400 text-xs sm:text-sm mb-2">Cipher Suite</div>
                                  <code className="text-purple-300 text-xs sm:text-sm break-all">{results.ssl.cipher}</code>
                                </div>
                              </div>
                            )}

                            {section.id === 'tech' && (
                              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                                {results.technologies.map((tech, i) => (
                                  <motion.div
                                    key={tech.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="p-2 sm:p-4 rounded-lg sm:rounded-xl bg-slate-800/50 border border-purple-500/20"
                                  >
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                      <span className="text-xl sm:text-3xl">{tech.icon}</span>
                                      <div className="min-w-0">
                                        <div className="text-white font-semibold text-xs sm:text-base truncate">{tech.name}</div>
                                        <div className="text-[10px] sm:text-xs text-purple-300/70">{tech.category}</div>
                                      </div>
                                    </div>
                                    <div className="h-1.5 sm:h-2 rounded-full bg-slate-700 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tech.confidence}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                      />
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{tech.confidence}%</div>
                                  </motion.div>
                                ))}
                              </div>
                            )}

                            {section.id === 'security' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-2 sm:space-y-3">
                                  {[
                                    { label: 'Malware', value: results.security.malware },
                                    { label: 'Phishing', value: results.security.phishing },
                                    { label: 'Spam', value: results.security.spam },
                                  ].map(item => (
                                    <div key={item.label} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl flex items-center justify-between ${
                                      item.value ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'
                                    }`}>
                                      <span className="text-white text-sm sm:text-base">{item.label}</span>
                                      {item.value ? (
                                        <span className="flex items-center gap-1 sm:gap-2 text-red-400 text-xs sm:text-sm">
                                          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> Detected
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 sm:gap-2 text-emerald-400 text-xs sm:text-sm">
                                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Clean
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="p-3 sm:p-5 rounded-lg sm:rounded-xl bg-slate-800/50">
                                  <div className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3">Discovered Subdomains</div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {results.subdomains.map(sub => (
                                      <span key={sub} className="px-2 sm:px-3 py-1 rounded-md sm:rounded-lg bg-purple-500/20 text-purple-300 text-[10px] sm:text-sm border border-purple-500/30">
                                        {sub}.{results.domain}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isAnalyzing && (
            <div className="text-center py-10 sm:py-20">
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Globe className="w-16 h-16 sm:w-24 sm:h-24 text-purple-500/30 mx-auto mb-4 sm:mb-6" />
              </motion.div>
              <h3 className="text-lg sm:text-2xl text-gray-400 mb-2 sm:mb-3">Enter a domain to analyze</h3>
              <p className="text-sm sm:text-base text-gray-500 px-4">Get WHOIS data, DNS records, SSL info, and detect technologies</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DomainAnalysisTool;
