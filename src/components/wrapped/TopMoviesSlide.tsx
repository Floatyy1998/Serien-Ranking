/**
 * TopMoviesSlide - Zeigt die Top-Filme des Jahres
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TopMovieEntry } from '../../types/Wrapped';

interface TopMoviesSlideProps {
  topMovies: TopMovieEntry[];
  maxItems?: number;
}

export const TopMoviesSlide: React.FC<TopMoviesSlideProps> = ({
  topMovies,
  maxItems = 5,
}) => {
  const displayMovies = topMovies.slice(0, maxItems);
  const topMovie = displayMovies[0];
  const otherMovies = displayMovies.slice(1);

  if (displayMovies.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
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
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #e63946 0%, #1d3557 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
            </svg>
          </motion.div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '15px' }}>
            Keine Filme dieses Jahr
          </h2>
          <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>
            Zeit für einen Filmabend!
          </p>
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
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '40px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Glow Effect */}
      {topMovie?.poster && (
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '350px',
            height: '350px',
            background: `radial-gradient(circle, rgba(230,57,70,0.4) 0%, transparent 70%)`,
            filter: 'blur(60px)',
            zIndex: 0,
          }}
        />
      )}

      {/* Film Strip Decoration */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30px', background: 'repeating-linear-gradient(90deg, #111 0px, #111 20px, #333 20px, #333 40px)', opacity: 0.3 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', background: 'repeating-linear-gradient(90deg, #111 0px, #111 20px, #333 20px, #333 40px)', opacity: 0.3 }} />

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
        Deine Top Filme
      </motion.p>

      {/* Hero Movie Poster */}
      {topMovie && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          style={{
            position: 'relative',
            zIndex: 1,
            marginBottom: '20px',
          }}
        >
          {/* Gold Crown */}
          <motion.div
            initial={{ opacity: 0, y: -20, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.8, type: 'spring' }}
            style={{
              position: 'absolute',
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255,215,0,0.4)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </motion.div>

          {topMovie.poster ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${topMovie.poster}`}
              alt={topMovie.title}
              style={{
                width: '200px',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(230,57,70,0.3)',
              }}
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '300px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e63946 0%, #1d3557 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>
              </svg>
            </div>
          )}
        </motion.div>
      )}

      {/* Movie Title & Info */}
      {topMovie && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ textAlign: 'center', zIndex: 1, marginBottom: '30px' }}
        >
          <h2
            style={{
              color: 'white',
              fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
              fontWeight: 'bold',
              marginBottom: '8px',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {topMovie.title}
          </h2>
          {topMovie.rating && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffd700">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <span style={{ color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {topMovie.rating.toFixed(1)}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Other Movies */}
      {otherMovies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            zIndex: 1,
            maxWidth: '100%',
          }}
        >
          {otherMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              style={{
                textAlign: 'center',
                width: '80px',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '-8px',
                    background: index === 0 ? '#c0c0c0' : index === 1 ? '#cd7f32' : '#666',
                    color: 'white',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 2,
                  }}
                >
                  {index + 2}
                </span>
                {movie.poster ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w154${movie.poster}`}
                    alt={movie.title}
                    style={{
                      width: '80px',
                      borderRadius: '8px',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '80px',
                      height: '120px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                      <rect x="2" y="2" width="20" height="20" rx="2"/>
                      <path d="M7 2v20M17 2v20M2 12h20"/>
                    </svg>
                  </div>
                )}
              </div>
              <p
                style={{
                  color: 'white',
                  fontSize: '0.7rem',
                  opacity: 0.9,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {movie.title}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default TopMoviesSlide;
