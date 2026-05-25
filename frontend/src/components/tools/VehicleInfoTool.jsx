import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, X, Search, Zap, MapPin, User, Shield, AlertTriangle,
  CheckCircle, Clock, RefreshCw, Activity, Database, FileText,
  Calendar, Settings, Eye, Lock, Truck, Navigation, Info
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const VehicleInfoTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('registration');
  const [searchProgress, setSearchProgress] = useState(0);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setVehicleNumber('');
    setResults(null);
    setSearchProgress(0);
    toast.info('Ready for new search');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `vehicle_info_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `vehicle_info_${Date.now()}.csv`);
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

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) {
      toast.error('Please enter a vehicle number');
      return;
    }

    trackToolUsage('vehicle-info', 'search', 'start');
    setIsSearching(true);
    setSearchProgress(0);
    onConsume?.(12);

    const progressInterval = setInterval(() => {
      setSearchProgress(prev => Math.min(prev + 3, 95));
    }, 80);

    setTimeout(() => {
      clearInterval(progressInterval);
      setSearchProgress(100);

      const resultData = {
        vehicleNumber: vehicleNumber.toUpperCase(),
        registration: {
          registrationNumber: vehicleNumber.toUpperCase(),
          registrationDate: '2021-03-15',
          registrationValidity: '2036-03-14',
          registrationAuthority: 'RTO Mumbai Central',
          registrationState: 'Maharashtra',
          vehicleClass: 'LMV - Light Motor Vehicle',
          vehicleCategory: 'Private',
          registrationType: 'New Registration',
        },
        vehicle: {
          make: 'Honda',
          model: 'City',
          variant: 'ZX CVT Petrol',
          bodyType: 'Sedan',
          color: 'Platinum White Pearl',
          fuelType: 'Petrol',
          engineNumber: 'L15Z6-XXXXXX',
          chassisNumber: 'MAKXXXXXXXX',
          engineCapacity: '1498 CC',
          seatingCapacity: 5,
          cylinderCount: 4,
          manufacturingYear: 2021,
          unladenWeight: '1089 KG',
          grossWeight: '1559 KG',
        },
        owner: {
          ownerName: 'REDACTED',
          fatherName: 'REDACTED',
          ownershipType: 'Individual',
          ownerSerialNumber: 1,
          presentAddress: 'REDACTED, Mumbai, Maharashtra - 400XXX',
          permanentAddress: 'REDACTED',
          financerName: null,
          insuranceCompany: 'ICICI Lombard General Insurance',
          insurancePolicyNumber: 'REDACTED',
          insuranceValidity: '2025-03-14',
        },
        fitness: {
          fitnessValid: true,
          fitnessValidUpto: '2036-03-14',
          pucValid: true,
          pucValidUpto: '2025-06-20',
          pucNumber: 'PUC-XXXXX',
          nationalPermit: false,
          permitType: 'N/A',
        },
        tax: {
          taxPaid: true,
          taxValidUpto: '2025-12-31',
          roadTaxAmount: '₹12,500',
          lastTaxPaidDate: '2024-12-15',
        },
        status: {
          vehicleStatus: 'Active',
          blacklisted: false,
          hypothecated: false,
          noc: false,
          challanPending: 2,
          challanAmount: '₹2,500',
        },
        history: [
          { date: '2024-01-05', event: 'Insurance Renewed', details: 'Policy renewed for 1 year' },
          { date: '2023-12-15', event: 'Tax Paid', details: 'Road tax paid for 2024' },
          { date: '2023-06-20', event: 'PUC Certificate', details: 'Pollution certificate renewed' },
          { date: '2021-03-15', event: 'Registration', details: 'New vehicle registered' },
        ],
      };

      setResults(resultData);
      addToHistory({
        tool: 'Vehicle Info',
        query: vehicleNumber,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      setIsSearching(false);
      toast.success('Vehicle information retrieved');
    }, 3000);
  };

  const tabs = [
    { id: 'registration', label: 'Registration', icon: FileText },
    { id: 'vehicle', label: 'Vehicle Details', icon: Car },
    { id: 'owner', label: 'Owner', icon: User },
    { id: 'fitness', label: 'Fitness & Tax', icon: Shield },
    { id: 'history', label: 'History', icon: Clock },
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
        className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-orange-950/30 to-gray-900 rounded-2xl border border-orange-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-3 sm:p-4 border-b border-orange-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Vehicle Info</h2>
              <p className="text-xs sm:text-sm text-orange-400/80 hidden sm:block">RTO database lookup & vehicle tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-orange-200">New Search</span>
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
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">15</span>
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
              <div className="p-3 sm:p-6 rounded-lg sm:rounded-xl bg-gray-800/50 border border-orange-500/20">
                <label className="block text-xs sm:text-sm text-orange-400 mb-2 font-mono">VEHICLE REGISTRATION NUMBER</label>
                <div className="relative">
                  <Car className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="MH 01 AB 1234"
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-lg bg-gray-900 border border-orange-500/30 focus:border-orange-500 outline-none text-white text-base sm:text-lg font-mono placeholder-gray-600 uppercase"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Enter vehicle number in format: XX 00 XX 0000</p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-800/30 border border-gray-700 flex items-center gap-2 sm:gap-3">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-xs sm:text-sm text-gray-300">Registration</span>
                </div>
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-800/30 border border-gray-700 flex items-center gap-2 sm:gap-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-xs sm:text-sm text-gray-300">Owner Info</span>
                </div>
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-800/30 border border-gray-700 flex items-center gap-2 sm:gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-xs sm:text-sm text-gray-300">Insurance</span>
                </div>
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-800/30 border border-gray-700 flex items-center gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-xs sm:text-sm text-gray-300">Challan</span>
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
                    Searching RTO Database... {searchProgress}%
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Search Vehicle
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
                      <Car className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-mono">{results.vehicleNumber}</p>
                      <p className="text-orange-400">{results.vehicle.make} {results.vehicle.model} {results.vehicle.variant}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      results.status.vehicleStatus === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {results.status.vehicleStatus}
                    </span>
                    {results.status.challanPending > 0 && (
                      <p className="text-sm text-amber-400 mt-2">{results.status.challanPending} Challans Pending</p>
                    )}
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
                {activeTab === 'registration' && (
                  <motion.div
                    key="registration"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">REGISTRATION INFO</h3>
                      <div className="space-y-2">
                        {Object.entries(results.registration).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">STATUS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Vehicle Status</span>
                          <span className={results.status.vehicleStatus === 'Active' ? 'text-green-400' : 'text-red-400'}>
                            {results.status.vehicleStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Blacklisted</span>
                          <span className={results.status.blacklisted ? 'text-red-400' : 'text-green-400'}>
                            {results.status.blacklisted ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hypothecated</span>
                          <span className={results.status.hypothecated ? 'text-amber-400' : 'text-green-400'}>
                            {results.status.hypothecated ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pending Challans</span>
                          <span className={results.status.challanPending > 0 ? 'text-amber-400' : 'text-green-400'}>
                            {results.status.challanPending} ({results.status.challanAmount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'vehicle' && (
                  <motion.div
                    key="vehicle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">VEHICLE SPECIFICATIONS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Make</span><span className="text-white">{results.vehicle.make}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Model</span><span className="text-white">{results.vehicle.model}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Variant</span><span className="text-white">{results.vehicle.variant}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Body Type</span><span className="text-white">{results.vehicle.bodyType}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Color</span><span className="text-white">{results.vehicle.color}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Fuel Type</span><span className="text-white">{results.vehicle.fuelType}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">ENGINE & CHASSIS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Engine Number</span><span className="text-cyan-400 font-mono">{results.vehicle.engineNumber}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Chassis Number</span><span className="text-cyan-400 font-mono">{results.vehicle.chassisNumber}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Engine Capacity</span><span className="text-white">{results.vehicle.engineCapacity}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Cylinders</span><span className="text-white">{results.vehicle.cylinderCount}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Seating</span><span className="text-white">{results.vehicle.seatingCapacity}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Manufacturing Year</span><span className="text-white">{results.vehicle.manufacturingYear}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'owner' && (
                  <motion.div
                    key="owner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">OWNER DETAILS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Owner Name</span><span className="text-white">{results.owner.ownerName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Father's Name</span><span className="text-white">{results.owner.fatherName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Ownership Type</span><span className="text-white">{results.owner.ownershipType}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Owner Serial</span><span className="text-white">{results.owner.ownerSerialNumber}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">INSURANCE</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-gray-400">Company</span><span className="text-white">{results.owner.insuranceCompany}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Policy Number</span><span className="text-cyan-400 font-mono">{results.owner.insurancePolicyNumber}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Valid Until</span><span className="text-green-400">{results.owner.insuranceValidity}</span></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'fitness' && (
                  <motion.div
                    key="fitness"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">FITNESS & PUC</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fitness Valid</span>
                          <span className={results.fitness.fitnessValid ? 'text-green-400' : 'text-red-400'}>
                            {results.fitness.fitnessValid ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-400">Fitness Valid Upto</span><span className="text-white">{results.fitness.fitnessValidUpto}</span></div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">PUC Valid</span>
                          <span className={results.fitness.pucValid ? 'text-green-400' : 'text-red-400'}>
                            {results.fitness.pucValid ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-400">PUC Valid Upto</span><span className="text-white">{results.fitness.pucValidUpto}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">PUC Number</span><span className="text-cyan-400 font-mono">{results.fitness.pucNumber}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20">
                      <h3 className="text-sm font-mono text-orange-400 mb-3">TAX DETAILS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tax Paid</span>
                          <span className={results.tax.taxPaid ? 'text-green-400' : 'text-red-400'}>
                            {results.tax.taxPaid ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-400">Valid Upto</span><span className="text-white">{results.tax.taxValidUpto}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Tax Amount</span><span className="text-white">{results.tax.roadTaxAmount}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Last Paid</span><span className="text-white">{results.tax.lastTaxPaidDate}</span></div>
                      </div>
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
                    {results.history.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/20 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.event}</p>
                          <p className="text-sm text-gray-500">{item.details}</p>
                        </div>
                        <span className="text-sm text-gray-400">{item.date}</span>
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

export default VehicleInfoTool;
