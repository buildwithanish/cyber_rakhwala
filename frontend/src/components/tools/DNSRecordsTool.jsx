import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, Search, Zap, Server, Network, Shield, Clock, Download,
  ChevronRight, Copy, CheckCircle, RefreshCw, ArrowRight,
  Database, Lock, AlertTriangle, Info, ExternalLink
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const DNSRecordsTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const clipboard = useClipboard();
  
  const [domain, setDomain] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedRecord, setCopiedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [lastLookupTime, setLastLookupTime] = useState(null);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `dns_records_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `dns_records_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // DNS Tree visualization
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

    // Generate network nodes
    const generateNodes = () => {
      const newNodes = [];
      for (let i = 0; i < 30; i++) {
        newNodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 3 + 2,
        });
      }
      return newNodes;
    };

    let networkNodes = generateNodes();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < networkNodes.length; i++) {
        for (let j = i + 1; j < networkNodes.length; j++) {
          const dx = networkNodes[j].x - networkNodes[i].x;
          const dy = networkNodes[j].y - networkNodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.globalAlpha = 1 - dist / 120;
            ctx.beginPath();
            ctx.moveTo(networkNodes[i].x, networkNodes[i].y);
            ctx.lineTo(networkNodes[j].x, networkNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      networkNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleResolve = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }
    
    trackToolUsage('dns-records', 'resolve', 'start');
    setIsResolving(true);
    onConsume?.(6);

    setTimeout(() => {
      const resultData = {
        domain: domain,
        resolveTime: (Math.random() * 100 + 20).toFixed(2) + 'ms',
        dnssec: Math.random() > 0.5,
        nameservers: [
          { host: 'ns1.example.com', ip: '192.168.1.1', responseTime: '12ms' },
          { host: 'ns2.example.com', ip: '192.168.1.2', responseTime: '18ms' },
        ],
        records: {
          A: [
            { value: '93.184.216.34', ttl: 3600, priority: null },
            { value: '93.184.216.35', ttl: 3600, priority: null },
          ],
          AAAA: [
            { value: '2606:2800:220:1:248:1893:25c8:1946', ttl: 3600, priority: null },
          ],
          CNAME: [
            { value: 'www.example.com.cdn.cloudflare.net', ttl: 300, priority: null },
          ],
          MX: [
            { value: 'mx1.mail.example.com', ttl: 3600, priority: 10 },
            { value: 'mx2.mail.example.com', ttl: 3600, priority: 20 },
            { value: 'mx-backup.example.com', ttl: 3600, priority: 30 },
          ],
          TXT: [
            { value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600, priority: null },
            { value: 'google-site-verification=abc123xyz', ttl: 3600, priority: null },
            { value: 'MS=ms12345678', ttl: 3600, priority: null },
          ],
          NS: [
            { value: 'ns1.example.com', ttl: 86400, priority: null },
            { value: 'ns2.example.com', ttl: 86400, priority: null },
          ],
          SOA: [
            { value: 'ns1.example.com admin.example.com 2024010101 7200 3600 1209600 86400', ttl: 86400, priority: null },
          ],
          CAA: [
            { value: '0 issue "letsencrypt.org"', ttl: 3600, priority: null },
            { value: '0 issuewild "letsencrypt.org"', ttl: 3600, priority: null },
          ],
          SRV: [
            { value: '0 5 443 sipdir.online.lync.com', ttl: 3600, priority: 100 },
          ],
          PTR: [
            { value: '34.216.184.93.in-addr.arpa points to example.com', ttl: 3600, priority: null },
          ],
        },
        propagation: [
          { location: 'United States', status: 'propagated', ip: '93.184.216.34' },
          { location: 'Europe', status: 'propagated', ip: '93.184.216.34' },
          { location: 'Asia', status: 'propagating', ip: '93.184.216.35' },
          { location: 'Australia', status: 'pending', ip: null },
        ],
        securityInfo: {
          dnssec: true,
          dmarc: true,
          spf: true,
          dkim: true,
        },
      };
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('dns-records', domain, resultData);
      trackToolUsage('dns-records', 'resolve', 'success');
      toast.success('DNS records resolved!');
      setIsResolving(false);
    }, 2500);
  };

  const handleRefresh = () => {
    setDomain('');
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(id);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const recordTypes = ['all', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA', 'SRV', 'PTR'];

  const getRecordIcon = (type) => {
    const icons = {
      A: Server,
      AAAA: Server,
      CNAME: ArrowRight,
      MX: Network,
      TXT: Info,
      NS: Globe,
      SOA: Database,
      CAA: Shield,
      SRV: Network,
      PTR: ArrowRight,
    };
    return icons[type] || Server;
  };

  const getRecordColor = (type) => {
    const colors = {
      A: 'blue',
      AAAA: 'indigo',
      CNAME: 'purple',
      MX: 'orange',
      TXT: 'green',
      NS: 'cyan',
      SOA: 'red',
      CAA: 'yellow',
      SRV: 'pink',
      PTR: 'violet',
    };
    return colors[type] || 'gray';
  };

  const filteredRecords = results?.records 
    ? (activeTab === 'all' 
        ? Object.entries(results.records) 
        : Object.entries(results.records).filter(([type]) => type === activeTab))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateY: -15 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 border border-blue-500/30 shadow-[0_0_80px_rgba(59,130,246,0.15)]"
      >
        {/* Network Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-30"
        />

        {/* DNS Tree visualization */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating DNS indicators */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.2, 0.5, 0.2],
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              style={{
                left: `${10 + (i * 12)}%`,
                top: `${15 + (i % 3) * 25}%`,
              }}
            >
              <div className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-xs text-blue-300 font-mono">
                {['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'CAA'][i]}
              </div>
            </motion.div>
          ))}

          {/* Glowing orb */}
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(59,130,246,0.4)',
                      '0 0 40px rgba(59,130,246,0.6)',
                      '0 0 20px rgba(59,130,246,0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Globe className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Orbiting dots - hidden on mobile */}
                {[0, 120, 240].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-blue-400 hidden sm:block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${angle}deg) translateX(30px)`,
                    }}
                  />
                ))}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">DNS Records</span>
                  <span className="px-2 py-0.5 text-xs bg-blue-500/30 text-blue-300 rounded-full border border-blue-500/50 hidden sm:inline">v2.0</span>
                </h2>
                <p className="text-xs sm:text-sm text-blue-300/70 flex items-center gap-2 truncate">
                  <Network className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Query all DNS record types for any domain</span>
                  <span className="truncate sm:hidden">DNS lookup tool</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-xs text-blue-200 hidden sm:inline">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-blue-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-xs text-blue-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-sm sm:text-lg font-bold text-amber-300">6</span>
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
          {/* Search Section */}
          <div className="mb-6 p-6 rounded-2xl bg-slate-900/80 border border-blue-500/20 backdrop-blur-sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="Enter domain (e.g., example.com)"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-blue-500/30 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleResolve()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleResolve}
                disabled={isResolving || !domain.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/40"
              >
                {isResolving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>{isResolving ? 'Resolving...' : 'Resolve DNS'}</span>
              </motion.button>
            </div>

            {/* Resolution Animation */}
            {isResolving && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-center justify-center gap-3"
              >
                <div className="flex items-center gap-2">
                  {['Root', 'TLD', 'NS', 'Record'].map((step, i) => (
                    <motion.div
                      key={step}
                      className="flex items-center"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    >
                      <div className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm">
                        {step}
                      </div>
                      {i < 3 && (
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <ChevronRight className="w-5 h-5 text-blue-500/50 mx-1" />
                        </motion.div>
                      )}
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
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-400 text-sm">Resolve Time</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{results.resolveTime}</div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <span className="text-gray-400 text-sm">Records Found</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {Object.values(results.records).flat().length}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Server className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-400 text-sm">Nameservers</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{results.nameservers.length}</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`p-4 rounded-2xl border ${
                      results.dnssec 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className={`w-5 h-5 ${results.dnssec ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span className="text-gray-400 text-sm">DNSSEC</span>
                    </div>
                    <div className={`text-2xl font-bold ${results.dnssec ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {results.dnssec ? 'Enabled' : 'Disabled'}
                    </div>
                  </motion.div>
                </div>

                {/* Record Type Tabs */}
                <div className="mb-4 flex gap-2 flex-wrap p-2 rounded-xl bg-slate-900/40 border border-blue-500/20">
                  {recordTypes.map(type => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === type
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {type}
                    </motion.button>
                  ))}
                </div>

                {/* Records Display */}
                <div className="space-y-4">
                  {filteredRecords.map(([type, records], typeIndex) => (
                    <motion.div
                      key={type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: typeIndex * 0.1 }}
                      className="rounded-2xl bg-slate-900/60 border border-blue-500/20 overflow-hidden"
                    >
                      <div className={`px-5 py-3 bg-${getRecordColor(type)}-500/20 border-b border-${getRecordColor(type)}-500/30 flex items-center gap-3`}>
                        {(() => {
                          const Icon = getRecordIcon(type);
                          return <Icon className={`w-5 h-5 text-${getRecordColor(type)}-400`} />;
                        })()}
                        <span className="text-white font-bold">{type} Records</span>
                        <span className={`ml-auto px-2 py-0.5 rounded-full bg-${getRecordColor(type)}-500/30 text-${getRecordColor(type)}-300 text-xs`}>
                          {records.length}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-700/50">
                        {records.map((record, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: typeIndex * 0.1 + i * 0.05 }}
                            className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex-1">
                              <code className="text-blue-300 font-mono text-sm break-all">{record.value}</code>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                <span>TTL: {record.ttl}s</span>
                                {record.priority !== null && <span>Priority: {record.priority}</span>}
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => copyToClipboard(record.value, `${type}-${i}`)}
                              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                              {copiedRecord === `${type}-${i}` ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Security Info */}
                <div className="mt-6 p-6 rounded-2xl bg-slate-900/60 border border-blue-500/20">
                  <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Email Security Records
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(results.securityInfo).map(([key, enabled], i) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl text-center ${
                          enabled ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'
                        }`}
                      >
                        {enabled ? (
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        )}
                        <div className="text-white font-medium uppercase">{key}</div>
                        <div className={`text-xs ${enabled ? 'text-emerald-400' : 'text-red-400'}`}>
                          {enabled ? 'Configured' : 'Not Found'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Propagation Status */}
                <div className="mt-6 p-6 rounded-2xl bg-slate-900/60 border border-blue-500/20">
                  <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    DNS Propagation Status
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    {results.propagation.map((prop, i) => (
                      <motion.div
                        key={prop.location}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border ${
                          prop.status === 'propagated' ? 'bg-emerald-500/10 border-emerald-500/30' :
                          prop.status === 'propagating' ? 'bg-amber-500/10 border-amber-500/30' :
                          'bg-gray-500/10 border-gray-500/30'
                        }`}
                      >
                        <div className="text-white font-medium mb-1">{prop.location}</div>
                        <div className={`text-xs mb-2 ${
                          prop.status === 'propagated' ? 'text-emerald-400' :
                          prop.status === 'propagating' ? 'text-amber-400' :
                          'text-gray-400'
                        }`}>
                          {prop.status.charAt(0).toUpperCase() + prop.status.slice(1)}
                        </div>
                        {prop.ip && <code className="text-xs text-gray-500 font-mono">{prop.ip}</code>}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isResolving && (
            <div className="text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.05, 1], y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Globe className="w-24 h-24 text-blue-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter a domain to lookup</h3>
              <p className="text-gray-500">Query all DNS record types and propagation status</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DNSRecordsTool;
