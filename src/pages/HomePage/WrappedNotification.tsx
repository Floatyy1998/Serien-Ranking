/**
 * WrappedNotification - Banner für Wrapped Jahresrückblick
 * Config wird aus Firebase gelesen (config/wrapped)
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Theaters, Star, TrendingUp } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useWrappedConfig } from '../../hooks/useWrappedConfig';

// Floating Icon Component
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  delay: number;
  left: string;
  top: string;
}> = ({ icon, delay, left, top }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.6, 0.6, 0],
      scale: [0.5, 1, 1, 0.5],
      y: [0, -15, -15, 0],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{
      position: 'absolute',
      left,
      top,
      color: 'rgba(255, 255, 255, 0.4)',
      pointerEvents: 'none',
    }}
  >
    {icon}
  </motion.div>
);

export const WrappedNotification: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { enabled, year, loading } = useWrappedConfig();

  // Don't show while loading or if disabled
  if (loading || !enabled) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      onClick={() => navigate('/wrapped')}
      aria-label={`Dein ${year} Wrapped ist da – Entdecke deinen Jahresrückblick`}
      style={{
        margin: '16px',
        marginBottom: '8px',
        padding: '16px 20px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #764ba2 50%, #f093fb 100%)`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: `0 8px 32px ${currentTheme.primary}40`,
        width: 'calc(100% - 32px)',
        textAlign: 'left',
        border: 'none',
      }}
    >
      {/* Animated Background Icons */}
      <FloatingIcon icon={<PlayCircle style={{ fontSize: 20 }} />} delay={0} left="10%" top="20%" />
      <FloatingIcon icon={<Star style={{ fontSize: 16 }} />} delay={0.5} left="85%" top="15%" />
      <FloatingIcon icon={<Theaters style={{ fontSize: 18 }} />} delay={1} left="75%" top="65%" />
      <FloatingIcon icon={<TrendingUp style={{ fontSize: 16 }} />} delay={1.5} left="20%" top="70%" />

      {/* Shimmer Effect */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Animated Year Circle */}
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-1px',
          }}>
            {year}
          </span>
        </motion.div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.5px',
            }}
          >
            Dein Wrapped ist da
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Entdecke deinen Jahresrückblick
          </motion.p>
        </div>
      </div>
    </motion.button>
  );
};

export default WrappedNotification;
