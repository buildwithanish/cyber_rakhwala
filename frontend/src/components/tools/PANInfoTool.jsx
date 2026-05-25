import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, X, Search, Zap, User, Shield, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Activity, Database, Building,
  Calendar, FileText, IndianRupee, Briefcase, MapPin
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const PANInfoTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [panNumber, setPanNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchProgress, setSearchProgress] = useState(0);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setPanNumber('');
    setResults(null);
    setSearchProgress(0);
    toast.info('Ready for new search');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `pan_info_${Date.now()}.json`);
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
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
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

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]$/;
    return panRegex.test(pan.toUpperCase());
  };

  const handleSearch = async () => {
    const cleanPAN = panNumber.toUpperCase().trim();
    if (!validatePAN(cleanPAN)) {
      toast.error('Please enter a valid PAN number (e.g., ABCDE1234F)');
      return;
    }

    trackToolUsage('pan-info', 'search', 'start');
    setIsSearching(true);
    setSearchProgress(0);
    onConsume?.(12);

    const progressInterval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + 3, 95));
    }, 80);

    setTimeout(() => {
      clearInterval(progressInterval);
      setSearchProgress(100);

      const panTypes = {
        'A': 'Association of Persons (AOP)',
        'B': 'Body of Individuals (BOI)',
        'C': 'Company',
        'F': 'Firm/LLP',
        'G': 'Government',
        'H': 'Hindu Undivided Family (HUF)',
        'L': 'Local Authority',
        'J': 'Artificial Juridical Person',
        'P': 'Individual',
        'T': 'Trust',
        'K': 'Krishi'
      };

      const fourthChar = cleanPAN.charAt(3);
      const panType = panTypes[fourthChar] || 'Unknown';

      const resultData = {
        panNumber: cleanPAN,
        valid: true,
        basic: {
          name: 'REDACTED',
          fatherName: 'REDACTED',
          dateOfBirth: 'XX-XX-XXXX',
          panType: panType,
          panTypeCode: fourthChar,
          issuingAuthority: 'Income Tax Department',
          jurisdiction: 'Mumbai',
          jurisdictionCode: 'MUM-C',
          status: 'Active',
          lastUpdated: '2023-05-10',
        },
        aadhaarSeeding: {
          linked: true,
          linkDate: '2021-06-15',
          maskedAadhaar: 'XXXX XXXX 1234',
          seedingStatus: 'Operative',
        },
        taxInfo: {
          assessee: 'Individual',
          assessingOfficer: 'ITO Ward-1(3), Mumbai',
          itrFiled: true,
          lastItrYear: 'AY 2024-25',
          lastItrDate: '2024-07-31',
          totalItrsFiled: 8,
          defaulter: false,
        },
        gstInfo: {
          gstRegistered: false,
          gstNumber: null,
          gstStatus: 'Not Applicable',
        },
        directorships: [
          { companyName: 'REDACTED Pvt Ltd', cin: 'U72200MH2020PTCXXXXXX', designation: 'Director', appointmentDate: '2020-01-15', status: 'Active' },
        ],
        financialProfile: {
          estimatedIncomeRange: '₹10-25 Lakhs',
          investorType: 'Individual Retail',
          demat: true,
          tradingActive: true,
          mutualFunds: true,
          insuranceLinked: true,
        },
        linkedEntities: {
          bankAccounts: 4,
          dematAccounts: 2,
          propertyDeeds: 1,
          vehicleRC: 2,
          insurancePolicies: 3,
        },
        complianceHistory: [
          { year: 'AY 2024-25', itrFiled: true, filingDate: '2024-07-31', formType: 'ITR-2', status: 'Processed' },
          { year: 'AY 2023-24', itrFiled: true, filingDate: '2023-07-29', formType: 'ITR-2', status: 'Processed' },
          { year: 'AY 2022-23', itrFiled: true, filingDate: '2022-07-30', formType: 'ITR-1', status: 'Processed' },
        ],
      };

      setResults(resultData);
      addToHistory({
        tool: 'PAN Info',
        query: cleanPAN,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      setIsSearching(false);
      toast.success('PAN information retrieved');
    }, 3000);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'tax', label: 'Tax Details', icon: IndianRupee },
    { id: 'linked', label: 'Linked Entities', icon: Database },
    { id: 'director', label: 'Directorships', icon: Briefcase },
    { id: 'compliance', label: 'Compliance', icon: FileText },
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
        className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-emerald-950/30 to-gray-900 rounded-2xl border border-emerald-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-3 sm:p-4 border-b border-emerald-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">PAN Info</h2>
              <p className="text-xs sm:text-sm text-emerald-400/80 hidden sm:block">Income Tax database lookup</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-200">New Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!results}
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-200">Export JSON</span>
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">18</span>
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
        <div className="relative z-10 p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-70px)] sm:max-h-[calc(90vh-80px)]">
          {!results ? (
            <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
              {/* Input Section */}
              <div className="p-3 sm:p-6 rounded-lg sm:rounded-xl bg-gray-800/50 border border-emerald-500/20">
                <label className="block text-xs sm:text-sm text-emerald-400 mb-2 font-mono">PAN NUMBER</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-lg bg-gray-900 border border-emerald-500/30 focus:border-emerald-500 outline-none text-white text-base sm:text-lg font-mono placeholder-gray-600 uppercase tracking-wider"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)</p>
              </div>

              {/* PAN Type Reference */}
              <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-700">
                <p className="text-sm text-gray-400 mb-3">4th Character indicates PAN holder type:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="flex gap-2"><span className="text-emerald-400 font-mono">P</span><span className="text-gray-500">Individual</span></div>
                  <div className="flex gap-2"><span className="text-emerald-400 font-mono">C</span><span className="text-gray-500">Company</span></div>
                  <div className="flex gap-2"><span className="text-emerald-400 font-mono">H</span><span className="text-gray-500">HUF</span></div>
                  <div className="flex gap-2"><span className="text-emerald-400 font-mono">F</span><span className="text-gray-500">Firm/LLP</span></div>
                  <div className="flex gap-2"><span className="text-emerald-400 font-mono">T</span><span className="text-gray-500">Trust</span></div>
                  <div className="flex gap-2"><span className="text-emerald-400 font-mono">G</span><span className="text-gray-500">Government</span></div>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:from-emerald-400 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
              >
                {isSearching ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Search className="w-6 h-6" />
                    </motion.div>
                    Accessing IT Database... {searchProgress}%
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Search PAN
                  </>
                )}
              </button>

              {isSearching && (
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${searchProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-mono">{results.panNumber}</p>
                      <p className="text-emerald-400">{results.basic.name} • {results.basic.panType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      results.basic.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {results.basic.status}
                    </span>
                    <p className="text-sm text-gray-400 mt-2">Aadhaar: {results.aadhaarSeeding.linked ? 'Linked' : 'Not Linked'}</p>
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
                        ? 'bg-emerald-500 text-white'
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
                {activeTab === 'basic' && (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                      <h3 className="text-sm font-mono text-emerald-400 mb-3">PERSONAL DETAILS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{results.basic.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Father's Name</span><span className="text-white">{results.basic.fatherName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Date of Birth</span><span className="text-white">{results.basic.dateOfBirth}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">PAN Type</span><span className="text-white">{results.basic.panType}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Status</span><span className={results.basic.status === 'Active' ? 'text-green-400' : 'text-red-400'}>{results.basic.status}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                      <h3 className="text-sm font-mono text-emerald-400 mb-3">AADHAAR SEEDING</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Linked</span><span className={results.aadhaarSeeding.linked ? 'text-green-400' : 'text-red-400'}>{results.aadhaarSeeding.linked ? 'Yes' : 'No'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Link Date</span><span className="text-white">{results.aadhaarSeeding.linkDate}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Masked Aadhaar</span><span className="text-cyan-400 font-mono">{results.aadhaarSeeding.maskedAadhaar}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Seeding Status</span><span className="text-green-400">{results.aadhaarSeeding.seedingStatus}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tax' && (
                  <motion.div
                    key="tax"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                      <h3 className="text-sm font-mono text-emerald-400 mb-3">TAX PROFILE</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Assessee Type</span><span className="text-white">{results.taxInfo.assessee}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Assessing Officer</span><span className="text-white text-xs">{results.taxInfo.assessingOfficer}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">ITR Filed</span><span className={results.taxInfo.itrFiled ? 'text-green-400' : 'text-red-400'}>{results.taxInfo.itrFiled ? 'Yes' : 'No'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Last ITR</span><span className="text-white">{results.taxInfo.lastItrYear}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Total ITRs</span><span className="text-white">{results.taxInfo.totalItrsFiled}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Defaulter</span><span className={results.taxInfo.defaulter ? 'text-red-400' : 'text-green-400'}>{results.taxInfo.defaulter ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                      <h3 className="text-sm font-mono text-emerald-400 mb-3">FINANCIAL PROFILE</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Income Range</span><span className="text-white">{results.financialProfile.estimatedIncomeRange}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Investor Type</span><span className="text-white">{results.financialProfile.investorType}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Demat A/C</span><span className={results.financialProfile.demat ? 'text-green-400' : 'text-gray-400'}>{results.financialProfile.demat ? 'Yes' : 'No'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Trading Active</span><span className={results.financialProfile.tradingActive ? 'text-green-400' : 'text-gray-400'}>{results.financialProfile.tradingActive ? 'Yes' : 'No'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Mutual Funds</span><span className={results.financialProfile.mutualFunds ? 'text-green-400' : 'text-gray-400'}>{results.financialProfile.mutualFunds ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'linked' && (
                  <motion.div
                    key="linked"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20"
                  >
                    <h3 className="text-sm font-mono text-emerald-400 mb-3">LINKED ENTITIES</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(results.linkedEntities).map(([key, value]) => (
                        <div key={key} className="p-3 rounded-lg bg-gray-900/50 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{value}</p>
                          <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'director' && (
                  <motion.div
                    key="director"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.directorships.length > 0 ? results.directorships.map((dir, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{dir.companyName}</p>
                            <p className="text-sm text-gray-500 font-mono">{dir.cin}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-sm ${dir.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{dir.status}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700 flex gap-4 text-sm text-gray-400">
                          <span>{dir.designation}</span>
                          <span>Since {dir.appointmentDate}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-gray-500">No directorships found</div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'compliance' && (
                  <motion.div
                    key="compliance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.complianceHistory.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white">{item.year}</p>
                            <p className="text-sm text-gray-500">{item.formType} • Filed on {item.filingDate}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-sm ${item.status === 'Processed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{item.status}</span>
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

export default PANInfoTool;
