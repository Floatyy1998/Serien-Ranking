/**
 * LateNightSlide - Zeigt Late-Night Watching Statistiken
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LateNightStats } from '../../types/Wrapped';

interface LateNightSlideProps {
  lateNightStats: LateNightStats;
}

// Moon Icon
const MoonIcon = ({ size = 80 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      fill="#ffd700"
      stroke="#ffd700"
      strokeWidth="1"
    />
    <circle cx="8" cy="10" r="1.5" fill="#1a1a2e" opacity="0.3" />
    <circle cx="14" cy="8" r="1" fill="#1a1a2e" opacity="0.3" />
    <circle cx="11" cy="14" r="0.8" fill="#1a1a2e" opacity="0.3" />
  </svg>
);

export const LateNightSlide: React.FC<LateNightSlideProps> = ({ lateNightStats }) => {
  const hasLateNightData = lateNightStats.totalLateNightWatches > 0;

  if (!hasLateNightData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #0c0c1e 0%, #1a1a3e 50%, #2d2d5a 100%)',
          color: 'white',
          padding: '40px 20px',
          boxSizing: 'border-box',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Früh ins Bett?</h2>
          <p style={{ opacity: 0.7 }}>Du hast dieses Jahr nicht nach 22 Uhr geschaut!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0c0c1e 0%, #1a1a3e 50%, #2d2d5a 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Stars background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: 'white',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          color: 'white',
          fontSize: '1rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '20px',
          zIndex: 1,
        }}
      >
        Nachtschwärmer
      </motion.p>

      {/* Moon Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
        style={{
          marginBottom: '20px',
          zIndex: 1,
          filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.4))',
        }}
      >
        <MoonIcon size={100} />
      </motion.div>

      {/* Main Stat */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        style={{ textAlign: 'center', zIndex: 1, marginBottom: '30px' }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: 'clamp(3rem, 12vw, 5rem)',
            fontWeight: 'bold',
            lineHeight: 1,
            textShadow: '0 0 40px rgba(102,126,234,0.5)',
            margin: 0,
          }}
        >
          {lateNightStats.totalLateNightWatches}
        </h2>
        <p style={{ color: 'white', opacity: 0.8, fontSize: '1.2rem', marginTop: '5px' }}>
          Late-Night Sessions
        </p>
        <p style={{ color: '#ffd700', fontSize: '1rem', marginTop: '5px' }}>
          {lateNightStats.percentage}% deiner Views
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          width: '100%',
          maxWidth: '350px',
          zIndex: 1,
        }}
      >
        {/* After Midnight */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#b388ff"
            strokeWidth="2"
            style={{ marginBottom: '10px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6" strokeLinecap="round" />
            <path d="M12 12l-4 2" strokeLinecap="round" />
          </svg>
          <p style={{ color: 'white', fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>
            {lateNightStats.midnightWatches}
          </p>
          <p style={{ color: 'white', opacity: 0.6, fontSize: '0.8rem', margin: 0 }}>
            Nach Mitternacht
          </p>
        </motion.div>

        {/* Latest Watch */}
        {lateNightStats.latestWatch && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="2"
              style={{ marginBottom: '10px' }}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="4" fill="#ff6b6b" />
            </svg>
            <p style={{ color: 'white', fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 5px 0' }}>
              {lateNightStats.latestWatch.time}
            </p>
            <p style={{ color: 'white', opacity: 0.6, fontSize: '0.8rem', margin: 0 }}>
              Späteste Uhrzeit
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Latest Show Title */}
      {lateNightStats.latestWatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          style={{
            marginTop: '25px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '12px 20px',
            zIndex: 1,
          }}
        >
          <p style={{ color: 'white', opacity: 0.7, fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
            Spätester Watch: <strong style={{ color: '#ffd700' }}>{lateNightStats.latestWatch.title}</strong>
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default LateNightSlide;
