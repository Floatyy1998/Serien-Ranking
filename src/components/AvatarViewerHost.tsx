import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Close from '@mui/icons-material/Close';
import { useTheme } from '../contexts/ThemeContext';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { AVATAR_VIEW_EVENT, type AvatarViewRequest } from '../lib/avatarViewer';
import { t } from '../services/i18n';

/**
 * Zeigt ein Profilbild formatfüllend. Einmal in MobileApp gemountet; geöffnet
 * wird es über `showAvatar()` von den Avataren in Freundesprofil, Rangliste und
 * öffentlichem Profil.
 */
export const AvatarViewerHost = () => {
  const { currentTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [request, setRequest] = useState<AvatarViewRequest | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const detail = (e as CustomEvent<AvatarViewRequest>).detail;
      if (detail?.url) setRequest(detail);
    };
    window.addEventListener(AVATAR_VIEW_EVENT, onRequest);
    return () => window.removeEventListener(AVATAR_VIEW_EVENT, onRequest);
  }, []);

  const close = useCallback(() => setRequest(null), []);
  useAndroidBack(request !== null, close);

  // Escape schliesst; der Schliessen-Knopf bekommt den Fokus, damit die
  // Tastaturbedienung nicht hinter dem Overlay haengen bleibt.
  useEffect(() => {
    if (!request) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, close]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={t('Profilbild von {name}', { name: request.name })}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
          }}
        >
          <motion.img
            initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            src={request.url}
            alt={t('Profilbild von {name}', { name: request.name })}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 'min(92vw, 520px)',
              maxHeight: '70vh',
              width: 'auto',
              borderRadius: '50%',
              objectFit: 'cover',
              aspectRatio: '1 / 1',
              boxShadow: `0 24px 60px -20px ${currentTheme.primary}80`,
              border: `2px solid ${currentTheme.primary}`,
            }}
          />
          <span style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>{request.name}</span>

          <button
            ref={closeRef}
            onClick={close}
            aria-label={t('Schließen')}
            style={{
              position: 'absolute',
              top: 'calc(16px + env(safe-area-inset-top))',
              right: '16px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <Close />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
