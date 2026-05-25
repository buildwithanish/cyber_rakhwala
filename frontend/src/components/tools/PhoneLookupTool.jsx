import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, X, Search, Zap, Globe, MapPin, User, Building, Shield,
  Signal, Wifi, AlertTriangle, CheckCircle, Clock, Hash, PhoneCall,
  PhoneIncoming, PhoneOutgoing, MessageSquare, Eye, Map, Copy, RefreshCw,
  Activity, Smartphone, Database, Radio, Calendar, Lock, Unlock, Info
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useCredits } from '../../context/CreditContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { Download } from 'lucide-react';
import phoneLookupService from '../../services/tools/phoneLookupService';
import { adaptPhoneLookupResponse } from '../../utils/toolResponseAdapters';

const PhoneLookupTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { refreshCredits } = useCredits();
  const { copy } = useClipboard();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeView, setActiveView] = useState('info');
  const [signalWaves, setSignalWaves] = useState([]);
  const [dialPadVisible, setDialPadVisible] = useState(true);
  const [inputMethod, setInputMethod] = useState('dialpad');
  const [lastLookupTime, setLastLookupTime] = useState(null);

  // Handle new search - reset for new entry
  const handleRefresh = () => {
    setPhoneNumber('');
    setResults(null);
    setDialPadVisible(true);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };
  
  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `phone_lookup_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };
  
  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `phone_lookup_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Generate signal wave animations
  useEffect(() => {
    if (isSearching) {
      const interval = setInterval(() => {
        setSignalWaves(prev => [...prev.slice(-5), Date.now()]);
      }, 400);
      return () => clearInterval(interval);
    } else {
      setSignalWaves([]);
    }
  }, [isSearching]);

  const handleDialPadPress = (digit) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    trackToolUsage('phone-lookup', 'search', 'start');
    setIsSearching(true);
    setDialPadVisible(false);

    try {
      const settled = await Promise.allSettled([
        phoneLookupService.lookup(phoneNumber),
        phoneLookupService.getCarrier(phoneNumber),
        phoneLookupService.validate(phoneNumber),
        phoneLookupService.checkReputation(phoneNumber)
      ]);

      const responses = {
        lookup: settled[0].status === 'fulfilled' ? settled[0].value : null,
        carrier: settled[1].status === 'fulfilled' ? settled[1].value : null,
        validate: settled[2].status === 'fulfilled' ? settled[2].value : null,
        reputation: settled[3].status === 'fulfilled' ? settled[3].value : null
      };

      if (!Object.values(responses).some(Boolean)) {
        throw settled.find((item) => item.status === 'rejected')?.reason || new Error('Phone lookup failed');
      }

      const resultData = adaptPhoneLookupResponse(phoneNumber, responses);
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('phone-lookup', phoneNumber, resultData);
      trackToolUsage('phone-lookup', 'search', 'success');
      await refreshCredits?.();
      toast.success(resultData.sourceNotice ? 'Phone lookup complete with limited data' : 'Phone lookup complete!');
      if (resultData.sourceNotice) {
        toast.info(resultData.sourceNotice);
      }
    } catch (error) {
      trackToolUsage('phone-lookup', 'search', 'error');
      setDialPadVisible(true);
      toast.error(error.message || 'Phone lookup failed');
    } finally {
      setIsSearching(false);
    }
  };

  const dialPadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
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
        initial={{ scale: 0.8, rotateY: -15, opacity: 0 }}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotateY: 15, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.15)]"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Cell tower signals */}
          <svg className="absolute top-1/4 right-1/4 w-96 h-96 opacity-20">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.circle
                key={i}
                cx="50%"
                cy="50%"
                r={50 + i * 40}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.5, 0], scale: [1, 1.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </svg>

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />

          {/* Signal wave indicators during search */}
          {signalWaves.map(wave => (
            <motion.div
              key={wave}
              initial={{ opacity: 1, scale: 0 }}
              animate={{ opacity: 0, scale: 3 }}
              transition={{ duration: 1.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-amber-500 rounded-full"
            />
          ))}

          {/* Gradient glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-amber-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/40"
                  animate={{ rotate: isSearching ? [0, -5, 5, 0] : 0 }}
                  transition={{ duration: 0.5, repeat: isSearching ? Infinity : 0 }}
                >
                  <Phone className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Signal bars - hidden on mobile */}
                <div className="hidden sm:flex absolute -top-1 -right-1 gap-0.5">
                  {[1, 2, 3].map(bar => (
                    <motion.div
                      key={bar}
                      className="w-1 bg-amber-400 rounded-full"
                      style={{ height: `${bar * 4 + 4}px` }}
                      animate={{ opacity: isSearching ? [1, 0.3, 1] : 1 }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: bar * 0.1 }}
                    />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">Phone Lookup</span>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">OSINT</span>
                </h2>
                <p className="text-xs sm:text-sm text-amber-300/70 flex items-center gap-1 sm:gap-2">
                  <Signal className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">Carrier, location & reputation lookup</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="hidden sm:flex px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">5</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
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
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-amber-200">JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-amber-200">CSV</span>
              </motion.button>
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
          <div className="grid lg:grid-cols-2 gap-3 sm:gap-6">
            {/* Left Panel - Input */}
            <div className="space-y-6">
              {/* Phone Display */}
              <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-sm">
                <div className="mb-3 sm:mb-4">
                  <label className="text-amber-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                    <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
                    Phone Number
                  </label>
                  {/* Phone number display */}
                  <div className="relative mb-3 sm:mb-4">
                    <div className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-800/80 border-2 border-amber-500/30 text-center">
                      <div className="text-xl sm:text-3xl font-mono text-white tracking-wider">
                        {phoneNumber || <span className="text-gray-500">Enter number</span>}
                      </div>
                    </div>
                    {phoneNumber && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPhoneNumber(prev => prev.slice(0, -1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        ⌫
                      </motion.button>
                    )}
                  </div>

                  {/* Input method toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setInputMethod('dialpad')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMethod === 'dialpad' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800/50 text-gray-400'
                      }`}
                    >
                      Dial Pad
                    </button>
                    <button
                      onClick={() => setInputMethod('keyboard')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        inputMethod === 'keyboard'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800/50 text-gray-400'
                      }`}
                    >
                      Keyboard
                    </button>
                  </div>

                  {/* Dial Pad */}
                  <AnimatePresence>
                    {inputMethod === 'dialpad' && dialPadVisible && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        {dialPadKeys.map((row, rowIdx) => (
                          <div key={rowIdx} className="flex gap-3 justify-center">
                            {row.map(key => (
                              <motion.button
                                key={key}
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(245,158,11,0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDialPadPress(key)}
                                className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-amber-500/20 text-2xl font-bold text-white flex items-center justify-center shadow-lg hover:shadow-amber-500/20 transition-all"
                              >
                                {key}
                              </motion.button>
                            ))}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Keyboard Input */}
                  {inputMethod === 'keyboard' && (
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="+1 234 567 8900"
                      className="w-full p-4 rounded-xl bg-slate-800/80 border-2 border-amber-500/30 text-white text-xl font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
                    />
                  )}
                </div>

                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(245,158,11,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  disabled={isSearching || !phoneNumber.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-amber-500/30"
                >
                  {isSearching ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Signal className="w-5 h-5" />
                      </motion.div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-5 h-5" />
                      <span>Lookup Number</span>
                    </>
                  )}
                </motion.button>

                {/* Scanning Animation */}
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6"
                  >
                    <div className="flex items-center justify-around">
                      {['Validating', 'Carrier', 'Location', 'Reputation'].map((step, i) => (
                        <motion.div
                          key={step}
                          className="text-center"
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        >
                          <motion.div
                            className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                          >
                            {[CheckCircle, Signal, MapPin, Shield][i] && 
                              <motion.div className="text-amber-400">
                                {[<CheckCircle className="w-5 h-5" />, <Signal className="w-5 h-5" />, <MapPin className="w-5 h-5" />, <Shield className="w-5 h-5" />][i]}
                              </motion.div>
                            }
                          </motion.div>
                          <div className="text-xs text-amber-300/70">{step}</div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Quick Stats Card */}
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-amber-300/70">Formatted</div>
                      <div className="text-2xl font-bold text-white font-mono">{results.formatted}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl ${
                      results.valid ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-red-500/20 border border-red-500/40'
                    }`}>
                      <div className={`font-bold ${results.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {results.valid ? 'Valid' : 'Invalid'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-xl bg-slate-800/50">
                      <div className="text-lg font-bold text-amber-400">{results.type}</div>
                      <div className="text-xs text-gray-400">Type</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-slate-800/50">
                      <div className="text-lg font-bold text-cyan-400">{results.carrier}</div>
                      <div className="text-xs text-gray-400">Carrier</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-slate-800/50">
                      <div className="text-lg font-bold text-emerald-400">{results.reputation}</div>
                      <div className="text-xs text-gray-400">Reputation</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Panel - Results */}
            <div>
              {results ? (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* View Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'info', label: 'Info', icon: User },
                      { id: 'network', label: 'Network', icon: Radio },
                      { id: 'device', label: 'Device', icon: Smartphone },
                      { id: 'location', label: 'Location', icon: MapPin },
                      { id: 'security', label: 'Security', icon: Shield },
                      { id: 'social', label: 'Social', icon: MessageSquare },
                    ].map(tab => (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveView(tab.id)}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
                          activeView === tab.id
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                            : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-amber-500/20'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeView}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 rounded-2xl bg-slate-900/60 border border-amber-500/20 min-h-[400px]"
                    >
                      {activeView === 'info' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-amber-300 font-semibold flex items-center gap-2">
                              <User className="w-5 h-5" />
                              Number Information
                            </h3>
                            {lastLookupTime && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last checked: {lastLookupTime.toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                          {[
                            { label: 'Carrier', value: results.carrier, icon: Signal },
                            { label: 'Line Type', value: results.lineType, icon: Phone },
                            { label: 'Country', value: results.country, icon: Globe },
                            { label: 'Ported Status', value: results.portedStatus, icon: PhoneOutgoing },
                            { label: 'Owner Type', value: results.owner.type, icon: User },
                            { label: 'Age Range', value: results.owner.age, icon: Clock },
                            { label: 'Number Age', value: results.additionalInfo?.numberAge || 'N/A', icon: Calendar },
                            { label: 'Confidence Score', value: `${results.additionalInfo?.confidenceScore || 0}%`, icon: Activity },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="p-4 rounded-xl bg-slate-800/50 flex items-center justify-between border border-amber-500/10"
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 text-amber-400" />
                                <span className="text-gray-400">{item.label}</span>
                              </div>
                              <span className="text-white font-medium">{item.value}</span>
                            </motion.div>
                          ))}
                          
                          {/* Call Activity Section */}
                          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                            <h4 className="text-amber-300 text-sm font-medium mb-3 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Call Activity
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Usage Level</span>
                                <span className="text-amber-300 font-medium">{results.callActivity?.avgDailyUsage || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Last Active</span>
                                <span className="text-emerald-300 font-medium">{results.callActivity?.lastActivity || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">SMS Capable</span>
                                <span className={results.callActivity?.smsCapable ? 'text-emerald-400' : 'text-red-400'}>
                                  {results.callActivity?.smsCapable ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Intl. Calls</span>
                                <span className={results.callActivity?.internationalCalls ? 'text-emerald-400' : 'text-gray-500'}>
                                  {results.callActivity?.internationalCalls ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Network Details Tab */}
                      {activeView === 'network' && (
                        <div className="space-y-4">
                          <h3 className="text-amber-300 font-semibold mb-4 flex items-center gap-2">
                            <Radio className="w-5 h-5" />
                            Network Details
                          </h3>
                          
                          {/* Network Info */}
                          <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-400 text-sm">Network Type</div>
                                <div className="text-cyan-300 font-bold text-lg">{results.networkDetails?.networkType || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Signal Strength</div>
                                <div className="text-emerald-300 font-bold text-lg flex items-center gap-2">
                                  <Signal className="w-4 h-4" />
                                  {results.networkDetails?.signalStrength || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">MCC</div>
                                <div className="text-white font-mono">{results.networkDetails?.mcc || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">MNC</div>
                                <div className="text-white font-mono">{results.networkDetails?.mnc || 'N/A'}</div>
                              </div>
                            </div>
                          </div>

                          {/* SIM Information */}
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/10">
                            <h4 className="text-amber-300 text-sm font-medium mb-3 flex items-center gap-2">
                              <Database className="w-4 h-4" />
                              SIM Information
                            </h4>
                            <div className="space-y-3">
                              {[
                                { label: 'SIM Type', value: results.simInfo?.simType || 'N/A' },
                                { label: 'SIM Status', value: results.simInfo?.simStatus || 'N/A', highlight: true },
                                { label: 'Activation Date', value: results.simInfo?.activationDate || 'N/A' },
                                { label: 'IMSI', value: results.simInfo?.imsi || 'N/A', mono: true },
                                { label: 'ICCID', value: results.simInfo?.iccid || 'N/A', mono: true },
                              ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                  <span className="text-gray-400 text-sm">{item.label}</span>
                                  <span className={`${item.mono ? 'font-mono text-xs' : 'font-medium'} ${item.highlight ? 'text-emerald-400' : 'text-white'}`}>
                                    {item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* MNP History */}
                          <div className="p-4 rounded-xl bg-slate-800/50 border border-amber-500/10">
                            <h4 className="text-amber-300 text-sm font-medium mb-3 flex items-center gap-2">
                              <PhoneOutgoing className="w-4 h-4" />
                              Port History (MNP)
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Original Carrier</span>
                                <span className="text-white font-medium">{results.mnpHistory?.originalCarrier || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Port Date</span>
                                <span className="text-white font-medium">{results.mnpHistory?.portDate || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Times Ported</span>
                                <span className="text-amber-300 font-bold">{results.mnpHistory?.portCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Device Tab */}
                      {activeView === 'device' && (
                        <div className="space-y-4">
                          <h3 className="text-amber-300 font-semibold mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            Device Information
                          </h3>
                          
                          <div className="p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                            <div className="text-center mb-4">
                              <Smartphone className="w-16 h-16 text-purple-400 mx-auto mb-2" />
                              <div className="text-white font-bold text-xl">{results.deviceInfo?.deviceType || 'Unknown'}</div>
                              <div className="text-purple-300">{results.deviceInfo?.osType || 'Unknown OS'}</div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {[
                              { label: 'Device Type', value: results.deviceInfo?.deviceType || 'N/A', icon: Smartphone },
                              { label: 'Operating System', value: results.deviceInfo?.osType || 'N/A', icon: Info },
                              { label: 'Device Age', value: results.deviceInfo?.deviceAge || 'N/A', icon: Calendar },
                              { label: 'Last Seen', value: results.deviceInfo?.lastSeen ? new Date(results.deviceInfo.lastSeen).toLocaleString() : 'N/A', icon: Clock },
                              { label: 'Voicemail', value: results.callActivity?.voicemailEnabled ? 'Enabled' : 'Disabled', icon: PhoneIncoming },
                              { label: 'MMS Capable', value: results.callActivity?.mmsCapable ? 'Yes' : 'No', icon: MessageSquare },
                            ].map((item, i) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-xl bg-slate-800/50 flex items-center justify-between border border-purple-500/10"
                              >
                                <div className="flex items-center gap-3">
                                  <item.icon className="w-5 h-5 text-purple-400" />
                                  <span className="text-gray-400">{item.label}</span>
                                </div>
                                <span className="text-white font-medium">{item.value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeView === 'location' && (
                        <div className="space-y-4">
                          <h3 className="text-amber-300 font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Location Details
                          </h3>
                          <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-gray-400 text-sm">Country</div>
                                <div className="text-white font-semibold flex items-center gap-2">
                                  <span className="text-2xl">🇺🇸</span>
                                  {results.country}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Region</div>
                                <div className="text-white font-semibold">{results.region}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">City</div>
                                <div className="text-white font-semibold">{results.city}</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-sm">Timezone</div>
                                <div className="text-amber-300 font-semibold">{results.timezone}</div>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Clock className="w-5 h-5 text-amber-400" />
                              <span className="text-gray-400">Local Time</span>
                            </div>
                            <span className="text-white font-mono">{results.localTime}</span>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-800/50">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                              <Map className="w-4 h-4" />
                              Coordinates
                            </div>
                            <div className="text-white font-mono">
                              {results.coordinates.lat.toFixed(4)}, {results.coordinates.lng.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeView === 'security' && (
                        <div className="space-y-4">
                          <h3 className="text-amber-300 font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Security Analysis
                          </h3>
                          
                          {/* Risk Score Cards */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`p-5 rounded-xl ${results.spamScore < 30 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                              <div className="text-3xl font-bold text-center mb-2">
                                <span className={results.spamScore < 30 ? 'text-emerald-400' : 'text-red-400'}>
                                  {results.spamScore}%
                                </span>
                              </div>
                              <div className="text-center text-gray-400 text-sm">Spam Score</div>
                            </div>
                            <div className={`p-5 rounded-xl ${!results.robocall ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                              <div className="text-center mb-2">
                                {results.robocall ? (
                                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                                ) : (
                                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                                )}
                              </div>
                              <div className="text-center text-gray-400 text-sm">
                                {results.robocall ? 'Robocall Risk' : 'No Robocall'}
                              </div>
                            </div>
                          </div>

                          {/* Fraud Indicators */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
                            <h4 className="text-red-300 text-sm font-medium mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Fraud Indicators
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Risk Level</span>
                                <span className={`font-bold ${
                                  results.fraudIndicators?.riskLevel === 'Low' ? 'text-emerald-400' :
                                  results.fraudIndicators?.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                                }`}>{results.fraudIndicators?.riskLevel || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Risk Score</span>
                                <span className="text-white font-bold">{results.fraudIndicators?.riskScore || 0}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Fraud Reports</span>
                                <span className="text-white font-medium">{results.fraudIndicators?.fraudReports || 0}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm">Blacklist</span>
                                <span className={results.fraudIndicators?.blacklistStatus === 'Clean' ? 'text-emerald-400' : 'text-red-400'}>
                                  {results.fraudIndicators?.blacklistStatus || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Number Type Indicators */}
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: 'Disposable', value: results.fraudIndicators?.disposableNumber, bad: true },
                              { label: 'Virtual', value: results.fraudIndicators?.virtualNumber, bad: true },
                              { label: 'Toll Free', value: results.fraudIndicators?.tollFree },
                              { label: 'Premium', value: results.fraudIndicators?.premium, bad: true },
                            ].map(item => (
                              <div key={item.label} className={`p-3 rounded-xl text-center ${
                                item.value 
                                  ? (item.bad ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30')
                                  : 'bg-slate-800/50 border border-slate-700/30'
                              }`}>
                                {item.value ? (
                                  item.bad ? <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" /> : <CheckCircle className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                                ) : (
                                  <CheckCircle className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                )}
                                <div className="text-xs text-gray-400">{item.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Standard Security Info */}
                          <div className="space-y-3">
                            {[
                              { label: 'Reports Count', value: results.reportsCount, icon: Database },
                              { label: 'Last Reported', value: results.lastReported, icon: Calendar },
                              { label: 'Roaming', value: results.roaming ? 'Yes' : 'No', icon: Globe },
                              { label: 'Reachable', value: results.reachable ? 'Yes' : 'No', icon: results.reachable ? Unlock : Lock },
                            ].map(item => (
                              <div key={item.label} className="p-3 rounded-xl bg-slate-800/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <item.icon className="w-4 h-4 text-amber-400" />
                                  <span className="text-gray-400">{item.label}</span>
                                </div>
                                <span className="text-white">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeView === 'social' && (
                        <div className="space-y-4">
                          <h3 className="text-amber-300 font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Social & Messaging
                          </h3>
                          <div className="grid gap-3">
                            {results.socialProfiles.map((profile, i) => (
                              <motion.div
                                key={profile.platform}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className={`p-4 rounded-xl flex items-center justify-between ${
                                  profile.registered 
                                    ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                    : 'bg-slate-800/50 border border-slate-700/50'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    profile.registered ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                                  }`}>
                                    <MessageSquare className={`w-6 h-6 ${profile.registered ? 'text-emerald-400' : 'text-gray-500'}`} />
                                  </div>
                                  <div>
                                    <div className={`font-semibold ${profile.registered ? 'text-white' : 'text-gray-500'}`}>
                                      {profile.platform}
                                    </div>
                                    <div className={`text-sm ${profile.registered ? 'text-emerald-300' : 'text-gray-600'}`}>
                                      {profile.registered ? 'Registered' : 'Not Found'}
                                    </div>
                                  </div>
                                </div>
                                {profile.registered && (
                                  <Eye className="w-5 h-5 text-emerald-400" />
                                )}
                              </motion.div>
                            ))}
                          </div>

                          {results.relatedNumbers.length > 0 && (
                            <div className="mt-6 p-4 rounded-xl bg-slate-800/50">
                              <div className="text-gray-400 text-sm mb-3">Related Numbers</div>
                              <div className="flex flex-wrap gap-2">
                                {results.relatedNumbers.map((num, i) => (
                                  <span key={i} className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm border border-amber-500/30 font-mono">
                                    {num}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center p-10">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Phone className="w-24 h-24 text-amber-500/30 mx-auto mb-6" />
                    </motion.div>
                    <h3 className="text-xl text-gray-400 mb-2">Enter a phone number</h3>
                    <p className="text-gray-500 text-sm">Use the dial pad or type to search</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhoneLookupTool;
