import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pickaxe, X, Search, Zap, Database, Cpu, HardDrive, Activity,
  Download, Filter, BarChart3, PieChart, TrendingUp, Users,
  FileText, Image, Globe, Mail, Phone, CreditCard, Lock,
  RefreshCw, Play, Pause, Settings, Layers, ArrowUpRight, Copy
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const DataMiningTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [target, setTarget] = useState('');
  const [dataTypes, setDataTypes] = useState([]);
  const [isMining, setIsMining] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [activeChart, setActiveChart] = useState('bar');
  const canvasRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [dataStream, setDataStream] = useState([]);
  const [lastLookupTime, setLastLookupTime] = useState(null);
  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `data_mining_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `data_mining_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  const availableTypes = [
    { id: 'emails', label: 'Emails', icon: Mail, color: 'emerald' },
    { id: 'phones', label: 'Phone Numbers', icon: Phone, color: 'blue' },
    { id: 'documents', label: 'Documents', icon: FileText, color: 'purple' },
    { id: 'images', label: 'Images', icon: Image, color: 'pink' },
    { id: 'links', label: 'Links', icon: Globe, color: 'cyan' },
    { id: 'financial', label: 'Financial Data', icon: CreditCard, color: 'amber' },
    { id: 'credentials', label: 'Credentials', icon: Lock, color: 'red' },
    { id: 'social', label: 'Social Profiles', icon: Users, color: 'indigo' },
  ];

  // Data stream effect
  useEffect(() => {
    if (isMining) {
      const interval = setInterval(() => {
        setDataStream(prev => {
          const newItem = {
            id: Date.now(),
            text: ['0x' + Math.random().toString(16).slice(2, 10), 
                   '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
                   'user_' + Math.random().toString(36).slice(2, 8),
                   Math.random().toString(36).slice(2, 12) + '@mail.com',
                  ][Math.floor(Math.random() * 4)],
            x: Math.random() * 100,
          };
          return [...prev.slice(-30), newItem];
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isMining]);

  // Mining progress animation
  useEffect(() => {
    if (isMining && miningProgress < 100) {
      const interval = setInterval(() => {
        setMiningProgress(prev => Math.min(prev + Math.random() * 3, 100));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isMining, miningProgress]);

  // Canvas particle effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let particleList = [];
    for (let i = 0; i < 50; i++) {
      particleList.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 4 + 1,
        color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)],
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particleList.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;

        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        
        // Draw data-like shapes
        if (Math.random() > 0.5) {
          ctx.rect(p.x, p.y, p.size * 2, p.size);
        } else {
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();

        // Trail effect
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = p.color;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(p.x, p.y - i * 5, p.size / 2 * (1 - i * 0.2), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const toggleDataType = (id) => {
    setDataTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleStartMining = async () => {
    if (!target.trim() || dataTypes.length === 0) return;
    
    setIsMining(true);
    setMiningProgress(0);
    setDataStream([]);
    onConsume?.(12);

    setTimeout(() => {
      const resultData = {
        target,
        duration: '4.2s',
        totalRecords: Math.floor(Math.random() * 10000) + 5000,
        sources: Math.floor(Math.random() * 50) + 20,
        data: {
          emails: {
            count: Math.floor(Math.random() * 500) + 100,
            items: [
              { value: 'admin@' + target, source: 'WHOIS', confidence: 95 },
              { value: 'support@' + target, source: 'Web Scrape', confidence: 87 },
              { value: 'info@' + target, source: 'LinkedIn', confidence: 78 },
              { value: 'sales@' + target, source: 'Google Cache', confidence: 82 },
              { value: 'contact@' + target, source: 'DNS TXT', confidence: 91 },
            ],
          },
          phones: {
            count: Math.floor(Math.random() * 50) + 10,
            items: [
              { value: '+1 (555) 123-4567', source: 'WHOIS', confidence: 89 },
              { value: '+1 (555) 987-6543', source: 'Web Scrape', confidence: 72 },
            ],
          },
          documents: {
            count: Math.floor(Math.random() * 200) + 50,
            items: [
              { value: 'Q4_Report_2024.pdf', source: 'Google Dork', confidence: 85 },
              { value: 'employee_handbook.docx', source: 'Indexed', confidence: 78 },
              { value: 'network_diagram.png', source: 'S3 Bucket', confidence: 65 },
            ],
          },
          links: {
            count: Math.floor(Math.random() * 1000) + 500,
            items: [
              { value: 'https://' + target + '/admin', source: 'Crawler', confidence: 92 },
              { value: 'https://dev.' + target, source: 'DNS', confidence: 88 },
              { value: 'https://staging.' + target, source: 'Certificate', confidence: 95 },
            ],
          },
          social: {
            count: Math.floor(Math.random() * 30) + 5,
            items: [
              { value: '@' + target.split('.')[0], source: 'Twitter', confidence: 90 },
              { value: 'linkedin.com/company/' + target.split('.')[0], source: 'LinkedIn', confidence: 95 },
              { value: 'github.com/' + target.split('.')[0], source: 'GitHub', confidence: 85 },
            ],
          },
        },
        timeline: [
          { time: '0:00', event: 'Started mining', records: 0 },
          { time: '0:45', event: 'WHOIS extraction', records: 150 },
          { time: '1:20', event: 'DNS enumeration', records: 450 },
          { time: '2:10', event: 'Web scraping', records: 2800 },
          { time: '3:15', event: 'Social lookup', records: 4200 },
          { time: '4:20', event: 'Complete', records: 6847 },
        ],
        statistics: {
          bySource: [
            { name: 'Web Scrape', value: 45 },
            { name: 'DNS', value: 25 },
            { name: 'WHOIS', value: 15 },
            { name: 'Social', value: 10 },
            { name: 'Other', value: 5 },
          ],
          byType: dataTypes.map(type => ({
            name: availableTypes.find(t => t.id === type)?.label || type,
            value: Math.floor(Math.random() * 30) + 10,
          })),
        },
      };
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('data-mining', target, resultData);
      trackToolUsage('data-mining', 'mine', 'success');
      toast.success('Data mining complete!');
      setIsMining(false);
    }, 4500);
  };

  const handleRefresh = () => {
    setTarget('');
    setDataTypes([]);
    setResults(null);
    setMiningProgress(0);
    setLastLookupTime(null);
    toast.info('Ready for new search');
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
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.15)]"
      >
        {/* Data stream canvas background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-40"
        />

        {/* Hex pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 20V50L30 65L5 50V20L30 5Z' fill='none' stroke='%2310b981' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />

        {/* Floating data indicators */}
        {isMining && dataStream.slice(-10).map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, x: `${item.x}%` }}
            animate={{ opacity: 0, y: -100 }}
            transition={{ duration: 2 }}
            className="absolute bottom-20 font-mono text-xs text-emerald-400/50 pointer-events-none"
            style={{ left: `${item.x}%` }}
          >
            {item.text}
          </motion.div>
        ))}

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40"
                  animate={isMining ? { 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1],
                  } : {}}
                  transition={{ duration: 0.5, repeat: isMining ? Infinity : 0 }}
                >
                  <Pickaxe className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {isMining && (
                  <motion.div
                    className="absolute -inset-2 rounded-xl sm:rounded-2xl border-2 border-emerald-500/50 hidden sm:block"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Data Mining</span>
                  {isMining && (
                    <motion.span
                      className="px-2 py-0.5 text-xs bg-emerald-500/30 text-emerald-300 rounded-full border border-emerald-500/50 hidden sm:inline"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      MINING
                    </motion.span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-300/70 flex items-center gap-2">
                  <Database className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Automated multi-source data extraction</span>
                  <span className="truncate sm:hidden">Multi-source extraction</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span className="text-xs text-emerald-200 hidden sm:inline">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-sky-400" />
                <span className="text-xs text-sky-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-sky-400" />
                <span className="text-xs text-sky-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-sm sm:text-lg font-bold text-amber-300">12</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
          {/* Configuration Section */}
          <div className="mb-6 p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-sm">
            {/* Target Input */}
            <div className="mb-6">
              <label className="text-sm text-emerald-300 mb-2 block">Target (Domain/URL/Keyword)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <input
                  type="text"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="Enter target (e.g., example.com)"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-emerald-500/30 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                />
              </div>
            </div>

            {/* Data Type Selection */}
            <div className="mb-6">
              <label className="text-sm text-emerald-300 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Data Types to Extract
              </label>
              <div className="grid grid-cols-4 gap-3">
                {availableTypes.map(type => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleDataType(type.id)}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${
                      dataTypes.includes(type.id)
                        ? `bg-${type.color}-500/20 border-${type.color}-500/50 shadow-lg shadow-${type.color}-500/20`
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    <type.icon className={`w-6 h-6 ${dataTypes.includes(type.id) ? `text-${type.color}-400` : 'text-gray-500'}`} />
                    <span className={`text-sm ${dataTypes.includes(type.id) ? 'text-white' : 'text-gray-400'}`}>
                      {type.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Start Mining Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(16,185,129,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartMining}
              disabled={isMining || !target.trim() || dataTypes.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-emerald-500/40"
            >
              {isMining ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-6 h-6" />
                  </motion.div>
                  <span>Mining in Progress...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>Start Mining Operation</span>
                </>
              )}
            </motion.button>

            {/* Mining Progress */}
            {isMining && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-emerald-300">Mining Progress</span>
                    <span className="text-white font-mono">{miningProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%]"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${miningProgress}%`,
                        backgroundPosition: ['0%', '100%'],
                      }}
                      transition={{ backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' } }}
                    />
                  </div>
                </div>

                {/* Mining Stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { icon: Database, label: 'Sources', value: Math.floor(miningProgress / 2) },
                    { icon: HardDrive, label: 'Records', value: Math.floor(miningProgress * 68) },
                    { icon: Cpu, label: 'Processes', value: Math.min(8, Math.floor(miningProgress / 12)) },
                    { icon: Activity, label: 'Speed', value: Math.floor(Math.random() * 500 + 500) + '/s' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-xl bg-slate-800/50 border border-emerald-500/20"
                    >
                      <stat.icon className="w-5 h-5 text-emerald-400 mb-2" />
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
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
                {/* Summary */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Mining Complete</h3>
                      <div className="text-emerald-300/70 font-mono">{results.target}</div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-400">{results.totalRecords.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Total Records</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-teal-400">{results.sources}</div>
                        <div className="text-xs text-gray-400">Sources</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400">{results.duration}</div>
                        <div className="text-xs text-gray-400">Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* By Source Chart */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
                    <h4 className="text-emerald-300 font-semibold mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Data by Source
                    </h4>
                    <div className="space-y-3">
                      {results.statistics.bySource.map((item, i) => (
                        <motion.div
                          key={item.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-24 text-sm text-gray-400">{item.name}</div>
                          <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            />
                          </div>
                          <div className="w-12 text-right text-white font-bold">{item.value}%</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* By Type Chart */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
                    <h4 className="text-emerald-300 font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Data by Type
                    </h4>
                    <div className="flex items-end justify-around h-48 pt-4">
                      {results.statistics.byType.map((item, i) => (
                        <motion.div
                          key={item.name}
                          initial={{ height: 0 }}
                          animate={{ height: `${item.value * 3}px` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className="w-16 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg relative group cursor-pointer"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.value}%
                          </div>
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                            {item.name.split(' ')[0]}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extracted Data */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
                  <h4 className="text-emerald-300 font-semibold mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Extracted Data Samples
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(results.data).map(([type, data], typeIndex) => (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: typeIndex * 0.1 }}
                        className="rounded-xl bg-slate-800/50 overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-slate-700/50 flex items-center justify-between">
                          <span className="text-white font-medium capitalize">{type}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                            {data.count} found
                          </span>
                        </div>
                        <div className="p-4 space-y-2">
                          {data.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                              <code className="text-emerald-400 font-mono text-sm">{item.value}</code>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500">{item.source}</span>
                                <span className={`px-2 py-0.5 rounded-full ${
                                  item.confidence >= 90 ? 'bg-emerald-500/20 text-emerald-300' :
                                  item.confidence >= 75 ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-gray-500/20 text-gray-300'
                                }`}>
                                  {item.confidence}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-6 p-6 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
                  <h4 className="text-emerald-300 font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Mining Timeline
                  </h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-500/30" />
                    <div className="space-y-4 pl-10">
                      {results.timeline.map((event, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative"
                        >
                          <div className="absolute -left-10 w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                          </div>
                          <div className="p-3 rounded-lg bg-slate-800/50">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">{event.event}</span>
                              <span className="text-gray-500 font-mono text-sm">{event.time}</span>
                            </div>
                            <div className="text-sm text-emerald-400 mt-1">
                              {event.records.toLocaleString()} records extracted
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 text-white font-bold flex items-center justify-center gap-3 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Export All Data (JSON/CSV)
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isMining && (
            <div className="text-center py-20">
              <motion.div
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Pickaxe className="w-24 h-24 text-emerald-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Configure your mining operation</h3>
              <p className="text-gray-500">Select data types and start automated extraction</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DataMiningTool;
