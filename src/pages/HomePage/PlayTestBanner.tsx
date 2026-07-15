import { Android, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/haptics';
import { tapScaleTight } from '../../lib/motion';

const DISMISS_KEY = 'playTestBannerDismissed';
const TEST_URL = 'https://play.google.com/apps/testing/de.tvrank.app';

const isAndroid = (): boolean =>
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

/**
 * Lädt Android-Nutzer ein, dem geschlossenen Play-Test beizutreten
 * (12 aktive Tester über 14 Tage sind Googles Bedingung für den
 * Produktions-Release). Nur auf Android-Geräten sichtbar, wegklickbar.
 */
export const PlayTestBanner = () => {
  const { currentTheme } = useTheme();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!isAndroid() || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass"
      style={{
        margin: '0 16px 20px',
        borderRadius: 'var(--radius-xl)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--theme-primary-12)',
          border: '1px solid var(--theme-primary-25)',
          color: currentTheme.primary,
        }}
      >
        <Android />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: currentTheme.text.secondary,
            marginBottom: 2,
          }}
        >
          Hol TV-Rank in den Play Store!
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: currentTheme.text.muted }}>
          Werde Tester der Android-App — je mehr mitmachen, desto schneller ist sie offiziell im
          Store.
        </div>
      </div>

      <motion.a
        whileTap={tapScaleTight}
        href={TEST_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => hapticTap()}
        style={{
          flexShrink: 0,
          padding: '10px 16px',
          borderRadius: 'var(--radius-full)',
          background: currentTheme.primary,
          color: currentTheme.background.default,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: 'var(--glow-soft)',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Tester werden
      </motion.a>

      <motion.button
        whileTap={tapScaleTight}
        onClick={dismiss}
        aria-label="Hinweis ausblenden"
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--glass-light)',
          color: currentTheme.text.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Close style={{ fontSize: 16 }} />
      </motion.button>
    </motion.div>
  );
};
