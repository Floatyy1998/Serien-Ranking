import { Close } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { detectAppInstallTarget } from '../lib/appInstallTarget';
import { tapScaleTight } from '../lib/motion';
import { t } from '../services/i18n';

const DISMISS_KEY = 'appInstallBannerDismissedAt';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Zeigt Nutzern im mobilen Browser (ohne installierte App) einen Hinweis
 * „App holen" mit direktem Store-Link. Sinnvoll v.a. für geteilte Links
 * (öffentliches Profil, Serien-/Film-Deeplinks), die auf einem Handy ohne
 * App im Browser landen.
 */
export const AppInstallBanner = () => {
  const { currentTheme } = useTheme();
  const [target, setTarget] = useState(detectAppInstallTarget);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!target.os) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw && Date.now() - Number(raw) < COOLDOWN_MS) return;
    } catch {
      // localStorage blockiert (Privatmodus) → Banner trotzdem zeigen
    }
    // Kurz vor dem Einblenden erneut pruefen: die Capacitor-Bruecke wird bei
    // per URL geladener App erst nach dem ersten Render injiziert. Die
    // Momentaufnahme vom Mount zeigte sonst den App-Hinweis INNERHALB der App.
    const timer = setTimeout(() => {
      const fresh = detectAppInstallTarget();
      if (!fresh.os) {
        setTarget(fresh);
        return;
      }
      setVisible(true);
    }, 1500);
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
