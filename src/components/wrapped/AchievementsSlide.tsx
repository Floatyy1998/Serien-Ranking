/**
 * AchievementsSlide - Zeigt freigeschaltete Achievements
 */

import React from 'react';
import { motion } from 'framer-motion';
import { WrappedAchievement } from '../../types/Wrapped';

interface AchievementsSlideProps {
  achievements: WrappedAchievement[];
}

// SVG Icon Component for Achievements
const AchievementIcon: React.FC<{ icon: string; size?: number; color?: string }> = ({
  icon,
  size = 40,
  color = 'white',
}) => {
  const iconProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
  };

  switch (icon) {
    case 'moon':
      return (
        <svg {...iconProps}>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={color} stroke="none" />
        </svg>
      );
    case 'sunrise':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="17" r="5" stroke={color} fill="none" />
          <path
            d="M12 2v4M4.22 10.22l2.83 2.83M1 17h4M19 17h4M16.95 13.05l2.83-2.83"
            strokeLinecap="round"
          />
          <path d="M3 21h18" strokeLinecap="round" />
        </svg>
      );
    case 'crown':
      return (
        <svg {...iconProps} fill={color} stroke="none">
          <path d="M2 17l3-9 5 6 2-8 2 8 5-6 3 9H2zM4 17v4h16v-4" />
        </svg>
      );
    case 'film':
      return (
        <svg {...iconProps}>
          <rect x="2" y="2" width="20" height="20" rx="2" />
          <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
        </svg>
      );
    case 'tv':
      return (
        <svg {...iconProps}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" strokeLinecap="round" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <polygon
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            fill={color}
            stroke="none"
          />
        </svg>
      );
    case 'sword':
      return (
        <svg {...iconProps} fill={color} stroke="none">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M3 3l18 18" />
          <path d="M14.5 17.5L17 15l4 4-2.5 2.5-4-4z" />
          <path d="M19 7l-2-2 3-3 2 2-3 3z" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...iconProps} fill={color} stroke="none">
          <path d="M12 2c-4 4-6 7-6 11a6 6 0 0012 0c0-4-2-7-6-11zm0 15a2.5 2.5 0 01-2.5-2.5c0-1.5 1-2.5 2.5-4 1.5 1.5 2.5 2.5 2.5 4A2.5 2.5 0 0112 17z" />
        </svg>
      );
    case 'runner':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="4" r="2" fill={color} stroke="none" />
          <path d="M4 17l5-5 3 3 5-8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 20l-3-3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'check':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      // Default star icon
      return (
        <svg {...iconProps} fill={color} stroke="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      );
  }
};

// Trophy SVG Icon
const TrophyIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3" stroke="#ffd700" strokeWidth="2" />
    <path d="M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" stroke="#ffd700" strokeWidth="2" />
    <path d="M6 4h12v8a6 6 0 11-12 0V4z" fill="#ffd700" />
    <path d="M9 21h6M12 17v4" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Sparkle SVG for background
const SparkleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

export const AchievementsSlide: React.FC<AchievementsSlideProps> = ({ achievements }) => {
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Sparkle Effect */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{
              position: 'absolute',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            <SparkleIcon size={12 + Math.random() * 8} />
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
          marginBottom: '20px',
          zIndex: 1,
        }}
      >
        Deine Achievements
      </motion.p>

      {/* Trophy Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
        style={{
          marginBottom: '10px',
          zIndex: 1,
        }}
      >
        <TrophyIcon size={80} />
      </motion.div>

      {/* Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
          borderRadius: '20px',
          padding: '10px 30px',
          marginBottom: '30px',
          zIndex: 1,
        }}
      >
        <span style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold' }}>
          {unlockedAchievements.length} / {achievements.length}
        </span>
        <span style={{ color: 'white', opacity: 0.9, marginLeft: '8px' }}>freigeschaltet</span>
      </motion.div>

      {/* Unlocked Achievements Grid */}
      {unlockedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '15px',
            width: '100%',
            maxWidth: '500px',
            zIndex: 1,
            marginBottom: '25px',
          }}
        >
          {unlockedAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px 15px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 + index }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}
              >
                <AchievementIcon icon={achievement.icon} size={40} color="#ffd700" />
              </motion.div>
              <h4
                style={{
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                }}
              >
                {achievement.title}
              </h4>
              <p
                style={{
                  color: 'white',
                  opacity: 0.7,
                  fontSize: '0.75rem',
                  lineHeight: 1.3,
                }}
              >
                {achievement.description}
              </p>
              {achievement.value && (
                <p
                  style={{
                    color: '#f5af19',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    marginTop: '8px',
                  }}
                >
                  {achievement.value}
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          style={{ textAlign: 'center', zIndex: 1 }}
        >
          <p
            style={{
              color: 'white',
              opacity: 0.5,
              fontSize: '0.85rem',
              marginBottom: '12px',
            }}
          >
            Nächstes Jahr freischalten:
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {lockedAchievements.slice(0, 5).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '10px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AchievementIcon icon={achievement.icon} size={24} color="rgba(255,255,255,0.4)" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AchievementsSlide;
