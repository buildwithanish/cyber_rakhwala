import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, X, Search, Zap, User, Shield, AlertTriangle, Clock,
  RefreshCw, Activity, Database, Users, Building2, Home, Globe,
  Phone, Mail, Briefcase, Calendar, Download, Navigation, Map,
  ChevronDown, Filter, Eye
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const PersonLocationTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [searchType, setSearchType] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    age: '',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [searchProgress, setSearchProgress] = useState(0);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setFormData({
      name: '',
      fatherName: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      age: '',
    });
    setResults(null);
    setSearchProgress(0);
    toast.info('Ready for new search');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `person_location_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results?.matches) { toast.error('No results to export'); return; }
    const ok = exportToCSV(formatForExport(results.matches), `person_location_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
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
        ctx.fillStyle = `rgba(251, 146, 60, ${p.opacity})`;
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

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    const { name, area, city, state } = formData;
    if (!name.trim() && !area.trim() && !city.trim()) {
      toast.error('Please enter at least a name, area, or city to search');
      return;
    }

    trackToolUsage('person-location', 'search', 'start');
    setIsSearching(true);
    setSearchProgress(0);
    onConsume?.(20);

    const progressInterval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + 2, 95));
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setSearchProgress(100);

      const searchQuery = [name, area, city, state].filter(Boolean).join(', ');
      
      const resultData = {
        searchQuery,
        searchDate: new Date().toISOString(),
        totalMatches: 47,
        exactMatches: 3,
        partialMatches: 44,
        matches: [
          {
            id: 'PL001',
            name: name || 'Rajesh Kumar',
            fatherName: 'Shyam Kumar',
            age: 34,
            gender: 'Male',
            address: {
              house: '45-A, Shanti Nagar',
              area: area || 'Andheri West',
              city: city || 'Mumbai',
              state: state || 'Maharashtra',
              pincode: '400058',
            },
            phone: '+91 98XXX XXXXX',
            matchScore: 98,
            voterIdLinked: true,
            aadhaarLinked: true,
            lastUpdated: '2024-01-05',
          },
          {
            id: 'PL002',
            name: name || 'Rajesh Kumar Singh',
            fatherName: 'Ram Kumar Singh',
            age: 42,
            gender: 'Male',
            address: {
              house: '12, Gandhi Road',
              area: area || 'Bandra East',
              city: city || 'Mumbai',
              state: state || 'Maharashtra',
              pincode: '400051',
            },
            phone: '+91 87XXX XXXXX',
            matchScore: 85,
            voterIdLinked: true,
            aadhaarLinked: false,
            lastUpdated: '2023-11-20',
          },
          {
            id: 'PL003',
            name: name || 'R. Kumar',
            fatherName: 'K. Narayanan',
            age: 28,
            gender: 'Male',
            address: {
              house: 'Flat 302, Sunrise Apartments',
              area: area || 'Juhu',
              city: city || 'Mumbai',
              state: state || 'Maharashtra',
              pincode: '400049',
            },
            phone: '+91 76XXX XXXXX',
            matchScore: 72,
            voterIdLinked: false,
            aadhaarLinked: true,
            lastUpdated: '2024-01-02',
          },
          {
            id: 'PL004',
            name: name || 'Rajesh Sharma',
            fatherName: 'Mohan Sharma',
            age: 55,
            gender: 'Male',
            address: {
              house: '78, Nehru Colony',
              area: area || 'Malad West',
              city: city || 'Mumbai',
              state: state || 'Maharashtra',
              pincode: '400064',
            },
            phone: '+91 99XXX XXXXX',
            matchScore: 68,
            voterIdLinked: true,
            aadhaarLinked: true,
            lastUpdated: '2023-09-15',
          },
          {
            id: 'PL005',
            name: name || 'Kumar Rajesh',
            fatherName: 'Venkat Rao',
            age: 31,
            gender: 'Male',
            address: {
              house: '23-B, MG Road',
              area: area || 'Goregaon East',
              city: city || 'Mumbai',
              state: state || 'Maharashtra',
              pincode: '400063',
            },
            phone: '+91 88XXX XXXXX',
            matchScore: 61,
            voterIdLinked: false,
            aadhaarLinked: false,
            lastUpdated: '2023-12-10',
          },
        ],
        areaStatistics: {
          totalPopulation: 145000,
          households: 32000,
          avgAge: 35,
          literacyRate: 92.4,
          malePopulation: 76000,
          femalePopulation: 69000,
        },
        nearbyLocations: [
          { name: 'Andheri Railway Station', distance: '1.2 km', type: 'Transport' },
          { name: 'Cooper Hospital', distance: '2.5 km', type: 'Medical' },
          { name: 'D.N. Nagar Police Station', distance: '0.8 km', type: 'Police' },
          { name: 'Lokhandwala Market', distance: '1.5 km', type: 'Commercial' },
        ],
        demographics: {
          ageGroups: {
            '0-18': 28000,
            '19-35': 52000,
            '36-55': 42000,
            '55+': 23000,
          },
          occupations: {
            'Service': 45,
            'Business': 25,
            'Self-employed': 15,
            'Student': 10,
            'Other': 5,
          },
        },
      };

      setResults(resultData);
      addToHistory({
        tool: 'Person Location',
        query: searchQuery,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      setIsSearching(false);
      toast.success(`Found ${resultData.totalMatches} matches`);
    }, 4000);
  };

  const tabs = [
    { id: 'matches', label: 'Matches', icon: Users },
    { id: 'area', label: 'Area Info', icon: Map },
    { id: 'demographics', label: 'Demographics', icon: Building2 },
    { id: 'nearby', label: 'Nearby', icon: Navigation },
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
        className="relative w-full max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-orange-950/30 to-gray-900 rounded-2xl border border-orange-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-orange-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">Person Location</h2>
              <p className="text-xs sm:text-sm text-orange-400/80 truncate hidden sm:block">Search by Name, Area, City, State</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-orange-200 hidden sm:inline">New Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!results}
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-200">Export JSON</span>
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">20</span>
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
              {/* Search Form */}
              <div className="space-y-4">
                {/* Name */}
                <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                  <label className="block text-sm text-orange-400 mb-2 font-mono">PERSON NAME *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Full name of the person"
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Father's Name & Age */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                    <label className="block text-sm text-orange-400 mb-2 font-mono">FATHER'S NAME</label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      placeholder="Father's name (optional)"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white placeholder-gray-600"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                    <label className="block text-sm text-orange-400 mb-2 font-mono">APPROXIMATE AGE</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Age (optional)"
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Area & City */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                    <label className="block text-sm text-orange-400 mb-2 font-mono">AREA / LOCALITY</label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        placeholder="Area or locality"
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white placeholder-gray-600"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                    <label className="block text-sm text-orange-400 mb-2 font-mono">CITY</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City name"
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white placeholder-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* State & Pincode */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                    <label className="block text-sm text-orange-400 mb-2 font-mono">STATE</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white appearance-none cursor-pointer"
                      >
                        <option value="">Select State</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                    <label className="block text-sm text-orange-400 mb-2 font-mono">PINCODE</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white placeholder-gray-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <Users className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Voter Records</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <Database className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Census Data</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
                  <Map className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Area Mapping</p>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:from-orange-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
              >
                {isSearching ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Search className="w-6 h-6" />
                    </motion.div>
                    Searching... {searchProgress}%
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Search Person
                  </>
                )}
              </button>

              {isSearching && (
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${searchProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{results.searchQuery}</p>
                      <p className="text-orange-400">Search completed on {new Date(results.searchDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-green-400">{results.exactMatches}</p>
                      <p className="text-xs text-gray-500">Exact</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-amber-400">{results.partialMatches}</p>
                      <p className="text-xs text-gray-500">Partial</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-gray-800/50">
                      <p className="text-lg font-bold text-orange-400">{results.totalMatches}</p>
                      <p className="text-xs text-gray-500">Total</p>
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
                        ? 'bg-orange-500 text-white'
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
                {activeTab === 'matches' && (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.matches.map((match, i) => (
                      <div key={match.id} className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              match.matchScore >= 90 ? 'bg-green-500/20' :
                              match.matchScore >= 70 ? 'bg-amber-500/20' :
                              'bg-gray-700/50'
                            }`}>
                              <User className={`w-6 h-6 ${
                                match.matchScore >= 90 ? 'text-green-400' :
                                match.matchScore >= 70 ? 'text-amber-400' :
                                'text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-bold text-white">{match.name}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  match.matchScore >= 90 ? 'bg-green-500/20 text-green-400' :
                                  match.matchScore >= 70 ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {match.matchScore}% Match
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">S/o {match.fatherName} • {match.age} years • {match.gender}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                <span className="text-orange-400/80">{match.address.house}</span>, {match.address.area}, {match.address.city}, {match.address.state} - {match.address.pincode}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              {match.voterIdLinked && (
                                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">Voter ID</span>
                              )}
                              {match.aadhaarLinked && (
                                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs">Aadhaar</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">Updated: {match.lastUpdated}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'area' && (
                  <motion.div
                    key="area"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">AREA STATISTICS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Total Population</span><span className="text-white">{results.areaStatistics.totalPopulation.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Households</span><span className="text-white">{results.areaStatistics.households.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Average Age</span><span className="text-white">{results.areaStatistics.avgAge} years</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Literacy Rate</span><span className="text-white">{results.areaStatistics.literacyRate}%</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">GENDER DISTRIBUTION</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Male</span>
                            <span className="text-white">{results.areaStatistics.malePopulation.toLocaleString()}</span>
                          </div>
                          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(results.areaStatistics.malePopulation / results.areaStatistics.totalPopulation) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">Female</span>
                            <span className="text-white">{results.areaStatistics.femalePopulation.toLocaleString()}</span>
                          </div>
                          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500" style={{ width: `${(results.areaStatistics.femalePopulation / results.areaStatistics.totalPopulation) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'demographics' && (
                  <motion.div
                    key="demographics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">AGE GROUPS</h3>
                      <div className="space-y-2">
                        {Object.entries(results.demographics.ageGroups).map(([range, count]) => (
                          <div key={range} className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-16">{range}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                                style={{ width: `${(count / 55000) * 100}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-16 text-right">{count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">OCCUPATIONS</h3>
                      <div className="space-y-2">
                        {Object.entries(results.demographics.occupations).map(([occupation, percentage]) => (
                          <div key={occupation} className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-28">{occupation}</span>
                            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12 text-right">{percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'nearby' && (
                  <motion.div
                    key="nearby"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.nearbyLocations.map((location, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            location.type === 'Police' ? 'bg-blue-500/20' :
                            location.type === 'Medical' ? 'bg-red-500/20' :
                            location.type === 'Transport' ? 'bg-green-500/20' :
                            'bg-amber-500/20'
                          }`}>
                            <Navigation className={`w-5 h-5 ${
                              location.type === 'Police' ? 'text-blue-400' :
                              location.type === 'Medical' ? 'text-red-400' :
                              location.type === 'Transport' ? 'text-green-400' :
                              'text-amber-400'
                            }`} />
                          </div>
                          <div>
                            <p className="text-white">{location.name}</p>
                            <p className="text-sm text-gray-500">{location.type}</p>
                          </div>
                        </div>
                        <span className="text-orange-400 font-mono">{location.distance}</span>
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

export default PersonLocationTool;
