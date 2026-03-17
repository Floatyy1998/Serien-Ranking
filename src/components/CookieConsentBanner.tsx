import { Cookie } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useState } from 'react';
import { getAnalyticsConsent, setAnalyticsConsent } from '../firebase/analytics';

// Standalone colors - no theme dependency so it works before login / without ThemeProvider
const COLORS = {
  bg: '#1a1a2e',
  bgGlass: 'rgba(26, 26, 46, 0.92)',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#e8e8f0',
  textSecondary: '#9a9ab0',
  textMuted: '#6e6e85',
  accent: '#6c5ce7',
  accentDark: '#5a4bd1',
  surface: 'rgba(255, 255, 255, 0.05)',
};

export const CookieConsentBanner = memo(() => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getAnalyticsConsent() === null) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = useCallback(() => {
    setAnalyticsConsent(true);
    setVisible(false);
  }, []);

  const handleDecline = useCallback(() => {
    setAnalyticsConsent(false);
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 9999,
            maxWidth: 420,
            marginInline: 'auto',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: COLORS.bgGlass,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: '20px',
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${COLORS.accent}25, ${COLORS.accent}10)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Cookie style={{ fontSize: 20, color: COLORS.accent }} />
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: COLORS.text,
                  letterSpacing: '-0.01em',
                }}
              >
                Cookies & Datenschutz
              </span>
            </div>

            {/* Description */}
            <p
              style={{
                margin: '0 0 16px',
                color: COLORS.textSecondary,
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              Wir erfassen anonymisierte Nutzungsdaten zur Verbesserung der App. Die Einwilligung
              ist freiwillig und jederzeit in den{' '}
              <a
                href="/settings"
                style={{
                  color: COLORS.accent,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Einstellungen
              </a>{' '}
              widerrufbar.{' '}
              <a
                href="/privacy"
                style={{
                  color: COLORS.textMuted,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                Mehr erfahren
              </a>
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDecline}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1.5px solid rgba(255, 255, 255, 0.12)`,
                  background: COLORS.surface,
                  color: COLORS.textSecondary,
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.01em',
                }}
              >
                Ablehnen
              </button>
              <button
                onClick={handleAccept}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                  color: '#fff',
                  transition: 'all 0.2s ease',
                  boxShadow: `0 4px 12px ${COLORS.accent}40`,
                  letterSpacing: '-0.01em',
                }}
              >
                Akzeptieren
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CookieConsentBanner.displayName = 'CookieConsentBanner';
