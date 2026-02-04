/**
 * SummarySlide - Abschluss-Slide mit Zusammenfassung
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GradientText } from '../ui';
import { WrappedStats } from '../../types/Wrapped';

interface SummarySlideProps {
  stats: WrappedStats;
  onShare?: () => void;
}

// SVG Icons
const TvIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4" strokeLinecap="round"/>
  </svg>
);

const FilmIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2"/>
    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2" strokeLinecap="round"/>
  </svg>
);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
);

const StarIcon = ({ size = 24, color = '#ffd700' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const STAT_ICONS: Record<string, React.ReactNode> = {
  'Episoden': <TvIcon />,
  'Filme': <FilmIcon />,
  'Stunden': <ClockIcon />,
  'Serien': <BookIcon />,
};

export const SummarySlide: React.FC<SummarySlideProps> = ({
  stats,
  onShare,
}) => {
  const topSerie = stats.topSeries[0];

  // Confetti shapes - using colored divs instead of emojis
  const confettiColors = ['#667eea', '#f5af19', '#e94560', '#fff', '#764ba2'];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #e94560 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Confetti Effect - using colored shapes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, window.innerHeight + 20],
              x: [0, Math.sin(i) * 50],
              rotate: [0, 360],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${Math.random() * 100}%`,
              width: i % 2 === 0 ? '8px' : '12px',
              height: i % 2 === 0 ? '8px' : '12px',
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              background: confettiColors[i % confettiColors.length],
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Year Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        style={{
          textAlign: 'center',
          zIndex: 1,
          marginBottom: '30px',
        }}
      >
        <GradientText as="h2" from="#fff" to="#e94560" style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 'bold',
            marginBottom: '5px',
          }}>
          Dein {stats.year}
        </GradientText>
        <p style={{ color: 'white', opacity: 0.8, fontSize: '1.1rem' }}>
          in Zahlen
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          width: '100%',
          maxWidth: '300px',
          zIndex: 1,
          marginBottom: '20px',
          padding: '0 10px',
        }}
      >
        {[
          { value: stats.totalEpisodesWatched, label: 'Episoden' },
          { value: stats.totalMoviesWatched, label: 'Filme' },
          { value: Math.round(stats.totalHoursWatched), label: 'Stunden' },
          { value: stats.uniqueSeriesWatched, label: 'Serien' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '12px 10px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              {STAT_ICONS[stat.label]}
            </div>
            <p
              style={{
                color: 'white',
                fontSize: '1.4rem',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              {stat.value.toLocaleString()}
            </p>
            <p style={{ color: 'white', opacity: 0.7, fontSize: '0.75rem', margin: 0 }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Top Serie with Poster */}
      {topSerie && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(15px)',
            borderRadius: '20px',
            padding: '20px',
            zIndex: 1,
            marginBottom: '25px',
            width: '100%',
            maxWidth: '350px',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {topSerie.poster ? (
              <img
                src={`https://image.tmdb.org/t/p/w154${topSerie.poster}`}
                alt={topSerie.title}
                style={{
                  width: '60px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '90px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TvIcon />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', opacity: 0.7, fontSize: '0.8rem', marginBottom: '4px' }}>
                Deine #1 Serie
              </p>
              <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {topSerie.title}
              </h3>
              <p style={{ color: '#f5af19', fontSize: '0.9rem', marginTop: '4px' }}>
                {topSerie.episodesWatched} Episoden
              </p>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StarIcon size={20} color="white" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Achievements Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '30px',
          zIndex: 1,
        }}
      >
        <StarIcon size={28} />
        <p style={{ color: 'white', opacity: 0.9 }}>
          <strong>{stats.achievements.filter(a => a.unlocked).length}</strong> Achievements freigeschaltet
        </p>
      </motion.div>

      {/* Share Button */}
      {onShare && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare}
          style={{
            padding: '15px 50px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: '#1a1a2e',
            background: 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
            border: 'none',
            borderRadius: '30px',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>Teilen</span>
          <ShareIcon />
        </motion.button>
      )}

      {/* Thank You Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.5 }}
        style={{
          color: 'white',
          fontSize: '0.95rem',
          marginTop: '35px',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        Danke für ein tolles Jahr!
      </motion.p>
    </div>
  );
};

export default SummarySlide;
