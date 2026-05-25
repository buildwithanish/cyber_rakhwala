import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Database,
  Wifi,
  Lock,
  Server,
  Activity,
  CheckCircle
} from 'lucide-react';

const Loader = ({ targetPage = 'dashboard', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Dynamic messages based on target page
  const getMessages = () => {
    const baseMessages = [
      { text: 'Establishing Secure Connection...', icon: Lock },
      { text: 'Authenticating Credentials...', icon: Shield },
      { text: 'Loading Intelligence Modules...', icon: Database },
      { text: 'Syncing Investigation Data...', icon: Server },
      { text: 'Initializing Interface...', icon: Activity },
    ];

    const pageSpecificMessages = {
      dashboard: [
        ...baseMessages,
        { text: 'Loading Case Management...', icon: Database },
        { text: 'System Ready', icon: CheckCircle }
      ],
      investigation: [
        ...baseMessages,
        { text: 'Preparing Investigation Tools...', icon: Activity },
        { text: 'Investigation Mode Active', icon: CheckCircle }
      ],
      tools: [
        ...baseMessages,
        { text: 'Loading OSINT Library...', icon: Database },
        { text: 'Tools Initialized', icon: CheckCircle }
      ],
      default: [
        ...baseMessages,
        { text: 'Finalizing Setup...', icon: Activity },
        { text: 'System Ready', icon: CheckCircle }
      ]
    };

    return pageSpecificMessages[targetPage] || pageSpecificMessages.default;
  };

  const messages = getMessages();

  useEffect(() => {
    const stepDuration = 400;
    const totalSteps = messages.length;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= totalSteps - 1) {
          clearInterval(interval);
          setIsComplete(true);
          setTimeout(() => {
            onComplete && onComplete();
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, stepDuration);

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + (100 / ((totalSteps * stepDuration) / 50));
      });
    }, 50);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [messages.length, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] flex items-center justify-center overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"
        initial={{ top: 0 }}
        animate={{ top: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden border border-cyan-500/30">
            <img src="/images/cr-logo.png" alt="CR Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white">CYBER RAKHWALA</h1>
          <p className="text-sm text-gray-500 mt-1">Intelligence Platform</p>
        </motion.div>

        {/* Terminal Output */}
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden mb-6">
          <div className="px-4 py-2 border-b border-gray-800 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <span className="ml-2 text-xs text-gray-500 font-mono">system://init</span>
          </div>
          
          <div className="p-4 font-mono text-sm space-y-2 min-h-[200px]">
            <AnimatePresence mode="wait">
              {messages.slice(0, currentStep + 1).map((msg, index) => {
                const Icon = msg.icon;
                const isCurrent = index === currentStep;
                const isLast = index === messages.length - 1 && isComplete;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 ${
                      isLast ? 'text-green-400' : 
                      isCurrent ? 'text-cyan-400' : 'text-gray-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isCurrent && !isLast ? 'animate-pulse' : ''}`} />
                    <span className={isCurrent && !isLast ? 'terminal-cursor' : ''}>
                      {msg.text}
                    </span>
                    {index < currentStep && (
                      <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Blinking cursor */}
            {!isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-cyan-400"
              >
                █
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span className="font-mono">{Math.round(progress)}%</span>
            <span>{isComplete ? 'Complete' : 'Initializing...'}</span>
          </div>
        </div>

        {/* Glitch Effect on Complete */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              System Initialized
            </div>
          </motion.div>
        )}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-cyan-500/20"></div>
      <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-cyan-500/20"></div>
      <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-cyan-500/20"></div>
      <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-cyan-500/20"></div>

      {/* Noise overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}></div>
    </div>
  );
};

export default Loader;
