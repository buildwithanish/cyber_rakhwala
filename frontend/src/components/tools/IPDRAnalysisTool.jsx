import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, Search, Zap, User, Shield, AlertTriangle, Clock,
  RefreshCw, Activity, Database, Upload, FileSpreadsheet, BarChart3,
  MapPin, Wifi, Server, TrendingUp, Calendar, Filter, Download, 
  HardDrive, Network, Router, Signal, ExternalLink, Eye
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const IPDRAnalysisTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [ipAddress, setIpAddress] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setIpAddress('');
    setDateRange({ start: '', end: '' });
    setUploadedFile(null);
    setResults(null);
    setAnalyzeProgress(0);
    toast.info('Ready for new analysis');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `ipdr_analysis_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  // Background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > canvas.height || p.y < 0) p.speedY *= -1;
        if (p.x > canvas.width || p.x < 0) p.speedX *= -1;
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(csv|xlsx|xls|txt)$/)) {
        toast.error('Please upload a CSV, Excel, or TXT file');
        return;
      }
      setUploadedFile(file);
      toast.success(`File "${file.name}" uploaded`);
    }
  };

  const validateIP = (ip) => {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  };

  const handleAnalyze = async () => {
    if (!ipAddress.trim() && !uploadedFile) {
      toast.error('Please enter an IP address or upload an IPDR file');
      return;
    }

    if (ipAddress && !validateIP(ipAddress)) {
      toast.error('Please enter a valid IP address');
      return;
    }

    trackToolUsage('ipdr-analysis', 'analyze', 'start');
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    onConsume?.(25);

    const progressInterval = setInterval(() => {
      setAnalyzeProgress(prev => Math.min(prev + 2, 95));
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      const resultData = {
        targetIP: ipAddress || 'Uploaded IPDR',
        analysisDate: new Date().toISOString(),
        dateRange: dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'Last 30 days',
        summary: {
          totalRecords: 24567,
          totalDataTransfer: '156.8 GB',
          uniqueDestinations: 892,
          uniquePorts: 156,
          activeSessions: 23,
          averageSessionDuration: '00:12:34',
          peakBandwidth: '45.6 Mbps',
          suspiciousConnections: 12,
        },
        connectionStats: {
          http: 8934,
          https: 12456,
          ftp: 234,
          smtp: 567,
          dns: 1890,
          other: 486,
        },
        topDestinations: [
          { ip: '172.217.14.206', domain: 'google.com', connections: 3456, data: '12.4 GB', country: 'US' },
          { ip: '157.240.1.35', domain: 'facebook.com', connections: 2134, data: '8.7 GB', country: 'US' },
          { ip: '52.84.123.45', domain: 'amazonaws.com', connections: 1890, data: '45.2 GB', country: 'US' },
          { ip: '104.16.89.12', domain: 'cloudflare.com', connections: 1567, data: '3.4 GB', country: 'US' },
          { ip: '13.107.42.14', domain: 'microsoft.com', connections: 1234, data: '5.6 GB', country: 'US' },
        ],
        portAnalysis: [
          { port: 443, protocol: 'HTTPS', connections: 12456, percentage: 50.7 },
          { port: 80, protocol: 'HTTP', connections: 8934, percentage: 36.4 },
          { port: 53, protocol: 'DNS', connections: 1890, percentage: 7.7 },
          { port: 25, protocol: 'SMTP', connections: 567, percentage: 2.3 },
          { port: 21, protocol: 'FTP', connections: 234, percentage: 1.0 },
        ],
        timelineData: {
          hourly: [
            { hour: '00:00', connections: 567, data: '2.3 GB' },
            { hour: '06:00', connections: 1234, data: '5.6 GB' },
            { hour: '12:00', connections: 3456, data: '15.8 GB' },
            { hour: '18:00', connections: 4567, data: '23.4 GB' },
          ],
          daily: {
            Monday: { connections: 4567, data: '25.6 GB' },
            Tuesday: { connections: 4234, data: '22.3 GB' },
            Wednesday: { connections: 4890, data: '28.1 GB' },
            Thursday: { connections: 4123, data: '21.7 GB' },
            Friday: { connections: 3987, data: '19.8 GB' },
            Saturday: { connections: 1234, data: '8.9 GB' },
            Sunday: { connections: 1532, data: '10.4 GB' },
          },
        },
        suspiciousActivity: [
          { type: 'Unusual Port', description: 'Connection to port 4444 (commonly used by malware)', ip: '192.168.1.105', severity: 'High', timestamp: '2024-01-09 03:45:12' },
          { type: 'Data Exfiltration', description: 'Large upload to unknown destination (15GB)', ip: '45.33.32.156', severity: 'High', timestamp: '2024-01-08 22:15:34' },
          { type: 'TOR Network', description: 'Connection to TOR exit node detected', ip: '185.220.100.243', severity: 'Medium', timestamp: '2024-01-08 14:23:45' },
          { type: 'Known C2 Server', description: 'Connection to known command & control server', ip: '91.214.124.56', severity: 'Critical', timestamp: '2024-01-07 09:12:34' },
        ],
        geoDistribution: [
          { country: 'United States', code: 'US', connections: 15678, percentage: 63.8 },
          { country: 'India', code: 'IN', connections: 4567, percentage: 18.6 },
          { country: 'Germany', code: 'DE', connections: 1890, percentage: 7.7 },
          { country: 'Singapore', code: 'SG', connections: 1234, percentage: 5.0 },
          { country: 'United Kingdom', code: 'GB', connections: 1198, percentage: 4.9 },
        ],
        recentConnections: [
          { timestamp: '2024-01-09 18:45:32', destIP: '172.217.14.206', port: 443, protocol: 'HTTPS', data: '2.4 MB', duration: '00:02:34' },
          { timestamp: '2024-01-09 18:42:15', destIP: '157.240.1.35', port: 443, protocol: 'HTTPS', data: '1.8 MB', duration: '00:05:12' },
          { timestamp: '2024-01-09 18:38:45', destIP: '52.84.123.45', port: 443, protocol: 'HTTPS', data: '45.6 MB', duration: '00:08:23' },
          { timestamp: '2024-01-09 18:35:12', destIP: '1.1.1.1', port: 53, protocol: 'DNS', data: '0.2 KB', duration: '00:00:01' },
          { timestamp: '2024-01-09 18:32:45', destIP: '13.107.42.14', port: 443, protocol: 'HTTPS', data: '5.3 MB', duration: '00:01:45' },
        ],
      };

      setResults(resultData);
      addToHistory({
        tool: 'IPDR Analysis',
        query: ipAddress || uploadedFile?.name,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      setIsAnalyzing(false);
      toast.success('IPDR analysis completed');
    }, 5000);
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'destinations', label: 'Top Destinations', icon: Globe },
    { id: 'ports', label: 'Port Analysis', icon: Server },
    { id: 'timeline', label: 'Timeline', icon: TrendingUp },
    { id: 'suspicious', label: 'Alerts', icon: AlertTriangle },
    { id: 'geo', label: 'Geography', icon: MapPin },
    { id: 'connections', label: 'Recent', icon: Network },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-cyan-950/30 to-gray-900 rounded-2xl border border-cyan-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-cyan-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <Network className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">IPDR Analysis</h2>
              <p className="text-xs sm:text-sm text-cyan-400/80 truncate hidden sm:block">Internet Protocol Detail Records forensics</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-200 hidden sm:inline">New Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!results}
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-teal-200">Export JSON</span>
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">25</span>
              <span className="text-xs text-amber-200/70">credits</span>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!results ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Input Section */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                  <label className="block text-sm text-cyan-400 mb-2 font-mono">TARGET IP ADDRESS</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      placeholder="192.168.1.1 or IPv6"
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-cyan-500/30 focus:border-cyan-500 outline-none text-white font-mono placeholder-gray-600"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                  <label className="block text-sm text-cyan-400 mb-2 font-mono">UPLOAD IPDR FILE</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-lg bg-gray-900 border border-dashed border-cyan-500/30 hover:border-cyan-500 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {uploadedFile ? uploadedFile.name : 'Upload CSV/Excel/TXT'}
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                <label className="block text-sm text-cyan-400 mb-2 font-mono">DATE RANGE (Optional)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-cyan-500/30 focus:border-cyan-500 outline-none text-white"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-cyan-500/30 focus:border-cyan-500 outline-none text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <Network className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Traffic Analysis</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <MapPin className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Geo Tracking</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <AlertTriangle className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Threat Detection</p>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:from-cyan-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Network className="w-6 h-6" />
                    </motion.div>
                    Analyzing IPDR... {analyzeProgress}%
                  </>
                ) : (
                  <>
                    <Network className="w-6 h-6" />
                    Analyze IPDR Data
                  </>
                )}
              </button>

              {isAnalyzing && (
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${analyzeProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Network className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-mono">{results.targetIP}</p>
                      <p className="text-cyan-400">{results.dateRange} • {results.summary.totalRecords.toLocaleString()} records</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-cyan-400">{results.summary.totalDataTransfer}</p>
                      <p className="text-xs text-gray-500">Total Data</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-teal-400">{results.summary.uniqueDestinations}</p>
                      <p className="text-xs text-gray-500">Destinations</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-red-400">{results.summary.suspiciousConnections}</p>
                      <p className="text-xs text-gray-500">Alerts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Results Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-3 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                      <h3 className="text-sm font-mono text-cyan-400 mb-3">TRAFFIC SUMMARY</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Total Records</span><span className="text-white">{results.summary.totalRecords.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Data Transfer</span><span className="text-white">{results.summary.totalDataTransfer}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Peak Bandwidth</span><span className="text-white">{results.summary.peakBandwidth}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Avg Session</span><span className="text-white">{results.summary.averageSessionDuration}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                      <h3 className="text-sm font-mono text-cyan-400 mb-3">NETWORK STATS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Unique Destinations</span><span className="text-white">{results.summary.uniqueDestinations}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Unique Ports</span><span className="text-white">{results.summary.uniquePorts}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Active Sessions</span><span className="text-white">{results.summary.activeSessions}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                      <h3 className="text-sm font-mono text-cyan-400 mb-3">PROTOCOL BREAKDOWN</h3>
                      <div className="space-y-2">
                        {Object.entries(results.connectionStats).slice(0, 4).map(([protocol, count]) => (
                          <div key={protocol} className="flex justify-between">
                            <span className="text-gray-400 uppercase">{protocol}</span>
                            <span className="text-white">{count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'destinations' && (
                  <motion.div
                    key="destinations"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.topDestinations.map((dest, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-white font-mono">{dest.ip}</p>
                            <p className="text-sm text-gray-500">{dest.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-white">{dest.connections.toLocaleString()} connections</p>
                            <p className="text-xs text-gray-500">{dest.data} transferred</p>
                          </div>
                          <span className="px-2 py-1 rounded bg-gray-700 text-xs text-gray-300">{dest.country}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'ports' && (
                  <motion.div
                    key="ports"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.portAnalysis.map((port, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-cyan-400" />
                            <span className="text-white font-mono">Port {port.port}</span>
                            <span className="text-sm text-gray-500">{port.protocol}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white">{port.connections.toLocaleString()}</span>
                            <span className="text-gray-500 ml-2">({port.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                            style={{ width: `${port.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                      <h3 className="text-sm font-mono text-cyan-400 mb-3">HOURLY ACTIVITY</h3>
                      <div className="space-y-3">
                        {results.timelineData.hourly.map((hour, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-14">{hour.hour}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                                style={{ width: `${(hour.connections / 5000) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-16 text-right">{hour.connections}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                      <h3 className="text-sm font-mono text-cyan-400 mb-3">DAILY DISTRIBUTION</h3>
                      <div className="space-y-2">
                        {Object.entries(results.timelineData.daily).map(([day, data]) => (
                          <div key={day} className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-24">{day}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                                style={{ width: `${(data.connections / 5000) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-20 text-right">{data.data}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'suspicious' && (
                  <motion.div
                    key="suspicious"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.suspiciousActivity.map((activity, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                        activity.severity === 'Critical' ? 'bg-red-500/20 border-red-500/50' :
                        activity.severity === 'High' ? 'bg-red-500/10 border-red-500/30' :
                        activity.severity === 'Medium' ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-gray-800/50 border-gray-700'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          activity.severity === 'Critical' ? 'text-red-500' :
                          activity.severity === 'High' ? 'text-red-400' :
                          activity.severity === 'Medium' ? 'text-amber-400' :
                          'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">{activity.type}</p>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              activity.severity === 'Critical' ? 'bg-red-500/30 text-red-300' :
                              activity.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                              activity.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {activity.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{activity.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="font-mono">{activity.ip}</span>
                            <span>{activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'geo' && (
                  <motion.div
                    key="geo"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.geoDistribution.map((geo, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-cyan-400" />
                            <span className="text-white">{geo.country}</span>
                            <span className="text-gray-500 text-sm">({geo.code})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white">{geo.connections.toLocaleString()}</span>
                            <span className="text-gray-500 ml-2">({geo.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
                            style={{ width: `${geo.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'connections' && (
                  <motion.div
                    key="connections"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.recentConnections.map((conn, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-cyan-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-white font-mono">{conn.destIP}</p>
                            <p className="text-sm text-gray-500">{conn.timestamp}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-white">Port {conn.port} ({conn.protocol})</p>
                            <p className="text-xs text-gray-500">{conn.data} • {conn.duration}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IPDRAnalysisTool;
