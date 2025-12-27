/**
 * WrappedNotAvailablePage - Seite wenn Wrapped noch nicht verfügbar ist
 */

import { motion } from 'framer-motion';
import { PlayCircle, Theaters, Star, TrendingUp, Schedule, ArrowBack } from '@mui/icons-material';

interface Props {
  year: number;
  onBack: () => void;
}

// Floating Icon Animation
const FloatingIcon: React.FC<{
  icon: React.ReactNode;
  delay: number;
  x: number;
  y: number;
  size: number;
}> = ({ icon, delay, x, y, size }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.3, 0.3, 0],
      scale: [0.5, 1, 1, 0.5],
      y: [0, -20, -20, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      color: 'rgba(255, 255, 255, 0.2)',
      fontSize: size,
      pointerEvents: 'none',
    }}
  >
    {icon}
  </motion.div>
);

export const WrappedNotAvailablePage: React.FC<Props> = ({ year, onBack }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Floating Background Icons */}
      <FloatingIcon icon={<PlayCircle />} delay={0} x={10} y={20} size={40} />
      <FloatingIcon icon={<Star />} delay={0.5} x={85} y={15} size={32} />
      <FloatingIcon icon={<Theaters />} delay={1} x={80} y={70} size={36} />
      <FloatingIcon icon={<TrendingUp />} delay={1.5} x={15} y={75} size={28} />
      <FloatingIcon icon={<PlayCircle />} delay={2} x={50} y={85} size={24} />
      <FloatingIcon icon={<Star />} delay={2.5} x={25} y={40} size={20} />

      {/* Main Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
          position: 'relative',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px dashed rgba(255, 255, 255, 0.3)',
          }}
        />
        <Schedule style={{ fontSize: 56, color: 'white' }} />
      </motion.div>

      {/* Year Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '8px 20px',
          marginBottom: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <span style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
          Wrapped {year}
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '16px',
          letterSpacing: '-0.5px',
        }}
      >
        Kommt bald
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: '16px',
          color: 'rgba(255, 255, 255, 0.7)',
          maxWidth: '360px',
          lineHeight: 1.6,
          marginBottom: '40px',
        }}
      >
        Dein Jahresrückblick ist noch nicht verfügbar. Schau weiter fleißig Serien und Filme –
        Ende des Jahres zeigen wir dir deine persönlichen Highlights!
      </motion.p>

      {/* Stats Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {[
          { icon: <PlayCircle />, label: 'Episoden' },
          { icon: <Theaters />, label: 'Filme' },
          { icon: <Star />, label: 'Bewertungen' },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ color: '#667eea', fontSize: '24px', display: 'flex' }}>
              {item.icon}
            </div>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              {item.label}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBack}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '12px',
          padding: '14px 32px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
        }}
      >
        <ArrowBack style={{ fontSize: 20 }} />
        Zurück zur Startseite
      </motion.button>
    </div>
  );
};

export default WrappedNotAvailablePage;
