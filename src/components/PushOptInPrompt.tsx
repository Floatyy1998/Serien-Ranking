import { NotificationsActive } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { hapticTap } from '../lib/haptics';
import { tapScaleTight } from '../lib/motion';
import {
  enableNativePush,
  getNativePushPermission,
  isNativePushAvailable,
  isNativePushEnabled,
} from '../services/pushNotifications';

const DISMISS_KEY = 'pushPromptDismissed';

/** Einmaliger Push-Opt-in-Prompt in der nativen App; nach Entscheidung nie wieder (Toggle in den Einstellungen). */
export const PushOptInPrompt = () => {
  const { user, onboardingComplete } = useAuth() || {};
  const { currentTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.uid || onboardingComplete === false) return;
    if (!isNativePushAvailable() || isNativePushEnabled()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      // Nur zeigen, wenn das OS noch nie gefragt wurde — nach System-„Nein" wäre der Prompt eine Sackgasse
      const perm = await getNativePushPermission();
      if (!cancelled && (perm === 'prompt' || perm === 'granted')) setVisible(true);
    }, 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user?.uid, onboardingComplete]);

  const decide = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const activate = async () => {
    if (!user?.uid || busy) return;
    setBusy(true);
    hapticTap();
    try {
      await enableNativePush(user.uid);
    } finally {
      setBusy(false);
      decide();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="liquid-glass"
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 'calc(96px + env(safe-area-inset-bottom))',
            zIndex: 'var(--z-toast)' as string,
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
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
              <NotificationsActive />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: currentTheme.text.secondary,
                  marginBottom: 2,
                }}
              >
                Keine Folge mehr verpassen
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: currentTheme.text.muted }}>
                Neue Folgen deiner Serien, neue Staffeln und Freundschaftsanfragen — direkt als
                Benachrichtigung.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <motion.button
              whileTap={tapScaleTight}
              onClick={decide}
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--glass-border-light)',
                background: 'var(--glass-light)',
                color: currentTheme.text.secondary,
                fontSize: 13,
                fontWeight: 700,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >
              Später
            </motion.button>
            <motion.button
              whileTap={tapScaleTight}
              onClick={activate}
              disabled={busy}
              style={{
                flex: 1.4,
                padding: '11px 14px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: currentTheme.primary,
                color: currentTheme.background.default,
                fontSize: 13,
                fontWeight: 700,
                minHeight: 44,
                cursor: 'pointer',
                boxShadow: 'var(--glow-soft)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Aktivieren
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
