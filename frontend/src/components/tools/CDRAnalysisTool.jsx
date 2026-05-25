import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, X, Search, Zap, User, Shield, AlertTriangle, Clock,
  RefreshCw, Activity, Database, Upload, FileSpreadsheet, BarChart3,
  MapPin, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  TrendingUp, Calendar, Filter, Download, Users
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const CDRAnalysisTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setPhoneNumber('');
    setDateRange({ start: '', end: '' });
    setUploadedFile(null);
    setResults(null);
    setAnalyzeProgress(0);
    toast.info('Ready for new analysis');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `cdr_analysis_${Date.now()}.json`);
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
        ctx.fillStyle = `rgba(168, 85, 247, ${p.opacity})`;
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
      if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      setUploadedFile(file);
      toast.success(`File "${file.name}" uploaded`);
    }
  };

  const handleAnalyze = async () => {
    if (!phoneNumber.trim() && !uploadedFile) {
      toast.error('Please enter a phone number or upload a CDR file');
      return;
    }

    trackToolUsage('cdr-analysis', 'analyze', 'start');
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
        targetNumber: phoneNumber || 'Uploaded CDR',
        analysisDate: new Date().toISOString(),
        dateRange: dateRange.start && dateRange.end ? `${dateRange.start} to ${dateRange.end}` : 'Last 30 days',
        summary: {
          totalRecords: 1847,
          totalIncoming: 623,
          totalOutgoing: 892,
          totalMissed: 156,
          totalSMS: 176,
          totalDuration: '48:32:15',
          averageCallDuration: '1:34',
          uniqueContacts: 89,
          mostActiveDay: 'Wednesday',
          mostActiveHour: '18:00 - 19:00',
        },
        callPatterns: {
          peakHours: [
            { hour: '09:00-10:00', calls: 145 },
            { hour: '18:00-19:00', calls: 198 },
            { hour: '20:00-21:00', calls: 167 },
          ],
          weekdayDistribution: {
            Monday: 234,
            Tuesday: 256,
            Wednesday: 312,
            Thursday: 287,
            Friday: 298,
            Saturday: 245,
            Sunday: 215,
          },
          callTypeBreakdown: {
            local: 1245,
            std: 456,
            isd: 12,
            roaming: 134,
          },
        },
        topContacts: [
          { number: '+91 98XXX XXXXX', name: 'REDACTED', calls: 156, duration: '4:23:45', type: 'Frequent' },
          { number: '+91 87XXX XXXXX', name: 'REDACTED', calls: 98, duration: '2:45:12', type: 'Frequent' },
          { number: '+91 76XXX XXXXX', name: 'REDACTED', calls: 67, duration: '1:56:34', type: 'Regular' },
          { number: '+91 65XXX XXXXX', name: 'Unknown', calls: 45, duration: '1:12:23', type: 'Regular' },
          { number: '+91 54XXX XXXXX', name: 'Unknown', calls: 34, duration: '0:45:56', type: 'Occasional' },
        ],
        towerLocations: [
          { lac: '12345', cellId: '67890', location: 'Andheri West, Mumbai', count: 456, percentage: 24.7 },
          { lac: '12346', cellId: '67891', location: 'Bandra, Mumbai', count: 312, percentage: 16.9 },
          { lac: '12347', cellId: '67892', location: 'Juhu, Mumbai', count: 234, percentage: 12.7 },
          { lac: '12348', cellId: '67893', location: 'Malad, Mumbai', count: 189, percentage: 10.2 },
          { lac: '12349', cellId: '67894', location: 'Goregaon, Mumbai', count: 156, percentage: 8.4 },
        ],
        suspiciousPatterns: [
          { type: 'Unusual Activity', description: 'High call volume at 3 AM on 15th Jan', severity: 'Medium' },
          { type: 'New Contact', description: '12 calls to new number in 24 hours', severity: 'Low' },
          { type: 'Location Change', description: 'Rapid tower changes detected on 18th Jan', severity: 'High' },
        ],
        imeiHistory: [
          { imei: '35XXXXXXXXXX001', firstSeen: '2024-01-01', lastSeen: '2024-01-09', calls: 1847, status: 'Current' },
        ],
        recentCalls: [
          { timestamp: '2024-01-09 18:45:32', number: '+91 98XXX XXXXX', type: 'Outgoing', duration: '00:05:23', tower: 'Andheri West' },
          { timestamp: '2024-01-09 17:23:12', number: '+91 87XXX XXXXX', type: 'Incoming', duration: '00:02:45', tower: 'Andheri West' },
          { timestamp: '2024-01-09 15:12:45', number: '+91 76XXX XXXXX', type: 'Outgoing', duration: '00:08:12', tower: 'Bandra' },
          { timestamp: '2024-01-09 12:34:56', number: '+91 65XXX XXXXX', type: 'Missed', duration: '00:00:00', tower: 'Andheri West' },
          { timestamp: '2024-01-09 10:23:34', number: '+91 54XXX XXXXX', type: 'Incoming', duration: '00:03:45', tower: 'Juhu' },
        ],
      };

      setResults(resultData);
      addToHistory({
        tool: 'CDR Analysis',
        query: phoneNumber || uploadedFile?.name,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      setIsAnalyzing(false);
      toast.success('CDR analysis completed');
    }, 5000);
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'contacts', label: 'Top Contacts', icon: Users },
    { id: 'patterns', label: 'Patterns', icon: TrendingUp },
    { id: 'towers', label: 'Tower Data', icon: MapPin },
    { id: 'suspicious', label: 'Alerts', icon: AlertTriangle },
    { id: 'calls', label: 'Recent Calls', icon: PhoneCall },
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
        className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-purple-950/30 to-gray-900 rounded-2xl border border-purple-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-purple-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">CDR Analysis</h2>
              <p className="text-xs sm:text-sm text-purple-400/80 truncate hidden sm:block">Call Detail Records forensic analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-200 hidden sm:inline">New Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!results}
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-violet-200">Export JSON</span>
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
                <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                  <label className="block text-sm text-purple-400 mb-2 font-mono">TARGET NUMBER</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 XXXXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-purple-500/30 focus:border-purple-500 outline-none text-white font-mono placeholder-gray-600"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                  <label className="block text-sm text-purple-400 mb-2 font-mono">UPLOAD CDR FILE</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-lg bg-gray-900 border border-dashed border-purple-500/30 hover:border-purple-500 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {uploadedFile ? uploadedFile.name : 'Upload CSV/Excel'}
                  </button>
                </div>
              </div>

              {/* Date Range */}
              <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                <label className="block text-sm text-purple-400 mb-2 font-mono">DATE RANGE (Optional)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-purple-500/30 focus:border-purple-500 outline-none text-white"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-purple-500/30 focus:border-purple-500 outline-none text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <PhoneCall className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Call Analysis</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <MapPin className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Tower Mapping</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Pattern Detection</p>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:from-purple-400 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <BarChart3 className="w-6 h-6" />
                    </motion.div>
                    Analyzing CDR... {analyzeProgress}%
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-6 h-6" />
                    Analyze CDR Data
                  </>
                )}
              </button>

              {isAnalyzing && (
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${analyzeProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-violet-500/10 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-mono">{results.targetNumber}</p>
                      <p className="text-purple-400">{results.dateRange} • {results.summary.totalRecords} records</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-green-400">{results.summary.totalIncoming}</p>
                      <p className="text-xs text-gray-500">Incoming</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-blue-400">{results.summary.totalOutgoing}</p>
                      <p className="text-xs text-gray-500">Outgoing</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-red-400">{results.summary.totalMissed}</p>
                      <p className="text-xs text-gray-500">Missed</p>
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
                        ? 'bg-purple-500 text-white'
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
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                      <h3 className="text-sm font-mono text-purple-400 mb-3">CALL STATISTICS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Total Records</span><span className="text-white">{results.summary.totalRecords}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Total Duration</span><span className="text-white">{results.summary.totalDuration}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Avg Duration</span><span className="text-white">{results.summary.averageCallDuration}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">SMS Count</span><span className="text-white">{results.summary.totalSMS}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                      <h3 className="text-sm font-mono text-purple-400 mb-3">CONTACT STATS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Unique Contacts</span><span className="text-white">{results.summary.uniqueContacts}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Most Active Day</span><span className="text-white">{results.summary.mostActiveDay}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Peak Hour</span><span className="text-white">{results.summary.mostActiveHour}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                      <h3 className="text-sm font-mono text-purple-400 mb-3">CALL TYPES</h3>
                      <div className="space-y-2">
                        {Object.entries(results.callPatterns.callTypeBreakdown).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{type}</span>
                            <span className="text-white">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'contacts' && (
                  <motion.div
                    key="contacts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.topContacts.map((contact, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-white font-mono">{contact.number}</p>
                            <p className="text-sm text-gray-500">{contact.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <p className="text-white">{contact.calls} calls</p>
                            <p className="text-xs text-gray-500">{contact.duration}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${contact.type === 'Frequent' ? 'bg-green-500/20 text-green-400' : contact.type === 'Regular' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {contact.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'patterns' && (
                  <motion.div
                    key="patterns"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                      <h3 className="text-sm font-mono text-purple-400 mb-3">PEAK HOURS</h3>
                      <div className="space-y-2">
                        {results.callPatterns.peakHours.map((hour, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-28">{hour.hour}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                                style={{ width: `${(hour.calls / 200) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12">{hour.calls}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20">
                      <h3 className="text-sm font-mono text-purple-400 mb-3">WEEKDAY DISTRIBUTION</h3>
                      <div className="space-y-2">
                        {Object.entries(results.callPatterns.weekdayDistribution).map(([day, count]) => (
                          <div key={day} className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-24">{day}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                                style={{ width: `${(count / 350) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'towers' && (
                  <motion.div
                    key="towers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.towerLocations.map((tower, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-6 h-6 text-purple-400" />
                          <div>
                            <p className="text-white">{tower.location}</p>
                            <p className="text-sm text-gray-500 font-mono">LAC: {tower.lac} | Cell: {tower.cellId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{tower.count} hits</p>
                          <p className="text-sm text-purple-400">{tower.percentage}%</p>
                        </div>
                      </div>
                    ))}
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
                    {results.suspiciousPatterns.map((pattern, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                        pattern.severity === 'High' ? 'bg-red-500/10 border-red-500/30' :
                        pattern.severity === 'Medium' ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-gray-800/50 border-gray-700'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          pattern.severity === 'High' ? 'text-red-400' :
                          pattern.severity === 'Medium' ? 'text-amber-400' :
                          'text-gray-400'
                        }`} />
                        <div>
                          <p className="text-white font-medium">{pattern.type}</p>
                          <p className="text-sm text-gray-400">{pattern.description}</p>
                        </div>
                        <span className={`ml-auto px-2 py-1 rounded text-xs ${
                          pattern.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                          pattern.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {pattern.severity}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'calls' && (
                  <motion.div
                    key="calls"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.recentCalls.map((call, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            call.type === 'Incoming' ? 'bg-green-500/20' :
                            call.type === 'Outgoing' ? 'bg-blue-500/20' :
                            'bg-red-500/20'
                          }`}>
                            {call.type === 'Incoming' ? <PhoneIncoming className="w-5 h-5 text-green-400" /> :
                             call.type === 'Outgoing' ? <PhoneOutgoing className="w-5 h-5 text-blue-400" /> :
                             <PhoneMissed className="w-5 h-5 text-red-400" />}
                          </div>
                          <div>
                            <p className="text-white font-mono">{call.number}</p>
                            <p className="text-sm text-gray-500">{call.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{call.duration}</p>
                          <p className="text-xs text-gray-500">{call.tower}</p>
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

export default CDRAnalysisTool;
