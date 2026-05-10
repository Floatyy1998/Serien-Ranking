import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContextDef';

/**
 * Toast unten rechts, der erscheint sobald electron-updater ein Update
 * heruntergeladen hat. Der User entscheidet selbst, wann installiert wird —
 * "Jetzt installieren" quittet die App und startet den Installer, "Spaeter"
 * versteckt den Toast bis zum naechsten App-Start (oder zur naechsten
 * Update-Pruefung wenn ein noch neueres Release rauskommt).
 *
 * Im Browser/PWA passiert nichts: window.electronAPI ist undefined.
 */
export const ElectronUpdateToast = () => {
  const { currentTheme } = useTheme();
  const [readyVersion, setReadyVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onUpdateStatus) return;

    const unsubscribe = api.onUpdateStatus((status) => {
      if (status.state === 'ready') {
        setReadyVersion(status.version);
        setDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  const visible = !!readyVersion && !dismissed;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await window.electronAPI?.installUpdate();
    } catch {
      setInstalling(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 'calc(20px + env(safe-area-inset-bottom))',
            right: 20,
            zIndex: 200000,
            maxWidth: 360,
            padding: 16,
            borderRadius: 16,
            background: `${currentTheme.background.surface}f0`,
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            border: `1px solid ${currentTheme.primary}40`,
            boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
            color: currentTheme.text.primary,
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🚀</span>
            <strong style={{ fontSize: 14, fontWeight: 700 }}>Update bereit</strong>
          </div>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: currentTheme.text.secondary,
              lineHeight: 1.4,
            }}
          >
            Version <strong>{readyVersion}</strong> wurde heruntergeladen. Installation startet die
            App neu.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDismissed(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: currentTheme.text.secondary,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Später
            </button>
            <button
              onClick={handleInstall}
              disabled={installing}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: installing ? 'wait' : 'pointer',
                opacity: installing ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {installing ? 'Installiere…' : 'Jetzt installieren'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
