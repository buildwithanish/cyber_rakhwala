import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, X, Search, Zap, Globe, Navigation, Compass, Map,
  Target, Building, Wifi, Clock, Cloud, Thermometer, Wind,
  Sun, Moon, Eye, Copy, ExternalLink, Crosshair, RefreshCw
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { Download } from 'lucide-react';

const GeolocationTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState('ip');
  const [isLocating, setIsLocating] = useState(false);
  const [results, setResults] = useState(null);
  const [radarAngle, setRadarAngle] = useState(0);
  const [pingRings, setPingRings] = useState([]);
  const [lastLookupTime, setLastLookupTime] = useState(null);
  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `geolocation_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `geolocation_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Radar animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle(prev => (prev + 2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Ping rings during search
  useEffect(() => {
    if (isLocating) {
      const interval = setInterval(() => {
        setPingRings(prev => [...prev.slice(-3), Date.now()]);
      }, 600);
      return () => clearInterval(interval);
    } else {
      setPingRings([]);
    }
  }, [isLocating]);

  const handleLocate = async () => {
    if (!input.trim()) {
      toast.error('Please enter an IP address or domain');
      return;
    }
    
    trackToolUsage('geolocation', 'locate', 'start');
    setIsLocating(true);
    onConsume?.(5);

    setTimeout(() => {
      const resultData = {
        query: input,
        type: inputType,
        ip: inputType === 'ip' ? input : '104.16.132.229',
        location: {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
          accuracy: '~5 km',
        },
        address: {
          city: 'San Francisco',
          region: 'California',
          regionCode: 'CA',
          country: 'United States',
          countryCode: 'US',
          postal: '94102',
          continent: 'North America',
        },
        network: {
          isp: 'Cloudflare, Inc.',
          org: 'Cloudflare',
          asn: 'AS13335',
          domain: 'cloudflare.com',
          type: 'Business',
          proxy: false,
          vpn: false,
          tor: false,
          hosting: true,
        },
        timezone: {
          name: 'America/Los_Angeles',
          abbr: 'PST',
          offset: -8,
          localTime: new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' }),
          isDST: false,
        },
        weather: {
          temp: 18,
          condition: 'Partly Cloudy',
          humidity: 65,
          wind: '12 km/h NW',
          sunrise: '06:45 AM',
          sunset: '05:32 PM',
        },
        currency: {
          code: 'USD',
          symbol: '$',
          name: 'US Dollar',
        },
        languages: ['English'],
        callingCode: '+1',
      };
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('geolocation', input, resultData);
      trackToolUsage('geolocation', 'locate', 'success');
      toast.success('Geolocation complete!');
      setIsLocating(false);
    }, 2500);
  };

  const handleRefresh = () => {
    setInput('');
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
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
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-green-950/20 to-slate-950 border border-green-500/30 shadow-[0_0_100px_rgba(34,197,94,0.15)]"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Map grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(90deg, #22c55e 1px, transparent 1px),
              linear-gradient(#22c55e 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }} />

          {/* Radar in corner */}
          <div className="absolute top-20 right-20 w-48 h-48 opacity-20">
            <svg className="w-full h-full">
              <circle cx="50%" cy="50%" r="20%" fill="none" stroke="#22c55e" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="35%" fill="none" stroke="#22c55e" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="50%" fill="none" stroke="#22c55e" strokeWidth="1" />
              <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
              <motion.g
                style={{ transformOrigin: '50% 50%' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <line x1="50%" y1="50%" x2="50%" y2="5%" stroke="#22c55e" strokeWidth="2" />
                <path
                  d="M 96 96 L 96 10 A 86 86 0 0 0 60 15 Z"
                  fill="url(#radarGradient)"
                  opacity="0.3"
                />
              </motion.g>
              <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Ping rings */}
          {pingRings.map(ring => (
            <motion.div
              key={ring}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 2 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-green-500 rounded-full"
            />
          ))}

          {/* Gradient glows */}
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-green-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/40"
                >
                  <MapPin className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Compass animation */}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-slate-900 border border-green-500/50 hidden sm:flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                >
                  <Navigation className="w-2 h-2 sm:w-3 sm:h-3 text-green-400" />
                </motion.div>
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="hidden sm:inline">Geolocation Tracker</span>
                  <span className="sm:hidden">Geo Tracker</span>
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-green-500/20 text-green-300 rounded-full border border-green-500/30 hidden sm:inline">OSINT</span>
                </h2>
                <p className="text-xs sm:text-sm text-green-300/70 flex items-center gap-2">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">IP & coordinate location intelligence</span>
                  <span className="sm:hidden">Location intelligence</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleRefresh}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all flex items-center gap-2"
                              title="New Search"
                            >
                              <RefreshCw className="w-5 h-5 text-green-400" />
                              <span className="text-xs text-green-200">New Search</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              disabled={!results}
                              onClick={handleExportJSON}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
                            >
                              <Download className="w-5 h-5 text-teal-400" />
                              <span className="text-xs text-teal-200">Export JSON</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              disabled={!results}
                              onClick={handleExportCSV}
                              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-teal-500/20 border border-white/10 hover:border-teal-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
                            >
                              <Download className="w-5 h-5 text-teal-400" />
                              <span className="text-xs text-teal-200">Export CSV</span>
                            </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">5</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(92vh-100px)]">
          {/* Input Section */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-green-500/20 backdrop-blur-sm">
            {/* Input Type Toggle */}
            <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4">
              {[
                { id: 'ip', label: 'IP Address', icon: Wifi },
                { id: 'coords', label: 'Coordinates', icon: Crosshair },
                { id: 'address', label: 'Address', icon: Building },
              ].map(type => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setInputType(type.id)}
                  className={`flex-1 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base font-medium transition-all ${
                    inputType === type.id
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-green-500/20'
                  }`}
                >
                  <type.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.id === 'ip' ? 'IP' : type.id === 'coords' ? 'Coords' : 'Addr'}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Target className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    inputType === 'ip' ? '8.8.8.8 or 2001:4860:4860::8888' :
                    inputType === 'coords' ? '37.7749, -122.4194' :
                    '1600 Amphitheatre Parkway, Mountain View, CA'
                  }
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-green-500/30 text-white text-base sm:text-lg placeholder-gray-500 focus:outline-none focus:border-green-400 focus:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleLocate()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(34,197,94,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLocate}
                disabled={isLocating || !input.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-green-500/30"
              >
                {isLocating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Compass className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
                <span>{isLocating ? 'Locating...' : 'Locate'}</span>
              </motion.button>
            </div>

            {/* Locating Animation */}
            {isLocating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <motion.div
                  className="w-32 h-32 mx-auto relative"
                >
                  <svg className="w-full h-full">
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeDasharray="10 5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      style={{ transformOrigin: 'center' }}
                    />
                    <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.5" />
                    <circle cx="50%" cy="50%" r="15%" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.5" />
                  </svg>
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <MapPin className="w-8 h-8 text-green-400" />
                  </motion.div>
                </motion.div>
                <div className="text-green-300 mt-4">Triangulating location...</div>
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
                {/* Location Overview */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {results.address.city}, {results.address.regionCode}
                        </div>
                        <div className="text-green-300/70">
                          {results.address.country} • {results.address.continent}
                        </div>
                        <div className="text-gray-400 text-sm font-mono mt-1">
                          {results.location.latitude.toFixed(6)}, {results.location.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="px-4 py-2 rounded-xl bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-2"
                      >
                        <Map className="w-4 h-4" />
                        View Map
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigator.clipboard.writeText(`${results.location.latitude}, ${results.location.longitude}`)}
                        className="px-4 py-2 rounded-xl bg-slate-800/50 text-gray-300 border border-slate-700/50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Network Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-green-500/20"
                  >
                    <h3 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      Network Information
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'IP Address', value: results.ip },
                        { label: 'ISP', value: results.network.isp },
                        { label: 'Organization', value: results.network.org },
                        { label: 'ASN', value: results.network.asn },
                        { label: 'Type', value: results.network.type },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between">
                          <span className="text-gray-400 text-sm">{item.label}</span>
                          <span className="text-white text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-500/20 flex gap-3">
                      {[
                        { label: 'VPN', active: results.network.vpn },
                        { label: 'Proxy', active: results.network.proxy },
                        { label: 'Tor', active: results.network.tor },
                      ].map(item => (
                        <div key={item.label} className={`flex-1 text-center p-2 rounded-lg ${
                          item.active ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                        }`}>
                          <div className="text-xs">{item.label}</div>
                          <div className="font-semibold">{item.active ? 'Yes' : 'No'}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Address Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-green-500/20"
                  >
                    <h3 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Address Details
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'City', value: results.address.city },
                        { label: 'Region', value: `${results.address.region} (${results.address.regionCode})` },
                        { label: 'Country', value: `${results.address.country} (${results.address.countryCode})` },
                        { label: 'Postal Code', value: results.address.postal },
                        { label: 'Continent', value: results.address.continent },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between">
                          <span className="text-gray-400 text-sm">{item.label}</span>
                          <span className="text-white text-sm font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Timezone */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-green-500/20"
                  >
                    <h3 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Time Zone
                    </h3>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-white">{results.timezone.localTime}</div>
                      <div className="text-green-300/70">{results.timezone.name}</div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Abbreviation', value: results.timezone.abbr },
                        { label: 'UTC Offset', value: `UTC${results.timezone.offset >= 0 ? '+' : ''}${results.timezone.offset}` },
                        { label: 'DST Active', value: results.timezone.isDST ? 'Yes' : 'No' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between">
                          <span className="text-gray-400 text-sm">{item.label}</span>
                          <span className="text-white text-sm">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Weather */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
                  >
                    <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                      <Cloud className="w-5 h-5" />
                      Current Weather
                    </h3>
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-white">{results.weather.temp}°C</div>
                      <div className="text-blue-300/70">{results.weather.condition}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                        <Thermometer className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="text-xs text-gray-400">Humidity</div>
                        <div className="text-white text-sm">{results.weather.humidity}%</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                        <Wind className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <div className="text-xs text-gray-400">Wind</div>
                        <div className="text-white text-sm">{results.weather.wind}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                        <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-xs text-gray-400">Sunrise</div>
                        <div className="text-white text-sm">{results.weather.sunrise}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                        <Moon className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                        <div className="text-xs text-gray-400">Sunset</div>
                        <div className="text-white text-sm">{results.weather.sunset}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Country Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-green-500/20 lg:col-span-2"
                  >
                    <h3 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Country Information
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/50 text-center">
                        <div className="text-3xl mb-2">🇺🇸</div>
                        <div className="text-white font-semibold">{results.address.country}</div>
                        <div className="text-gray-400 text-sm">{results.address.countryCode}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/50">
                        <div className="text-gray-400 text-sm mb-1">Currency</div>
                        <div className="text-white font-semibold">{results.currency.name}</div>
                        <div className="text-green-400">{results.currency.symbol} ({results.currency.code})</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/50">
                        <div className="text-gray-400 text-sm mb-1">Calling Code</div>
                        <div className="text-2xl font-bold text-white">{results.callingCode}</div>
                        <div className="text-gray-400 text-sm">{results.languages.join(', ')}</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isLocating && (
            <div className="text-center py-20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Globe className="w-24 h-24 text-green-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter an IP or location</h3>
              <p className="text-gray-500">Get detailed geolocation intelligence</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GeolocationTool;
