/**
 * BingeStatsSlide - Zeigt Binge-Watching Statistiken
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BingeSessionStats } from '../../types/Wrapped';

interface BingeStatsSlideProps {
  totalBingeSessions: number;
  longestBinge: BingeSessionStats | null;
  averageBingeLength: number;
}

// Play Button Icon für Binge
const PlayIcon: React.FC<{ size?: number }> = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle
      cx="12"
      cy="12"
      r="11"
      fill="rgba(155,89,182,0.3)"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1"
    />
    <path d="M10 8l6 4-6 4V8z" fill="white" />
    <path d="M19 12l3 2-3 2v-4z" fill="rgba(255,255,255,0.5)" />
  </svg>
);

export const BingeStatsSlide: React.FC<BingeStatsSlideProps> = ({
  totalBingeSessions,
  longestBinge,
  averageBingeLength,
}) => {
  if (totalBingeSessions === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #2d3436 0%, #636e72 50%, #b2bec3 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', color: 'white', zIndex: 1 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            >
              <path d="M17 18a5 5 0 00-10 0" />
              <circle cx="12" cy="9" r="4" />
              <path d="M12 3v1M21 12h-1M4 12H3M18.364 5.636l-.707.707M6.343 6.343l-.707-.707" />
            </svg>
          </motion.div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '15px' }}>
            Kein Binge-Watching
          </h2>
          <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>Du hast dieses Jahr gemäßigt geschaut!</p>
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
        background: 'linear-gradient(180deg, #2d1b4e 0%, #6c3483 50%, #9b59b6 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Floating Play Icons */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              position: 'absolute',
              top: `${20 + Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.15,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
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
          marginBottom: '30px',
          zIndex: 1,
        }}
      >
        Binge-Watching
      </motion.p>

      {/* Big Play Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        style={{
          marginBottom: '20px',
          zIndex: 1,
        }}
      >
        <PlayIcon size={100} />
      </motion.div>

      {/* Total Sessions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
        style={{ textAlign: 'center', zIndex: 1, marginBottom: '30px' }}
      >
        <h2
          style={{
            color: 'white',
            fontSize: 'clamp(4rem, 15vw, 7rem)',
            fontWeight: 'bold',
            lineHeight: 1,
            textShadow: '0 0 60px rgba(155,89,182,0.5)',
          }}
        >
          {totalBingeSessions}
        </h2>
        <p
          style={{
            color: 'white',
            fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
            opacity: 0.9,
            marginTop: '5px',
          }}
        >
          Binge-Sessions
        </p>
      </motion.div>

      {/* Longest Binge Card */}
      {longestBinge && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(15px)',
            borderRadius: '24px',
            padding: '25px 30px',
            textAlign: 'center',
            zIndex: 1,
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: '20px',
            width: '100%',
            maxWidth: '350px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '15px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd700">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <p style={{ color: 'white', opacity: 0.8, fontSize: '0.9rem' }}>Längste Session</p>
          </div>
          <h3
            style={{
              color: 'white',
              fontSize: '1.4rem',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}
          >
            {longestBinge.seriesTitle}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <div>
              <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {longestBinge.episodeCount}
              </p>
              <p style={{ color: 'white', opacity: 0.7, fontSize: '0.8rem' }}>Episoden</p>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }} />
            <div>
              <p style={{ color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {longestBinge.totalMinutes >= 60
                  ? `${Math.floor(longestBinge.totalMinutes / 60)}h ${longestBinge.totalMinutes % 60 > 0 ? `${longestBinge.totalMinutes % 60}m` : ''}`
                  : `${longestBinge.totalMinutes}m`}
              </p>
              <p style={{ color: 'white', opacity: 0.7, fontSize: '0.8rem' }}>am Stück</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Average Binge Length */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '15px 30px',
          zIndex: 1,
        }}
      >
        <p style={{ color: 'white', opacity: 0.8 }}>
          Durchschnitt:{' '}
          <strong style={{ fontSize: '1.2rem' }}>{Math.round(averageBingeLength)} Episoden</strong>{' '}
          pro Session
        </p>
      </motion.div>
    </div>
  );
};

export default BingeStatsSlide;
