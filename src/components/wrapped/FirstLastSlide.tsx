/**
 * FirstLastSlide - Zeigt das erste und letzte geschaute des Jahres
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FirstLastWatch } from '../../types/Wrapped';

interface FirstLastSlideProps {
  firstWatch: FirstLastWatch | null;
  lastWatch: FirstLastWatch | null;
  year: number;
}

// Play/Rewind Icons
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const FastForwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
);

const TvIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" strokeLinecap="round" />
  </svg>
);

const FilmIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
  </svg>
);

export const FirstLastSlide: React.FC<FirstLastSlideProps> = ({ firstWatch, lastWatch, year }) => {
  if (!firstWatch && !lastWatch) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
        }}
      >
        <p>Keine Daten verfügbar</p>
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
        background: 'linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Animated Timeline Line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          position: 'absolute',
          left: '50%',
          top: '20%',
          bottom: '20%',
          width: '2px',
          background: 'linear-gradient(180deg, #00d9ff 0%, #764ba2 100%)',
          transformOrigin: 'top',
          opacity: 0.3,
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          color: 'white',
          fontSize: '1rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '40px',
          zIndex: 1,
        }}
      >
        Dein {year} - Start bis Ende
      </motion.p>

      {/* First Watch */}
      {firstWatch && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          style={{
            background: 'rgba(0, 217, 255, 0.15)',
            backdropFilter: 'blur(15px)',
            borderRadius: '20px',
            padding: '25px',
            width: '100%',
            maxWidth: '350px',
            marginBottom: '30px',
            zIndex: 1,
            border: '1px solid rgba(0, 217, 255, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00d9ff 0%, #0099cc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlayIcon />
            </div>
            <div>
              <p style={{ color: '#00d9ff', fontSize: '0.8rem', fontWeight: 'bold', margin: 0 }}>
                ERSTES
              </p>
              <p style={{ color: 'white', opacity: 0.7, fontSize: '0.85rem', margin: 0 }}>
                {firstWatch.date}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>
              {firstWatch.type === 'episode' ? <TvIcon /> : <FilmIcon />}
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                }}
              >
                {firstWatch.title}
              </h3>
              {firstWatch.subtitle && (
                <p style={{ color: 'white', opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
                  {firstWatch.subtitle}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Arrow/Timeline Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          zIndex: 1,
          boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
      </motion.div>

      {/* Last Watch */}
      {lastWatch && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, type: 'spring', stiffness: 100 }}
          style={{
            background: 'rgba(118, 75, 162, 0.15)',
            backdropFilter: 'blur(15px)',
            borderRadius: '20px',
            padding: '25px',
            width: '100%',
            maxWidth: '350px',
            zIndex: 1,
            border: '1px solid rgba(118, 75, 162, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #764ba2 0%, #5a3d7a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FastForwardIcon />
            </div>
            <div>
              <p style={{ color: '#b388ff', fontSize: '0.8rem', fontWeight: 'bold', margin: 0 }}>
                LETZTES
              </p>
              <p style={{ color: 'white', opacity: 0.7, fontSize: '0.85rem', margin: 0 }}>
                {lastWatch.date}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>
              {lastWatch.type === 'episode' ? <TvIcon /> : <FilmIcon />}
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                }}
              >
                {lastWatch.title}
              </h3>
              {lastWatch.subtitle && (
                <p style={{ color: 'white', opacity: 0.7, fontSize: '0.9rem', margin: 0 }}>
                  {lastWatch.subtitle}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FirstLastSlide;
