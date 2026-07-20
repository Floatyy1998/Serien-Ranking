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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(12px + env(safe-area-inset-bottom))',
            zIndex: 'var(--z-toast)' as string,
            borderRadius: 18,
            padding: '11px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            // Dezentes dunkles Glas statt grünem Klotz.
            background: 'rgba(18, 20, 26, 0.82)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            boxShadow: '0 18px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Logo auf ruhigem Chip, damit das grüne Icon nicht dominiert */}
          <div
            aria-hidden
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <img src="/tv-logo.svg" alt="" width={26} height={26} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
              {t('TV-Rank als App')}
            </div>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.35,
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t('Widgets, Push & schneller.')}
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
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: `color-mix(in srgb, ${currentTheme.primary} 16%, transparent)`,
              color: currentTheme.primary,
              border: `1px solid color-mix(in srgb, ${currentTheme.primary} 45%, transparent)`,
              fontSize: 13,
              fontWeight: 600,
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            {t('Öffnen')}
          </motion.a>

          <button
            onClick={dismiss}
            aria-label={t('Schließen')}
            style={{
              flexShrink: 0,
              width: 26,
              height: 26,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
            }}
          >
            <Close style={{ fontSize: 16 }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
