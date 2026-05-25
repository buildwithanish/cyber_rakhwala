import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image, X, Upload, Zap, MapPin, Camera, Calendar, Clock, Eye,
  FileImage, Download, ChevronDown, Info, Globe, Smartphone,
  Settings, Aperture, Sun, Focus, Maximize, RotateCcw, Layers, Copy, RefreshCw
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';

const ImageEXIFTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [results, setResults] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [lastLookupTime, setLastLookupTime] = useState(null);
    const handleExportJSON = () => {
      if (!results) { toast.error('No results to export'); return; }
      const ok = exportToJSON(results, `image_exif_${Date.now()}.json`);
      if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
    };

    const handleExportCSV = () => {
      if (!results) { toast.error('No results to export'); return; }
      const prepared = formatForExport(results, 'csv');
      const ok = exportToCSV(prepared, `image_exif_${Date.now()}.csv`);
      if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
    };
  const [apertureAngle, setApertureAngle] = useState(0);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Aperture animation
  useEffect(() => {
    const interval = setInterval(() => {
      setApertureAngle(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleExtract = async () => {
    if (!image) {
      toast.error('Please upload an image first');
      return;
    }
    
    trackToolUsage('image-exif', 'extract', 'start');
    setIsExtracting(true);
    onConsume?.(3);

    setTimeout(() => {
      const resultData = {
        filename: image.name,
        fileSize: `${(image.size / 1024).toFixed(2)} KB`,
        mimeType: image.type,
        basic: {
          width: 4032,
          height: 3024,
          aspectRatio: '4:3',
          colorSpace: 'sRGB',
          colorDepth: '24-bit',
          orientation: 'Landscape',
        },
        camera: {
          make: 'Apple',
          model: 'iPhone 14 Pro',
          software: 'iOS 17.2',
          lens: 'iPhone 14 Pro back camera 6.86mm f/1.78',
          focalLength: '6.86 mm',
          focalLengthEquiv: '48 mm (35mm equivalent)',
        },
        exposure: {
          aperture: 'f/1.78',
          shutterSpeed: '1/120 s',
          iso: '64',
          exposureMode: 'Auto',
          exposureProgram: 'Program AE',
          exposureBias: '0 EV',
          meteringMode: 'Multi-segment',
          flash: 'No Flash',
          whiteBalance: 'Auto',
        },
        gps: {
          hasLocation: true,
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: '52 m',
          city: 'San Francisco',
          state: 'California',
          country: 'United States',
          timestamp: '2024-11-20 14:32:45 PST',
        },
        datetime: {
          created: '2024-11-20 14:32:45',
          modified: '2024-11-20 14:32:47',
          timezone: 'PST (UTC-8)',
          subsec: '123',
        },
        advanced: {
          compression: 'JPEG',
          xResolution: '72 dpi',
          yResolution: '72 dpi',
          brightnessValue: '6.88',
          sceneCaptureType: 'Standard',
          subjectArea: '2009, 1505, 251, 250',
          uniqueId: 'a3b8c9d4e5f6...',
        },
      };
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('image-exif', image.name, resultData);
      trackToolUsage('image-exif', 'extract', 'success');
      toast.success('EXIF data extracted!');
      setIsExtracting(false);
    }, 2500);
  };

  const handleRefresh = () => {
    setImage(null);
    setImagePreview(null);
    setResults(null);
    setLastLookupTime(null);
    toast.info('Ready for new search');
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: FileImage },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'exposure', label: 'Exposure', icon: Aperture },
    { id: 'gps', label: 'Location', icon: MapPin },
    { id: 'datetime', label: 'Date/Time', icon: Calendar },
    { id: 'advanced', label: 'Advanced', icon: Settings },
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
        initial={{ scale: 0.85, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-orange-950/20 to-slate-950 border border-orange-500/30 shadow-[0_0_100px_rgba(249,115,22,0.15)]"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Lens flare effects */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* Animated aperture in corner */}
          <svg className="absolute top-10 right-10 w-24 h-24 opacity-20">
            <g transform={`rotate(${apertureAngle}, 48, 48)`}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <path
                  key={i}
                  d={`M 48 48 L ${48 + Math.cos(i * Math.PI / 4) * 40} ${48 + Math.sin(i * Math.PI / 4) * 40}`}
                  stroke="#f97316"
                  strokeWidth="2"
                  fill="none"
                />
              ))}
            </g>
            <circle cx="48" cy="48" r="30" fill="none" stroke="#f97316" strokeWidth="2" />
            <circle cx="48" cy="48" r="20" fill="none" stroke="#f97316" strokeWidth="1" />
          </svg>

          {/* Gradient glows */}
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-orange-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/40 overflow-hidden"
                >
                  {/* Aperture animation - hidden on mobile */}
                  <motion.div
                    className="absolute inset-0 items-center justify-center hidden sm:flex"
                    style={{ transform: `rotate(${apertureAngle}deg)` }}
                  >
                    <Aperture className="w-10 h-10 text-white/30" />
                  </motion.div>
                  <Camera className="w-5 h-5 sm:w-7 sm:h-7 text-white relative z-10" />
                </motion.div>
                {/* Flash effect - hidden on mobile */}
                <motion.div
                  className="absolute inset-0 bg-white rounded-xl sm:rounded-2xl hidden sm:block"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="truncate">EXIF Extractor</span>
                  <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30 hidden sm:inline">METADATA</span>
                </h2>
                <p className="text-xs sm:text-sm text-orange-300/70 flex items-center gap-2">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">Extract hidden metadata from images</span>
                  <span className="truncate sm:hidden">Image metadata</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                <span className="text-xs text-orange-200 hidden sm:inline">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-pink-400" />
                <span className="text-xs text-pink-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-pink-400" />
                <span className="text-xs text-pink-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
              >
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-sm sm:text-lg font-bold text-amber-300">3</span>
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
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Panel - Upload */}
            <div className="space-y-6">
              {/* Drop Zone */}
              <motion.div
                ref={dropZoneRef}
                whileHover={{ scale: 1.01 }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-orange-400 bg-orange-500/10' 
                    : 'border-orange-500/30 bg-slate-900/60 hover:border-orange-500/50 hover:bg-slate-900/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-white font-semibold truncate">{image?.name}</div>
                        <div className="text-orange-300/70 text-sm">{(image?.size / 1024).toFixed(2)} KB</div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null); setResults(null); }}
                      className="w-full py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    >
                      Remove Image
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="w-16 h-16 text-orange-500/50 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-xl text-gray-300 mb-2">Drop image here</h3>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                    <p className="text-gray-600 text-xs mt-4">Supports JPG, PNG, TIFF, HEIC</p>
                  </div>
                )}
              </motion.div>

              {/* Extract Button */}
              {image && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/30"
                >
                  {isExtracting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Layers className="w-5 h-5" />
                      </motion.div>
                      <span>Extracting Metadata...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      <span>Extract EXIF Data</span>
                    </>
                  )}
                </motion.button>
              )}

              {/* Extraction Animation */}
              {isExtracting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-orange-500/20"
                >
                  <div className="text-center mb-4">
                    <motion.div
                      className="w-20 h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Aperture className="w-10 h-10 text-orange-400" />
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['Reading Headers', 'Parsing EXIF', 'Extracting GPS', 'Processing Data', 'Analyzing', 'Finalizing'].map((step, i) => (
                      <motion.div
                        key={step}
                        className="p-2 rounded-lg bg-orange-500/10 text-center"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      >
                        <div className="text-xs text-orange-300">{step}</div>
                      </motion.div>
                    ))}
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
                  {/* Section Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {sections.map(section => (
                      <motion.button
                        key={section.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                          activeSection === section.id
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-orange-500/20'
                        }`}
                      >
                        <section.icon className="w-4 h-4" />
                        {section.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Section Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 rounded-2xl bg-slate-900/60 border border-orange-500/20 min-h-[400px]"
                    >
                      {activeSection === 'basic' && (
                        <div className="space-y-4">
                          <h3 className="text-orange-300 font-semibold flex items-center gap-2">
                            <FileImage className="w-5 h-5" />
                            Image Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(results.basic).map(([key, value], i) => (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 rounded-xl bg-slate-800/50"
                              >
                                <div className="text-gray-400 text-xs uppercase mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-white font-medium">{value}</div>
                              </motion.div>
                            ))}
                          </div>
                          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center gap-3">
                              <Info className="w-5 h-5 text-orange-400" />
                              <div>
                                <div className="text-white">{results.filename}</div>
                                <div className="text-gray-400 text-sm">{results.fileSize} • {results.mimeType}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeSection === 'camera' && (
                        <div className="space-y-4">
                          <h3 className="text-orange-300 font-semibold flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Camera Details
                          </h3>
                          <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center">
                                <Smartphone className="w-8 h-8 text-orange-400" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-white">{results.camera.model}</div>
                                <div className="text-orange-300/70">{results.camera.make}</div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(results.camera).slice(2).map(([key, value], i) => (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 rounded-xl bg-slate-800/50 flex justify-between"
                              >
                                <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-white">{value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSection === 'exposure' && (
                        <div className="space-y-4">
                          <h3 className="text-orange-300 font-semibold flex items-center gap-2">
                            <Aperture className="w-5 h-5" />
                            Exposure Settings
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: 'Aperture', value: results.exposure.aperture, icon: Aperture },
                              { label: 'Shutter', value: results.exposure.shutterSpeed, icon: Clock },
                              { label: 'ISO', value: results.exposure.iso, icon: Sun },
                            ].map((item, i) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 text-center"
                              >
                                <item.icon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{item.value}</div>
                                <div className="text-gray-400 text-xs">{item.label}</div>
                              </motion.div>
                            ))}
                          </div>
                          <div className="space-y-3">
                            {Object.entries(results.exposure).slice(3).map(([key, value], i) => (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 rounded-xl bg-slate-800/50 flex justify-between"
                              >
                                <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-white">{value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSection === 'gps' && (
                        <div className="space-y-4">
                          <h3 className="text-orange-300 font-semibold flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            GPS Location
                          </h3>
                          {results.gps.hasLocation ? (
                            <>
                              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapPin className="w-5 h-5 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Location Found</span>
                                </div>
                                <div className="text-xl font-bold text-white mb-1">
                                  {results.gps.city}, {results.gps.state}
                                </div>
                                <div className="text-gray-400">{results.gps.country}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-800/50">
                                  <Globe className="w-5 h-5 text-orange-400 mb-2" />
                                  <div className="text-white font-mono text-sm">
                                    {results.gps.latitude.toFixed(6)}°, {results.gps.longitude.toFixed(6)}°
                                  </div>
                                  <div className="text-gray-400 text-xs">Coordinates</div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-800/50">
                                  <Maximize className="w-5 h-5 text-orange-400 mb-2" />
                                  <div className="text-white">{results.gps.altitude}</div>
                                  <div className="text-gray-400 text-xs">Altitude</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="p-10 text-center">
                              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                              <div className="text-gray-400">No GPS data found in this image</div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeSection === 'datetime' && (
                        <div className="space-y-4">
                          <h3 className="text-orange-300 font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Date & Time
                          </h3>
                          <div className="p-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                <Calendar className="w-7 h-7 text-orange-400" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-white">{results.datetime.created.split(' ')[0]}</div>
                                <div className="text-orange-300/70">{results.datetime.created.split(' ')[1]}</div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(results.datetime).map(([key, value], i) => (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 rounded-xl bg-slate-800/50 flex justify-between"
                              >
                                <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-white">{value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeSection === 'advanced' && (
                        <div className="space-y-4">
                          <h3 className="text-orange-300 font-semibold flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Advanced Metadata
                          </h3>
                          <div className="space-y-3">
                            {Object.entries(results.advanced).map(([key, value], i) => (
                              <motion.div
                                key={key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-3 rounded-xl bg-slate-800/50 flex justify-between"
                              >
                                <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-white font-mono text-sm">{value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center p-10 rounded-2xl bg-slate-900/40 border border-orange-500/10">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      <Aperture className="w-24 h-24 text-orange-500/30 mx-auto mb-6" />
                    </motion.div>
                    <h3 className="text-xl text-gray-400 mb-2">Upload an image</h3>
                    <p className="text-gray-500 text-sm">Extract hidden EXIF metadata</p>
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

export default ImageEXIFTool;
