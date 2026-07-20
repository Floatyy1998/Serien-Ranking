import { Close } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { tapScaleTight } from '../lib/motion';
import { t } from '../services/i18n';

// Numerische App-Store-ID ("Apple ID" der App aus App Store Connect →
// App-Informationen). Solange leer, wird das Banner auf iOS NICHT gezeigt
// (kein kaputter Link); Android funktioniert sofort über das Paket.
const APPSTORE_APP_ID = '6791198226';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=de.tvrank.app';
const IOS_URL = APPSTORE_APP_ID ? `https://apps.apple.com/app/id${APPSTORE_APP_ID}` : '';

const DISMISS_KEY = 'appInstallBannerDismissedAt';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

type MobileOS = 'ios' | 'android' | null;

function detectTarget(): { os: MobileOS; url: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { os: null, url: '' };
  }
  const ua = navigator.userAgent || '';

  // Läuft bereits nativ (Capacitor) / als Desktop-Shell (Electron) / als
  // installierte PWA (Homescreen) → kein Install-Hinweis nötig.
  const isNative = !!(
    window as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();
  const isElectron = /electron/i.test(ua);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (isNative || isElectron || isStandalone) return { os: null, url: '' };

  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS meldet sich als Mac
  const isAndroid = /android/i.test(ua);

  if (isAndroid) return { os: 'android', url: ANDROID_URL };
  if (isIOS && IOS_URL) return { os: 'ios', url: IOS_URL };
  return { os: null, url: '' };
}

/**
 * Zeigt Nutzern im mobilen Browser (ohne installierte App) einen Hinweis
 * „App holen" mit direktem Store-Link. Sinnvoll v.a. für geteilte Links
 * (öffentliches Profil, Serien-/Film-Deeplinks), die auf einem Handy ohne
 * App im Browser landen.
 */
export const AppInstallBanner = () => {
  const { currentTheme } = useTheme();
  const [target] = useState(detectTarget);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!target.os) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw && Date.now() - Number(raw) < COOLDOWN_MS) return;
    } catch {
      // localStorage blockiert (Privatmodus) → Banner trotzdem zeigen
    }
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [target.os]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
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
            bottom: 'calc(16px + env(safe-area-inset-bottom))',
            zIndex: 'var(--z-toast)' as string,
            borderRadius: 'var(--radius-xl)',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <img
            src="/tv-logo.svg"
            alt=""
            aria-hidden
            width={44}
            height={44}
            style={{ borderRadius: 12, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: currentTheme.text.secondary,
                marginBottom: 2,
              }}
            >
              {t('TV-Rank als App')}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4, color: currentTheme.text.muted }}>
              {t('Schneller, mit Widgets & Benachrichtigungen — hol dir die App.')}
            </div>
          </div>
          <motion.a
            whileTap={tapScaleTight}
            href={target.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            style={{
              flexShrink: 0,
              padding: '9px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: currentTheme.primary,
              color: currentTheme.background.default,
              fontSize: 13,
              fontWeight: 700,
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              boxShadow: 'var(--glow-soft)',
            }}
          >
            {t('Öffnen')}
          </motion.a>
          <button
            onClick={dismiss}
            aria-label={t('Schließen')}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'transparent',
              color: currentTheme.text.muted,
              cursor: 'pointer',
            }}
          >
            <Close style={{ fontSize: 18 }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
