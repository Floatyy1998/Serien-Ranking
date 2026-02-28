/**
 * TopSeriesSlide - Zeigt die Top-Serien des Jahres
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TopSeriesEntry } from '../../types/Wrapped';

interface TopSeriesSlideProps {
  topSeries: TopSeriesEntry[];
  maxItems?: number;
}

export const TopSeriesSlide: React.FC<TopSeriesSlideProps> = ({ topSeries, maxItems = 5 }) => {
  const displaySeries = topSeries.slice(0, maxItems);

  if (displaySeries.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" strokeLinecap="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>Keine Serien dieses Jahr</h2>
        </div>
      </div>
    );
  }

  const topOne = displaySeries[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Glow from #1 Poster */}
      {topOne?.poster && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            height: '60%',
            backgroundImage: `url(https://image.tmdb.org/t/p/w500${topOne.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            opacity: 0.15,
            filter: 'blur(30px)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
        />
      )}

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
          marginBottom: '20px',
        }}
      >
        Deine #1 Serie
      </motion.p>

      {/* #1 Serie - Hero Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        {topOne?.poster ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${topOne.poster}`}
            alt={topOne.title}
            style={{
              width: 'min(200px, 45vw)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(102, 126, 234, 0.3)',
            }}
          />
        ) : (
          <div
            style={{
              width: 'min(200px, 45vw)',
              aspectRatio: '2/3',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" strokeLinecap="round" />
            </svg>
          </div>
        )}

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            color: 'white',
            fontSize: 'clamp(1.3rem, 5vw, 2rem)',
            fontWeight: 'bold',
            marginTop: '20px',
            textAlign: 'center',
            maxWidth: '90%',
          }}
        >
          {topOne?.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '12px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
              {topOne?.episodesWatched}
            </p>
            <p style={{ color: 'white', opacity: 0.6, fontSize: '0.8rem' }}>Episoden</p>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
              {topOne?.minutesWatched >= 60
                ? `${Math.floor(topOne.minutesWatched / 60)}h`
                : `${topOne?.minutesWatched}m`}
            </p>
            <p style={{ color: 'white', opacity: 0.6, fontSize: '0.8rem' }}>geschaut</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Rest der Top 5 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '0 10px',
        }}
      >
        {displaySeries.slice(1, 5).map((series, index) => (
          <motion.div
            key={series.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 'min(80px, 20vw)',
            }}
          >
            <div
              style={{
                position: 'relative',
                marginBottom: '8px',
              }}
            >
              {series.poster ? (
                <img
                  src={`https://image.tmdb.org/t/p/w154${series.poster}`}
                  alt={series.title}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '-8px',
                  width: '24px',
                  height: '24px',
                  background: index === 0 ? '#C0C0C0' : index === 1 ? '#CD7F32' : '#667eea',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {index + 2}
              </div>
            </div>
            <p
              style={{
                color: 'white',
                fontSize: '0.7rem',
                textAlign: 'center',
                opacity: 0.8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
              }}
            >
              {series.title}
            </p>
            <p
              style={{
                color: 'white',
                fontSize: '0.65rem',
                opacity: 0.5,
              }}
            >
              {series.episodesWatched} Ep. ·{' '}
              {series.minutesWatched >= 60
                ? `${Math.floor(series.minutesWatched / 60)}h`
                : `${series.minutesWatched}m`}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TopSeriesSlide;
