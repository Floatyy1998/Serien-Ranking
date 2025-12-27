/**
 * IntroSlide - Willkommens-Slide für Wrapped
 */

import React from 'react';
import { motion } from 'framer-motion';

interface IntroSlideProps {
  year: number;
  username?: string;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({ year, username }) => {
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
      {/* Animated Background Circles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.4 }}>
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              position: 'absolute',
              left: `${10 + (i % 4) * 25}%`,
              top: `${20 + Math.floor(i / 4) * 40}%`,
              width: `${100 + i * 30}px`,
              height: `${100 + i * 30}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%)`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', color: 'white', zIndex: 1, padding: '20px' }}
      >
        {username && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 'clamp(1rem, 4vw, 1.5rem)',
              opacity: 0.8,
              marginBottom: '20px',
              letterSpacing: '2px',
            }}
          >
            Hey {username}!
          </motion.p>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            fontWeight: 'normal',
            marginBottom: '10px',
            opacity: 0.7,
            textTransform: 'uppercase',
            letterSpacing: '4px',
          }}
        >
          Dein Jahr in Serien & Filmen
        </motion.h2>

        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          style={{
            fontSize: 'clamp(6rem, 25vw, 14rem)',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            margin: '20px 0',
          }}
        >
          {year}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
            opacity: 0.5,
            letterSpacing: '8px',
            fontWeight: 300,
          }}
        >
          WRAPPED
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1.8 }}
          style={{ marginTop: '80px' }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '0.9rem', letterSpacing: '2px' }}
          >
            SWIPE
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default IntroSlide;
