/**
 * SummarySlide - Abschluss-Slide mit Zusammenfassung
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { seededRandom } from '../../../utils/seededRandom';
import { GradientText } from '../../ui';
import { useTheme } from '../../../contexts/ThemeContext';
import type { WrappedStats } from '../../../types/Wrapped';
import { hapticTap } from '../../../lib/interaction/haptics';
import { tapScale } from '../../../lib/motion';
import { WrappedShareSheet } from '../WrappedShareCard';
import { SummaryRecap } from './SummaryRecap';
import { t } from '../../../services/i18n';

interface SummarySlideProps {
  stats: WrappedStats;
  onShare?: () => void;
}

// SVG Icons
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

// Pre-compute confetti data outside the component for render purity
const _randSS = seededRandom(456);
const CONFETTI_DATA_SS = Array.from({ length: 20 }, () => ({
  duration: 5 + _randSS() * 5,
  delay: _randSS() * 5,
  left: `${_randSS() * 100}%`,
}));

export const SummarySlide: React.FC<SummarySlideProps> = ({ stats, onShare }) => {
  const confettiData = CONFETTI_DATA_SS;
  const { currentTheme } = useTheme();
  const [shareCardOpen, setShareCardOpen] = useState(false);

  // Confetti shapes - using colored divs instead of emojis
  const confettiColors = [
    'var(--theme-primary, #667eea)',
    '#f5af19',
    '#e94560',
    '#fff',
    currentTheme.accent,
  ];

  return (
    <div
      style={{
        minHeight: 'var(--vh, 100vh)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #e94560 100%)',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: 'calc(28px + env(safe-area-inset-top)) 16px 28px',
        boxSizing: 'border-box',
      }}
    >
      {/* Confetti Effect - using colored shapes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {confettiData.map((c, i) => (
          <motion.div
            key={i}
            animate={{
              y: [-20, window.innerHeight + 20],
              x: [0, Math.sin(i) * 50],
              rotate: [0, 360],
            }}
            transition={{
              duration: c.duration,
              repeat: Infinity,
              delay: c.delay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              top: '-20px',
              left: c.left,
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
          marginBottom: '14px',
        }}
      >
        <GradientText
          as="h2"
          from={currentTheme.text.secondary}
          to="#e94560"
          style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            marginBottom: '5px',
          }}
        >
          {t('Dein {year}', { year: stats.year })}
        </GradientText>
        <p style={{ color: 'white', opacity: 0.8, fontSize: '1.1rem' }}>{t('in Zahlen')}</p>
      </motion.div>

      <SummaryRecap stats={stats} />

      {/* Share Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1,
        }}
      >
        {onShare && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={tapScale}
            onClick={onShare}
            aria-label={t('Jahresrückblick als Text teilen')}
            style={{
              padding: '15px 50px',
              minHeight: '48px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1a1a2e',
              background: 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>{t('Teilen')}</span>
            <ShareIcon />
          </motion.button>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          whileTap={tapScale}
          onClick={() => {
            hapticTap();
            setShareCardOpen(true);
          }}
          aria-label={t('Jahresrückblick als Bild teilen')}
          style={{
            padding: '13px 40px',
            minHeight: '48px',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'white',
            background: 'var(--glass-heavy)',
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
            border: '1px solid var(--glass-border-medium)',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{t('Als Bild teilen')}</span>
          <ImageIcon />
        </motion.button>
      </div>

      {/* Share-Card-Sheet — Touch-Events stoppen, damit Gesten im Sheet
          nicht die Wrapped-Slide-Navigation auslösen (Portal-Events
          bubblen durch den React-Tree zum Slide-Container). */}
      <div
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <WrappedShareSheet
          isOpen={shareCardOpen}
          onClose={() => setShareCardOpen(false)}
          stats={stats}
        />
      </div>

      {/* Thank You Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.5 }}
        style={{
          color: 'white',
          fontSize: '0.95rem',
          marginTop: '18px',
          textAlign: 'center',
          zIndex: 1,
        }}
      >
        {t('Danke für ein tolles Jahr!')}
      </motion.p>
    </div>
  );
};

export default SummarySlide;
