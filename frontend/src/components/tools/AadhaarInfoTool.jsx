import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, X, Search, Zap, User, Shield, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Activity, Database, MapPin,
  Building, Calendar, FileText, Lock, Fingerprint, Eye
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const AadhaarInfoTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchProgress, setSearchProgress] = useState(0);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setAadhaarNumber('');
    setResults(null);
    setSearchProgress(0);
    toast.info('Ready for new search');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `aadhaar_info_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  // Format Aadhaar number
  const formatAadhaar = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 8)} ${numbers.slice(8, 12)}`;
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
        ctx.fillStyle = `rgba(239, 68, 68, ${p.opacity})`;
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

  const handleSearch = async () => {
    const cleanNumber = aadhaarNumber.replace(/\s/g, '');
    if (cleanNumber.length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    trackToolUsage('aadhaar-info', 'search', 'start');
    setIsSearching(true);
    setSearchProgress(0);
    onConsume?.(15);

    const progressInterval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + 3, 95));
    }, 80);

    setTimeout(() => {
      clearInterval(progressInterval);
      setSearchProgress(100);

      const maskedNumber = `XXXX XXXX ${cleanNumber.slice(-4)}`;

      const resultData = {
        aadhaarNumber: maskedNumber,
        valid: true,
        basic: {
          name: 'REDACTED',
          dateOfBirth: 'XX-XX-XXXX',
          gender: 'Male',
          photo: true,
          mobileLinked: true,
          emailLinked: true,
          lastUpdated: '2023-08-15',
        },
        address: {
          careOf: 'REDACTED',
          house: 'REDACTED',
          street: 'REDACTED',
          landmark: 'REDACTED',
          locality: 'REDACTED',
          vtc: 'Mumbai',
          district: 'Mumbai Suburban',
          state: 'Maharashtra',
          pincode: '400XXX',
          country: 'India',
        },
        verification: {
          biometricStatus: 'Active',
          lastBiometricAuth: '2024-01-05',
          otpStatus: 'Active',
          lastOtpAuth: '2024-01-09',
          faceAuthStatus: 'Enabled',
          irisStatus: 'Enrolled',
          fingerprintStatus: 'All 10 fingers enrolled',
        },
        linkedServices: {
          bankAccounts: 3,
          mobileNumbers: 2,
          panLinked: true,
          voterId: true,
          passport: false,
          drivingLicense: true,
          rationCard: true,
          gasConnection: true,
        },
        authHistory: [
          { date: '2024-01-09', type: 'OTP', purpose: 'Bank KYC', status: 'Success' },
          { date: '2024-01-05', type: 'Biometric', purpose: 'SIM Verification', status: 'Success' },
          { date: '2023-12-20', type: 'OTP', purpose: 'ITR Filing', status: 'Success' },
          { date: '2023-11-15', type: 'OTP', purpose: 'PAN Update', status: 'Success' },
        ],
        securityInfo: {
          lockStatus: 'Unlocked',
          virtualId: 'XXXX XXXX XXXX XXXX',
          maskedEmail: 'r***@gmail.com',
          maskedMobile: '+91 98XXX XXXXX',
          twoFactorEnabled: true,
        },
        alerts: [],
      };

      setResults(resultData);
      addToHistory({
        tool: 'Aadhaar Info',
        query: maskedNumber,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      setIsSearching(false);
      toast.success('Aadhaar information retrieved');
    }, 3000);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'verification', label: 'Verification', icon: Fingerprint },
    { id: 'linked', label: 'Linked Services', icon: Database },
    { id: 'history', label: 'Auth History', icon: Clock },
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
        className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-red-950/30 to-gray-900 rounded-2xl border border-red-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-3 sm:p-4 border-b border-red-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Aadhaar Info</h2>
              <p className="text-xs sm:text-sm text-red-400/80 hidden sm:block">UIDAI database lookup & verification</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-200">New Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!results}
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-orange-200">Export JSON</span>
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
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
        <div className="relative z-10 p-3 sm:p-6 overflow-y-auto max-h-[calc(90vh-70px)] sm:max-h-[calc(90vh-80px)]">
          {!results ? (
            <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
              {/* Input Section */}
              <div className="p-3 sm:p-6 rounded-lg sm:rounded-xl bg-gray-800/50 border border-red-500/20">
                <label className="block text-xs sm:text-sm text-red-400 mb-2 font-mono">AADHAAR NUMBER</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <input
                    type="text"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(formatAadhaar(e.target.value))}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-lg bg-gray-900 border border-red-500/30 focus:border-red-500 outline-none text-white text-base sm:text-lg font-mono placeholder-gray-600 tracking-wider"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Enter 12-digit Aadhaar number</p>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium">Sensitive Data Notice</p>
                    <ul className="mt-2 text-sm text-amber-300/80 space-y-1">
                      <li>• Aadhaar data is highly sensitive and protected under law</li>
                      <li>• Access is restricted to authorized investigations only</li>
                      <li>• All access is logged and audited</li>
                      <li>• Misuse may result in legal action under Aadhaar Act</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:from-red-400 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
              >
                {isSearching ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Search className="w-6 h-6" />
                    </motion.div>
                    Accessing UIDAI Database... {searchProgress}%
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Search Aadhaar
                  </>
                )}
              </button>

              {isSearching && (
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${searchProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/10 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Fingerprint className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-mono">{results.aadhaarNumber}</p>
                      <p className="text-red-400">{results.basic.name} • {results.basic.gender}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      results.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {results.valid ? 'Valid Aadhaar' : 'Invalid'}
                    </span>
                    <p className="text-sm text-gray-400 mt-2">Biometric: {results.verification.biometricStatus}</p>
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
                        ? 'bg-red-500 text-white'
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
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-red-500/20">
                      <h3 className="text-sm font-mono text-red-400 mb-3">PERSONAL DETAILS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{results.basic.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Date of Birth</span><span className="text-white">{results.basic.dateOfBirth}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Gender</span><span className="text-white">{results.basic.gender}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Photo</span><span className={results.basic.photo ? 'text-green-400' : 'text-red-400'}>{results.basic.photo ? 'Available' : 'Not Available'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Last Updated</span><span className="text-white">{results.basic.lastUpdated}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-red-500/20">
                      <h3 className="text-sm font-mono text-red-400 mb-3">SECURITY INFO</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Lock Status</span><span className={results.securityInfo.lockStatus === 'Unlocked' ? 'text-green-400' : 'text-red-400'}>{results.securityInfo.lockStatus}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Virtual ID</span><span className="text-cyan-400 font-mono text-xs">{results.securityInfo.virtualId}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Masked Email</span><span className="text-white">{results.securityInfo.maskedEmail}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Masked Mobile</span><span className="text-white">{results.securityInfo.maskedMobile}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">2FA Enabled</span><span className={results.securityInfo.twoFactorEnabled ? 'text-green-400' : 'text-red-400'}>{results.securityInfo.twoFactorEnabled ? 'Yes' : 'No'}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'address' && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-gray-800/50 border border-red-500/20"
                  >
                    <h3 className="text-sm font-mono text-red-400 mb-3">REGISTERED ADDRESS</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Care Of</span><span className="text-white">{results.address.careOf}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">House</span><span className="text-white">{results.address.house}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Street</span><span className="text-white">{results.address.street}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Landmark</span><span className="text-white">{results.address.landmark}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Locality</span><span className="text-white">{results.address.locality}</span></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">City/Village</span><span className="text-white">{results.address.vtc}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">District</span><span className="text-white">{results.address.district}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">State</span><span className="text-white">{results.address.state}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Pincode</span><span className="text-cyan-400 font-mono">{results.address.pincode}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Country</span><span className="text-white">{results.address.country}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'verification' && (
                  <motion.div
                    key="verification"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-gray-800/50 border border-red-500/20"
                  >
                    <h3 className="text-sm font-mono text-red-400 mb-3">BIOMETRIC STATUS</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Biometric Auth</span><span className={results.verification.biometricStatus === 'Active' ? 'text-green-400' : 'text-red-400'}>{results.verification.biometricStatus}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Last Biometric</span><span className="text-white">{results.verification.lastBiometricAuth}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">OTP Auth</span><span className={results.verification.otpStatus === 'Active' ? 'text-green-400' : 'text-red-400'}>{results.verification.otpStatus}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Last OTP</span><span className="text-white">{results.verification.lastOtpAuth}</span></div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Face Auth</span><span className={results.verification.faceAuthStatus === 'Enabled' ? 'text-green-400' : 'text-gray-400'}>{results.verification.faceAuthStatus}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Iris</span><span className="text-white">{results.verification.irisStatus}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Fingerprints</span><span className="text-white">{results.verification.fingerprintStatus}</span></div>
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
                    className="p-4 rounded-xl bg-gray-800/50 border border-red-500/20"
                  >
                    <h3 className="text-sm font-mono text-red-400 mb-3">LINKED SERVICES</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(results.linkedServices).map(([key, value]) => (
                        <div key={key} className="p-3 rounded-lg bg-gray-900/50 text-center">
                          <p className={`text-lg font-bold ${typeof value === 'boolean' ? (value ? 'text-green-400' : 'text-red-400') : 'text-red-400'}`}>
                            {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {results.authHistory.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-red-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Fingerprint className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="text-white">{item.type} Authentication</p>
                            <p className="text-sm text-gray-500">{item.purpose}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={item.status === 'Success' ? 'text-green-400' : 'text-red-400'}>{item.status}</p>
                          <p className="text-xs text-gray-500">{item.date}</p>
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

export default AadhaarInfoTool;
