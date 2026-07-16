import { Android, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/haptics';
import { tapScaleTight } from '../../lib/motion';

const DISMISS_KEY = 'playTestBannerDismissed';

const isAndroid = (): boolean =>
  typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

/**
 * Lädt Android-Nutzer ein, dem geschlossenen Play-Test beizutreten
 * (12 aktive Tester über 14 Tage sind Googles Bedingung für den
 * Produktions-Release). Interessenten melden sich per Feature-Ticket
 * mit ihrer Play-Store-E-Mail und werden manuell eingeladen.
 * Nur auf Android-Geräten sichtbar, wegklickbar.
 */
export const PlayTestBanner = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
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
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
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
            Du willst die Android-App testen? Öffne ein Feature-Ticket mit deiner Play-Store-E-Mail
            — du wirst dann persönlich zum Test eingeladen.
          </div>
        </div>

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
      </div>

      <div style={{ display: 'flex', marginTop: 12 }}>
        <motion.button
          whileTap={tapScaleTight}
          onClick={() => {
            hapticTap();
            navigate('/bug-report?create=true');
          }}
          style={{
            flex: 1,
            padding: '11px 14px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: currentTheme.primary,
            color: currentTheme.background.default,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: 'var(--glow-soft)',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          Feature-Ticket öffnen
        </motion.button>
      </div>
    </motion.div>
  );
};
