import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';

export function UpdateToast() {
  const [show, setShow] = useState(false);

  const checkForWaitingWorker = useCallback(() => {
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg?.waiting) {
        console.log('[UpdateToast] Wartender Worker gefunden — zeige Toast');
        setShow(true);
      }
    });
  }, []);

  useEffect(() => {
    // 1) Listen for event from SW manager
    const handler = () => {
      console.log('[UpdateToast] sw-update-available Event empfangen');
      setShow(true);
    };
    window.addEventListener('sw-update-available', handler);

    // 2) Check immediately (covers race condition with splash screen)
    checkForWaitingWorker();

    // 3) Re-check when user returns to tab
    const visHandler = () => {
      if (document.visibilityState === 'visible') checkForWaitingWorker();
    };
    document.addEventListener('visibilitychange', visHandler);

    // 4) Poll every 30s as safety net
    const interval = setInterval(checkForWaitingWorker, 30_000);

    return () => {
      window.removeEventListener('sw-update-available', handler);
      document.removeEventListener('visibilitychange', visHandler);
      clearInterval(interval);
    };
  }, [checkForWaitingWorker]);

  const handleUpdate = () => {
    setShow(false);
    navigator.serviceWorker?.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 80,
            left: 12,
            right: 12,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 16,
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            color: '#fff',
            fontSize: 14,
          }}
        >
          <SystemUpdateAltRoundedIcon
            sx={{ fontSize: 20, color: 'var(--theme-primary, #8b5cf6)', flexShrink: 0 }}
          />
          <span>Neues Update verfügbar</span>
          <button
            onClick={handleUpdate}
            style={{
              background: 'var(--theme-primary, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Aktualisieren
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
