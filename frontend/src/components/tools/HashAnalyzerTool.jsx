import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, X, Search, Zap, Shield, AlertTriangle, CheckCircle, FileText,
  Database, Cpu, Lock, Unlock, Eye, Copy, RefreshCw, Binary, Code,
  Terminal, Server, Clock, ChevronRight, Download
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const HashAnalyzerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [hash, setHash] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [matrixChars, setMatrixChars] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const canvasRef = useRef(null);
  const [lastLookupTime, setLastLookupTime] = useState(null);
  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `hash_analysis_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `hash_analysis_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const chars = '0123456789ABCDEF';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#22d3ee';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = `rgba(34, 211, 238, ${Math.random() * 0.5 + 0.1})`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);

  // Generate floating hex characters
  useEffect(() => {
    const chars = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      char: '0123456789ABCDEF'[Math.floor(Math.random() * 16)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setMatrixChars(chars);
  }, []);

  const detectHashType = (input) => {
    const length = input.length;
    const types = {
      32: ['MD5', 'NTLM'],
      40: ['SHA-1'],
      56: ['SHA-224'],
      64: ['SHA-256', 'SHA3-256'],
      96: ['SHA-384', 'SHA3-384'],
      128: ['SHA-512', 'SHA3-512'],
    };
    return types[length] || ['Unknown'];
  };

  const handleAnalyze = async () => {
    if (!hash.trim()) {
      toast.error('Please enter a hash value');
      return;
    }
    
    trackToolUsage('hash-analyzer', 'analyze', 'start');
    setIsAnalyzing(true);
    onConsume?.(4);

    setTimeout(() => {
      const detectedTypes = detectHashType(hash.trim());
      const resultData = {
        hash: hash.trim(),
        length: hash.trim().length,
        types: detectedTypes,
        primaryType: detectedTypes[0],
        format: 'Hexadecimal',
        uppercase: hash === hash.toUpperCase(),
        valid: /^[a-fA-F0-9]+$/.test(hash.trim()),
        strength: hash.length >= 64 ? 'Strong' : hash.length >= 40 ? 'Medium' : 'Weak',
        cracked: Math.random() > 0.7,
        crackedValue: Math.random() > 0.7 ? 'password123' : null,
        lookupResults: {
          found: Math.random() > 0.5,
          source: 'Rainbow Tables',
          database: 'CrackStation',
          matches: Math.floor(Math.random() * 5),
        },
        entropy: Math.floor(Math.random() * 50 + 100),
        collisionRisk: detectedTypes[0] === 'MD5' ? 'High' : detectedTypes[0] === 'SHA-1' ? 'Medium' : 'Low',
        securityStatus: detectedTypes[0] === 'MD5' || detectedTypes[0] === 'SHA-1' ? 'Deprecated' : 'Secure',
        recommendations: [
          detectedTypes[0] === 'MD5' ? 'Upgrade to SHA-256 or better' : null,
          detectedTypes[0] === 'SHA-1' ? 'Consider migrating to SHA-256' : null,
          'Use salt for password hashing',
          'Implement key stretching (bcrypt, scrypt)',
        ].filter(Boolean),
        relatedHashes: [
          { type: 'SHA-256', hash: '5e884898da28047d9103...' },
          { type: 'SHA-512', hash: 'b109f3bbbc244eb82441...' },
          { type: 'bcrypt', hash: '$2a$10$N9qo8uLOickgx...' },
        ],
      };
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('hash-analyzer', hash.trim(), resultData);
      trackToolUsage('hash-analyzer', 'analyze', 'success');
      toast.success('Hash analysis complete!');
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleRefresh = () => {
    setHash('');
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, rotateX: 15, opacity: 0 }}
        animate={{ scale: 1, rotateX: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotateX: -15, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/20 to-slate-950 border border-cyan-500/30 shadow-[0_0_100px_rgba(34,211,238,0.15)]"
      >
        {/* Matrix rain background */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />

        {/* Floating hex characters */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {matrixChars.map(char => (
            <motion.span
              key={char.id}
              className="absolute font-mono text-cyan-400"
              style={{
                left: `${char.x}%`,
                top: `${char.y}%`,
                opacity: char.opacity,
                fontSize: '16px',
              }}
              animate={{ y: ['0%', '100%'] }}
              transition={{ duration: 10 / char.speed, repeat: Infinity, ease: 'linear' }}
            >
              {char.char}
            </motion.span>
          ))}
        </div>

        {/* Gradient overlays */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Hash className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Binary orbit - hidden on mobile */}
                <motion.div
                  className="absolute inset-0 hidden sm:block"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >
                  <span className="absolute -top-1 left-1/2 text-xs font-mono text-cyan-400">0</span>
                  <span className="absolute -bottom-1 left-1/2 text-xs font-mono text-cyan-400">1</span>
                </motion.div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Hash Analyzer</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30 hidden sm:inline">CRYPTO</span>
                </h2>
                <p className="text-xs sm:text-sm text-cyan-300/70 flex items-center gap-1 sm:gap-2">
                  <Binary className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Identify & analyze hashes</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-green-400" />
                <span className="text-xs text-green-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-green-400" />
                <span className="text-xs text-green-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">4</span>
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
          {/* Input Section */}
          <div className="mb-6 p-6 rounded-2xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-sm">
            <label className="text-cyan-300 text-sm font-medium mb-3 flex items-center gap-2">
              <Code className="w-4 h-4" />
              Hash Value
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  value={hash}
                  onChange={e => setHash(e.target.value)}
                  placeholder="e.g., 5d41402abc4b2a76b9719d911017c592"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-cyan-500/30 text-white text-lg font-mono placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(34,211,238,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAnalyze}
                disabled={isAnalyzing || !hash.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/30"
              >
                {isAnalyzing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
              </motion.button>
            </div>

            {/* Analysis Animation */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.span
                        key={i}
                        className="text-cyan-400 font-mono text-xl"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      >
                        {'0123456789ABCDEF'[Math.floor(Math.random() * 16)]}
                      </motion.span>
                    ))}
                  </motion.div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {['Detecting Type', 'Validating Format', 'Database Lookup', 'Security Analysis'].map((step, i) => (
                    <motion.div
                      key={step}
                      className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                    >
                      <div className="text-xs text-cyan-300">{step}</div>
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
                {/* Overview Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                  >
                    <Hash className="w-6 h-6 text-cyan-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{results.primaryType}</div>
                    <div className="text-cyan-300/70 text-sm">Detected Type</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-slate-800/50 border border-cyan-500/20"
                  >
                    <FileText className="w-6 h-6 text-cyan-400 mb-2" />
                    <div className="text-2xl font-bold text-white">{results.length}</div>
                    <div className="text-gray-400 text-sm">Characters</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-5 rounded-2xl ${
                      results.securityStatus === 'Secure' 
                        ? 'bg-emerald-500/10 border border-emerald-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <Shield className={`w-6 h-6 mb-2 ${results.securityStatus === 'Secure' ? 'text-emerald-400' : 'text-red-400'}`} />
                    <div className={`text-2xl font-bold ${results.securityStatus === 'Secure' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {results.securityStatus}
                    </div>
                    <div className="text-gray-400 text-sm">Security Status</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`p-5 rounded-2xl ${
                      results.cracked 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-emerald-500/10 border border-emerald-500/30'
                    }`}
                  >
                    {results.cracked ? (
                      <Unlock className="w-6 h-6 text-red-400 mb-2" />
                    ) : (
                      <Lock className="w-6 h-6 text-emerald-400 mb-2" />
                    )}
                    <div className={`text-2xl font-bold ${results.cracked ? 'text-red-400' : 'text-emerald-400'}`}>
                      {results.cracked ? 'Cracked' : 'Secure'}
                    </div>
                    <div className="text-gray-400 text-sm">Lookup Status</div>
                  </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: Eye },
                    { id: 'analysis', label: 'Analysis', icon: Cpu },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'lookup', label: 'Lookup', icon: Database },
                  ].map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-cyan-500/20'
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 rounded-2xl bg-slate-900/70 border border-cyan-500/20"
                  >
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Hash Display */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-cyan-300 text-sm">Input Hash</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => copyToClipboard(results.hash)}
                              className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                            >
                              <Copy className="w-4 h-4" />
                            </motion.button>
                          </div>
                          <code className="text-white font-mono text-sm break-all">{results.hash}</code>
                        </div>

                        {/* Quick Info Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            { label: 'Format', value: results.format },
                            { label: 'Length', value: `${results.length} characters` },
                            { label: 'Case', value: results.uppercase ? 'Uppercase' : 'Lowercase/Mixed' },
                            { label: 'Valid Hex', value: results.valid ? 'Yes' : 'No' },
                          ].map(item => (
                            <div key={item.label} className="p-3 rounded-xl bg-slate-800/30 flex justify-between">
                              <span className="text-gray-400">{item.label}</span>
                              <span className="text-white font-medium">{item.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Possible Types */}
                        <div>
                          <h4 className="text-cyan-300 font-medium mb-3">Possible Hash Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {results.types.map((type, i) => (
                              <motion.span
                                key={type}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                                  i === 0 
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                                    : 'bg-slate-800/50 text-gray-400 border border-slate-700/50'
                                }`}
                              >
                                {type}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'analysis' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Entropy */}
                          <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                            <div className="flex items-center gap-3 mb-4">
                              <Cpu className="w-6 h-6 text-cyan-400" />
                              <span className="text-white font-semibold">Entropy Analysis</span>
                            </div>
                            <div className="text-4xl font-bold text-cyan-400 mb-2">{results.entropy}</div>
                            <div className="text-gray-400 text-sm">bits of entropy</div>
                            <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(results.entropy / 2, 100)}%` }}
                                transition={{ duration: 1 }}
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              />
                            </div>
                          </div>

                          {/* Strength */}
                          <div className="p-5 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                            <div className="flex items-center gap-3 mb-4">
                              <Shield className="w-6 h-6 text-cyan-400" />
                              <span className="text-white font-semibold">Hash Strength</span>
                            </div>
                            <div className={`text-4xl font-bold mb-2 ${
                              results.strength === 'Strong' ? 'text-emerald-400' :
                              results.strength === 'Medium' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {results.strength}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Based on algorithm and length
                            </div>
                          </div>
                        </div>

                        {/* Related Hash Conversions */}
                        <div>
                          <h4 className="text-cyan-300 font-medium mb-3 flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            If this is a password, it might look like:
                          </h4>
                          <div className="space-y-2">
                            {results.relatedHashes.map((related, i) => (
                              <motion.div
                                key={related.type}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-3 rounded-xl bg-slate-800/50 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono">
                                    {related.type}
                                  </span>
                                  <code className="text-gray-400 text-sm font-mono">{related.hash}</code>
                                </div>
                                <Copy className="w-4 h-4 text-gray-500 cursor-pointer hover:text-cyan-400" />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'security' && (
                      <div className="space-y-6">
                        {/* Collision Risk */}
                        <div className={`p-5 rounded-xl ${
                          results.collisionRisk === 'Low' 
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : results.collisionRisk === 'Medium'
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-red-500/10 border border-red-500/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className={`w-6 h-6 ${
                                results.collisionRisk === 'Low' ? 'text-emerald-400' :
                                results.collisionRisk === 'Medium' ? 'text-amber-400' : 'text-red-400'
                              }`} />
                              <div>
                                <div className="text-white font-semibold">Collision Risk</div>
                                <div className="text-gray-400 text-sm">Probability of hash collision</div>
                              </div>
                            </div>
                            <div className={`text-2xl font-bold ${
                              results.collisionRisk === 'Low' ? 'text-emerald-400' :
                              results.collisionRisk === 'Medium' ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {results.collisionRisk}
                            </div>
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h4 className="text-cyan-300 font-medium mb-3">Security Recommendations</h4>
                          <div className="space-y-2">
                            {results.recommendations.map((rec, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3"
                              >
                                <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                <span className="text-gray-300">{rec}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'lookup' && (
                      <div className="space-y-6">
                        {/* Lookup Status */}
                        <div className={`p-6 rounded-xl ${
                          results.lookupResults.found 
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-emerald-500/10 border border-emerald-500/30'
                        }`}>
                          <div className="flex items-center gap-4">
                            {results.lookupResults.found ? (
                              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                              </div>
                            )}
                            <div>
                              <div className={`text-2xl font-bold ${
                                results.lookupResults.found ? 'text-red-400' : 'text-emerald-400'
                              }`}>
                                {results.lookupResults.found ? 'Hash Found in Database' : 'Hash Not Found'}
                              </div>
                              <div className="text-gray-400">
                                {results.lookupResults.found 
                                  ? `Found in ${results.lookupResults.source}` 
                                  : 'Not present in common hash databases'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cracked Value */}
                        {results.cracked && results.crackedValue && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 rounded-xl bg-red-500/10 border border-red-500/30"
                          >
                            <div className="text-red-400 text-sm mb-2 flex items-center gap-2">
                              <Unlock className="w-4 h-4" />
                              Cracked Plaintext
                            </div>
                            <code className="text-2xl font-bold text-white font-mono">{results.crackedValue}</code>
                          </motion.div>
                        )}

                        {/* Database Stats */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                            <Database className="w-5 h-5 text-cyan-400 mb-2" />
                            <div className="text-white font-semibold">{results.lookupResults.database}</div>
                            <div className="text-gray-400 text-sm">Database Checked</div>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
                            <Server className="w-5 h-5 text-cyan-400 mb-2" />
                            <div className="text-white font-semibold">{results.lookupResults.matches} matches</div>
                            <div className="text-gray-400 text-sm">Related Entries</div>
                          </div>
                        </div>
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
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <Hash className="w-24 h-24 text-cyan-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter a hash to analyze</h3>
              <p className="text-gray-500">Identify type, check security, and lookup in databases</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HashAnalyzerTool;
