/**
 * RecordDaySlide - Zeigt den aktivsten Tag des Jahres
 */

import React from 'react';
import { motion } from 'framer-motion';
import { DayStats } from '../../types/Wrapped';

interface RecordDaySlideProps {
  mostActiveDay: DayStats;
}

// Trophy Icon
const TrophyIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
    <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" stroke="#ffd700" strokeWidth="2" />
    <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" stroke="#ffd700" strokeWidth="2" />
    <path d="M6 4h12v8a6 6 0 11-12 0V4z" fill="#ffd700" />
    <path d="M9 21h6M12 17v4" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const RecordDaySlide: React.FC<RecordDaySlideProps> = ({ mostActiveDay }) => {
  const totalItems = mostActiveDay.episodesWatched + mostActiveDay.moviesWatched;
  const hours = Math.round(mostActiveDay.minutesWatched / 60);

  // Formatiere das Datum schöner
  const dateObj = new Date(mostActiveDay.date);
  const formattedDate = dateObj.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #4a1942 50%, #e94560 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Confetti-like particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, window.innerHeight + 20],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${Math.random() * 100}%`,
              width: '8px',
              height: '8px',
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              background: ['#ffd700', '#e94560', '#fff', '#667eea'][i % 4],
              opacity: 0.4,
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
        Dein Rekord-Tag
      </motion.p>

      {/* Trophy */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
        style={{ marginBottom: '20px', zIndex: 1 }}
      >
        <TrophyIcon />
      </motion.div>

      {/* Date */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ textAlign: 'center', zIndex: 1, marginBottom: '30px' }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
            fontWeight: 'bold',
            marginBottom: '5px',
          }}
        >
          {mostActiveDay.dayName}
        </h2>
        <p style={{ color: 'white', opacity: 0.8, fontSize: '1.1rem' }}>{formattedDate}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '400px',
          zIndex: 1,
        }}
      >
        {/* Episodes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px 10px',
            textAlign: 'center',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            style={{ marginBottom: '8px' }}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          </svg>
          <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
            {mostActiveDay.episodesWatched}
          </p>
          <p style={{ color: 'white', opacity: 0.7, fontSize: '0.8rem', margin: 0 }}>Episoden</p>
        </motion.div>

        {/* Movies */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px 10px',
            textAlign: 'center',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            style={{ marginBottom: '8px' }}
          >
            <rect x="2" y="2" width="20" height="20" rx="2" />
            <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
          </svg>
          <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
            {mostActiveDay.moviesWatched}
          </p>
          <p style={{ color: 'white', opacity: 0.7, fontSize: '0.8rem', margin: 0 }}>Filme</p>
        </motion.div>

        {/* Hours */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px 10px',
            textAlign: 'center',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
            style={{ marginBottom: '8px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
            {hours}h
          </p>
          <p style={{ color: 'white', opacity: 0.7, fontSize: '0.8rem', margin: 0 }}>Watchtime</p>
        </motion.div>
      </motion.div>

      {/* Big Number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, type: 'spring', stiffness: 100 }}
        style={{
          marginTop: '30px',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(233,69,96,0.2) 100%)',
          borderRadius: '24px',
          padding: '20px 40px',
          zIndex: 1,
          border: '1px solid rgba(255,215,0,0.3)',
        }}
      >
        <p
          style={{
            color: 'white',
            opacity: 0.8,
            fontSize: '0.9rem',
            textAlign: 'center',
            margin: '0 0 5px 0',
          }}
        >
          Insgesamt
        </p>
        <p
          style={{
            color: '#ffd700',
            fontSize: 'clamp(2rem, 8vw, 3rem)',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            textShadow: '0 0 30px rgba(255,215,0,0.5)',
          }}
        >
          {totalItems} Titel
        </p>
      </motion.div>
    </div>
  );
};

export default RecordDaySlide;
