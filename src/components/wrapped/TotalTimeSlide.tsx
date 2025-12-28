/**
 * TotalTimeSlide - Zeigt die Gesamtzeit an
 */

import React from 'react';
import { motion } from 'framer-motion';

interface TotalTimeSlideProps {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  totalEpisodes: number;
  totalMovies: number;
}

export const TotalTimeSlide: React.FC<TotalTimeSlideProps> = ({
  totalMinutes,
  totalHours,
  totalDays,
  totalEpisodes,
  totalMovies,
}) => {
  // Berechne beste Darstellung
  const displayTime = totalDays >= 1
    ? { value: totalDays.toFixed(1), unit: 'Tage' }
    : { value: Math.round(totalHours).toString(), unit: 'Stunden' };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1e0533 0%, #3b1055 50%, #5c1a75 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative Circles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '10%',
            right: '-20%',
            width: '400px',
            height: '400px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '-15%',
            width: '300px',
            height: '300px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }}
        />
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
          marginBottom: '30px',
          zIndex: 1,
        }}
      >
        Du hast dieses Jahr
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: 'clamp(5rem, 20vw, 10rem)',
            fontWeight: 'bold',
            lineHeight: 1,
            textShadow: '0 0 60px rgba(255,255,255,0.3)',
          }}
        >
          {displayTime.value}
        </h1>
        <h2
          style={{
            color: 'white',
            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
            fontWeight: 300,
            opacity: 0.9,
            marginTop: '-5px',
          }}
        >
          {displayTime.unit}
        </h2>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.7 }}
        style={{
          color: 'white',
          fontSize: '1rem',
          marginTop: '20px',
          marginBottom: '50px',
          zIndex: 1,
        }}
      >
        mit Serien & Filmen verbracht
      </motion.p>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          width: '100%',
          maxWidth: '400px',
          zIndex: 1,
        }}
      >
        {[
          { value: totalEpisodes, label: 'Episoden', iconType: 'tv' },
          { value: totalMovies, label: 'Filme', iconType: 'film' },
          { value: Math.round(totalMinutes).toLocaleString(), label: 'Minuten', iconType: 'clock' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{ marginBottom: '5px', display: 'flex', justifyContent: 'center' }}>
              {stat.iconType === 'tv' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4" strokeLinecap="round"/>
                </svg>
              )}
              {stat.iconType === 'film' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
                </svg>
              )}
              {stat.iconType === 'clock' && (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <p
              style={{
                color: 'white',
                fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                fontWeight: 'bold',
              }}
            >
              {stat.value}
            </p>
            <p
              style={{
                color: 'white',
                fontSize: '0.75rem',
                opacity: 0.7,
                marginTop: '4px',
              }}
            >
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TotalTimeSlide;
