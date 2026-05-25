import { motion } from 'framer-motion';

/**
 * Reusable Logo component for Cyber Rakhwala
 * @param {Object} props
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} props.showText - Whether to show the text alongside logo
 * @param {boolean} props.showSubtext - Whether to show the subtext
 * @param {boolean} props.animated - Whether to animate the logo
 * @param {string} props.className - Additional CSS classes
 */
const Logo = ({ 
  size = 'md', 
  showText = true, 
  showSubtext = false,
  animated = false,
  className = '' 
}) => {
  const sizeConfig = {
    sm: {
      container: 'w-8 h-8',
      image: 'w-8 h-8',
      title: 'text-lg',
      subtitle: 'text-[8px]'
    },
    md: {
      container: 'w-10 h-10',
      image: 'w-10 h-10',
      title: 'text-xl',
      subtitle: 'text-[10px]'
    },
    lg: {
      container: 'w-12 h-12',
      image: 'w-12 h-12',
      title: 'text-2xl',
      subtitle: 'text-xs'
    },
    xl: {
      container: 'w-14 h-14',
      image: 'w-14 h-14',
      title: 'text-3xl',
      subtitle: 'text-sm'
    },
    '2xl': {
      container: 'w-20 h-20',
      image: 'w-20 h-20',
      title: 'text-4xl',
      subtitle: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  const LogoImage = () => (
    <div className={`${config.container} rounded-xl overflow-hidden flex-shrink-0`}>
      <img 
        src="/images/cr-logo.png" 
        alt="Cyber Rakhwala Logo"
        className={`${config.image} object-contain`}
      />
    </div>
  );

  const AnimatedLogoImage = () => (
    <motion.div
      animate={{ 
        boxShadow: [
          '0 0 20px rgba(34, 211, 238, 0.3)', 
          '0 0 40px rgba(34, 211, 238, 0.5)', 
          '0 0 20px rgba(34, 211, 238, 0.3)'
        ]
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`${config.container} rounded-xl overflow-hidden flex-shrink-0`}
    >
      <img 
        src="/images/cr-logo.png" 
        alt="Cyber Rakhwala Logo"
        className={`${config.image} object-contain`}
      />
    </motion.div>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {animated ? <AnimatedLogoImage /> : <LogoImage />}
      
      {showText && (
        <div className="text-center sm:text-left">
          <h1 
            className={`${config.title} font-black tracking-wider`}
            style={{ 
              fontFamily: 'Papyrus, fantasy, cursive',
              background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #22d3ee 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: animated ? 'gradient-shift 3s ease infinite' : 'none',
            }}
          >
            Cyber Rakhwala
          </h1>
          {animated && (
            <style>{`
              @keyframes gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
              }
            `}</style>
          )}
          {showSubtext && (
            <p className={`${config.subtitle} text-cyan-400/60 tracking-[0.2em] uppercase`}>
              Intelligence Platform
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simple logo image only - useful for favicons and icons
 */
export const LogoIcon = ({ size = 'md', className = '' }) => {
  const sizeConfig = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
    '2xl': 'w-16 h-16'
  };

  return (
    <img 
      src="/images/cr-logo.png" 
      alt="CR"
      className={`${sizeConfig[size] || sizeConfig.md} object-contain ${className}`}
    />
  );
};

export default Logo;
