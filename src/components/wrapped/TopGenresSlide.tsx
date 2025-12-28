/**
 * TopGenresSlide - Zeigt die Top-Genres des Jahres mit Animationen
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TopGenreEntry } from '../../types/Wrapped';

interface TopGenresSlideProps {
  topGenres: TopGenreEntry[];
  maxItems?: number;
}

// Genre-Icons für visuelle Darstellung
const GENRE_ICONS: Record<string, string> = {
  'Action': '💥',
  'Adventure': '🗺️',
  'Animation': '🎨',
  'Comedy': '😂',
  'Crime': '🔍',
  'Documentary': '📹',
  'Drama': '🎭',
  'Family': '👨‍👩‍👧‍👦',
  'Fantasy': '🧙',
  'History': '📜',
  'Horror': '👻',
  'Music': '🎵',
  'Mystery': '🔮',
  'Romance': '💕',
  'Science Fiction': '🚀',
  'Sci-Fi & Fantasy': '🚀',
  'TV Movie': '📺',
  'Thriller': '😱',
  'War': '⚔️',
  'Western': '🤠',
  'Action & Adventure': '💥',
  'Kids': '🧒',
  'News': '📰',
  'Reality': '📷',
  'Soap': '💔',
  'Talk': '🎤',
  'War & Politics': '⚔️',
};

// Farben für Genre-Balken
const GENRE_COLORS = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export const TopGenresSlide: React.FC<TopGenresSlideProps> = ({
  topGenres,
  maxItems = 5,
}) => {
  const displayGenres = topGenres.slice(0, maxItems);

  if (displayGenres.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #2d1f3d 100%)',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            style={{ fontSize: '4rem', marginBottom: '20px' }}
          >
            🎬
          </motion.div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>
            Keine Genre-Daten
          </h2>
          <p style={{ opacity: 0.6, marginTop: '10px' }}>
            Schau mehr Serien und Filme!
          </p>
        </div>
      </div>
    );
  }

  const topGenre = displayGenres[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1f1135 0%, #2d1f4a 50%, #1a1a2e 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Animated Background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.3 }}>
        {displayGenres.slice(0, 3).map((genre, i) => (
          <motion.div
            key={genre.genre}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
              fontSize: '8rem',
              opacity: 0.15,
              filter: 'blur(2px)',
            }}
          >
            {GENRE_ICONS[genre.genre] || '🎬'}
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          color: 'white',
          textAlign: 'center',
          fontSize: '0.9rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '30px',
          zIndex: 1,
        }}
      >
        Dein Lieblings-Genre
      </motion.p>

      {/* Top Genre - Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px',
          zIndex: 1,
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            fontSize: 'clamp(5rem, 20vw, 8rem)',
            marginBottom: '15px',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
          }}
        >
          {GENRE_ICONS[topGenre.genre] || '🎬'}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            color: 'white',
            fontSize: 'clamp(1.8rem, 6vw, 3rem)',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {topGenre.genre}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '10px 25px',
            marginTop: '15px',
          }}
        >
          <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {topGenre.percentage}%
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginLeft: '8px' }}>
            deiner Watchtime
          </span>
        </motion.div>
      </motion.div>

      {/* Rest der Genres als animierte Balken */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          zIndex: 1,
        }}
      >
        {displayGenres.map((genre, index) => (
          <motion.div
            key={genre.genre}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>
                  {GENRE_ICONS[genre.genre] || '🎬'}
                </span>
                <span style={{ color: 'white', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  {genre.genre}
                </span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                {genre.percentage}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '5px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${genre.percentage}%` }}
                transition={{ delay: 1 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: GENRE_COLORS[index % GENRE_COLORS.length],
                  borderRadius: '5px',
                  boxShadow: '0 2px 10px rgba(255,255,255,0.2)',
                }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TopGenresSlide;
