/**
 * TimePatternSlide - Zeigt Zeitmuster (Tageszeit, Wochentag)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TimeOfDayStats, DayOfWeekStats } from '../../types/Wrapped';

interface TimePatternSlideProps {
  favoriteTimeOfDay: TimeOfDayStats;
  favoriteDayOfWeek: DayOfWeekStats;
}

const TIME_LABELS: Record<string, string> = {
  morning: 'Morgens',
  afternoon: 'Nachmittags',
  evening: 'Abends',
  night: 'Nachts',
};

const TIME_COLORS: Record<string, string> = {
  morning: '#ff9a56',
  afternoon: '#ffcd3c',
  evening: '#ff6b6b',
  night: '#5f27cd',
};

// SVG Icons für Tageszeiten
const TimeIcon: React.FC<{ timeOfDay: string }> = ({ timeOfDay }) => {
  const iconStyle = { filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' };

  if (timeOfDay === 'morning') {
    return (
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" style={iconStyle}>
        <circle cx="12" cy="17" r="5" stroke="#ff9a56" strokeWidth="2" />
        <path
          d="M12 2v4M12 8v1M4.22 10.22l2.83 2.83M1 17h4M19 17h4M16.95 13.05l2.83-2.83"
          stroke="#ff9a56"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M3 21h18" stroke="#ff9a56" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (timeOfDay === 'afternoon') {
    return (
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" style={iconStyle}>
        <circle cx="12" cy="12" r="5" fill="#ffcd3c" />
        <path
          d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
          stroke="#ffcd3c"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (timeOfDay === 'evening') {
    return (
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" style={iconStyle}>
        <circle cx="12" cy="17" r="5" fill="#ff6b6b" />
        <path d="M12 2v6" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 21h18" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 12h2M17 12h2" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  // night
  return (
    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" style={iconStyle}>
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        fill="#5f27cd"
        stroke="#5f27cd"
        strokeWidth="2"
      />
      <circle cx="8" cy="8" r="1" fill="white" />
      <circle cx="15" cy="11" r="0.5" fill="white" />
      <circle cx="11" cy="14" r="0.5" fill="white" />
    </svg>
  );
};

export const TimePatternSlide: React.FC<TimePatternSlideProps> = ({
  favoriteTimeOfDay,
  favoriteDayOfWeek,
}) => {
  const timeOfDay = favoriteTimeOfDay.timeOfDay;
  const accentColor = TIME_COLORS[timeOfDay] || '#667eea';

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          timeOfDay === 'night'
            ? 'linear-gradient(180deg, #0c0c1e 0%, #1a1a3e 50%, #2d2d5a 100%)'
            : timeOfDay === 'morning'
              ? 'linear-gradient(180deg, #2d1b4e 0%, #5c3d7a 50%, #ff9a56 100%)'
              : timeOfDay === 'evening'
                ? 'linear-gradient(180deg, #1a1a2e 0%, #4a2c4a 50%, #ff6b6b 100%)'
                : 'linear-gradient(180deg, #1e3c72 0%, #2a5298 50%, #74b9ff 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Animated Stars for Night */}
      {timeOfDay === 'night' && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                position: 'absolute',
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                width: '4px',
                height: '4px',
                background: 'white',
                borderRadius: '50%',
              }}
            />
          ))}
        </div>
      )}

      {/* Sun rays for afternoon */}
      {timeOfDay === 'afternoon' && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255,205,60,0.4) 0%, transparent 70%)',
          }}
        />
      )}

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
        Deine Watch-Gewohnheiten
      </motion.p>

      {/* Big Time of Day Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
        style={{
          marginBottom: '20px',
          zIndex: 1,
        }}
      >
        <TimeIcon timeOfDay={timeOfDay} />
      </motion.div>

      {/* Time of Day Label */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          color: 'white',
          fontSize: 'clamp(2rem, 8vw, 3.5rem)',
          fontWeight: 'bold',
          marginBottom: '10px',
          textShadow: `0 0 40px ${accentColor}`,
          zIndex: 1,
        }}
      >
        {TIME_LABELS[timeOfDay] || favoriteTimeOfDay.label}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.7 }}
        style={{
          color: 'white',
          fontSize: '1.2rem',
          marginBottom: '10px',
          zIndex: 1,
        }}
      >
        ist deine liebste Watchtime
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '12px 30px',
          marginBottom: '40px',
          zIndex: 1,
        }}
      >
        <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {favoriteTimeOfDay.percentage}%
        </span>
        <span style={{ color: 'white', opacity: 0.8, marginLeft: '8px' }}>deiner Views</span>
      </motion.div>

      {/* Day of Week Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(15px)',
          borderRadius: '24px',
          padding: '25px 40px',
          textAlign: 'center',
          zIndex: 1,
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
          </svg>
        </motion.div>
        <p style={{ color: 'white', opacity: 0.7, marginBottom: '8px', fontSize: '0.9rem' }}>
          Dein liebster Serien-Tag
        </p>
        <h3
          style={{
            color: 'white',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          {favoriteDayOfWeek.dayName}
        </h3>
        <p style={{ color: 'white', opacity: 0.8 }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            {favoriteDayOfWeek.percentage}%
          </span>{' '}
          deiner Views
        </p>
      </motion.div>
    </div>
  );
};

export default TimePatternSlide;
