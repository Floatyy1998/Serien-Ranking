/**
 * Stift neben den Anbieter-Logos der Detailseite: öffnet einen Dialog, in dem
 * die Serie manuell einem Streaming-Dienst zugeordnet wird (oder zurück auf
 * Automatik). Schreibt users/$uid/subscriptions/seriesOverrides.
 */
import { Add, AutoAwesome, Check } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/haptics';
import { tapScaleTight } from '../../lib/motion';
import { getProviderLogoUrl, KNOWN_PROVIDER_NAMES } from '../../lib/providerMerge';
import {
  getSeriesProviderOverride,
  setSeriesProviderOverride,
} from '../../services/providerOverride';

interface ProviderOverrideButtonProps {
  seriesId: number;
  seriesTitle?: string;
  /** Passend zur ProviderBadges-Größe daneben. */
  size?: 'medium' | 'large';
  /** Ohne Provider wird statt des Add-Chips eine beschriftete Pill gezeigt. */
  hasProviders?: boolean;
  /** Meldet die gespeicherte Zuordnung zurück (null = wieder Automatik). */
  onChange?: (providerName: string | null) => void;
}

export const ProviderOverrideButton = ({
  seriesId,
  seriesTitle,
  size = 'medium',
  hasProviders = true,
  onChange,
}: ProviderOverrideButtonProps) => {
  const { user } = useAuth() || {};
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const openDialog = async () => {
    hapticTap();
    setOpen(true);
    setCurrent(await getSeriesProviderOverride(user.uid, seriesId));
  };

  const choose = async (providerName: string | null) => {
    if (busy) return;
    setBusy(true);
    hapticTap();
    try {
      await setSeriesProviderOverride(user.uid, seriesId, providerName);
      setCurrent(providerName);
      onChange?.(providerName);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const optionStyle = (selected: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    minHeight: 48,
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: selected ? '1px solid var(--theme-primary-40)' : '1px solid var(--glass-border-subtle)',
    background: selected ? 'var(--theme-primary-12)' : 'var(--glass-subtle)',
    color: currentTheme.text.secondary,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  });

  const chipDiameter = size === 'large' ? 36 : 28;

  return (
    <>
      {hasProviders ? (
        // Fügt sich als gestrichelter „+"-Chip in die Logo-Reihe ein
        <motion.button
          whileTap={tapScaleTight}
          onClick={openDialog}
          aria-label="Anbieter zuordnen"
          title="Anbieter zuordnen"
          style={{
            // Exakte Badge-Maße erzwingen — die globale .mobile-app-button-Regel
            // bläht kleine Buttons sonst über min-width/-height auf.
            width: chipDiameter,
            height: chipDiameter,
            minWidth: chipDiameter,
            minHeight: chipDiameter,
            maxWidth: chipDiameter,
            maxHeight: chipDiameter,
            padding: 0,
            boxSizing: 'border-box',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: size === 'large' ? 10 : 8,
            border: '1.5px dashed var(--glass-border-medium)',
            background: 'transparent',
            color: currentTheme.text.muted,
            cursor: 'pointer',
            opacity: 0.8,
          }}
        >
          <Add style={{ fontSize: size === 'large' ? 20 : 16 }} />
        </motion.button>
      ) : (
        // Kein Provider bekannt: einladende Pill statt einsamem Icon
        <motion.button
          whileTap={tapScaleTight}
          onClick={openDialog}
          aria-label="Anbieter zuordnen"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minHeight: chipDiameter + 6,
            padding: '6px 14px 6px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1.5px dashed var(--glass-border-medium)',
            background: 'var(--glass-subtle)',
            color: currentTheme.text.muted,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Add style={{ fontSize: 16 }} />
          Anbieter zuordnen
        </motion.button>
      )}

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 'var(--z-modal)' as string,
                background: 'var(--overlay-backdrop)',
                WebkitBackdropFilter: 'var(--blur-sm)',
                backdropFilter: 'var(--blur-sm)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 48, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                onClick={(e) => e.stopPropagation()}
                className="liquid-glass"
                style={{
                  width: 'min(440px, calc(100vw - 24px))',
                  maxHeight: '78vh',
                  overflowY: 'auto',
                  margin: '0 12px calc(16px + env(safe-area-inset-bottom))',
                  borderRadius: 'var(--radius-2xl)',
                  padding: '18px 16px calc(14px + env(safe-area-inset-bottom))',
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: currentTheme.text.secondary,
                    marginBottom: 2,
                  }}
                >
                  Anbieter zuordnen
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: currentTheme.text.muted,
                    marginBottom: 14,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {seriesTitle
                    ? `Wo läuft „${seriesTitle}" für dich?`
                    : 'Wo läuft diese Serie für dich?'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <motion.button
                    whileTap={tapScaleTight}
                    onClick={() => choose(null)}
                    disabled={busy}
                    style={optionStyle(current === null)}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--theme-primary-12)',
                        color: currentTheme.primary,
                      }}
                    >
                      <AutoAwesome style={{ fontSize: 17 }} />
                    </span>
                    <span style={{ flex: 1 }}>Automatisch (TMDB)</span>
                    {current === null && (
                      <Check style={{ fontSize: 18, color: currentTheme.primary }} />
                    )}
                  </motion.button>

                  {KNOWN_PROVIDER_NAMES.map((name) => {
                    const selected = current === name;
                    const logo = getProviderLogoUrl(name);
                    return (
                      <motion.button
                        key={name}
                        whileTap={tapScaleTight}
                        onClick={() => choose(name)}
                        disabled={busy}
                        style={optionStyle(selected)}
                      >
                        {logo ? (
                          <img
                            src={logo}
                            alt=""
                            width={30}
                            height={30}
                            style={{ borderRadius: 8, flexShrink: 0 }}
                          />
                        ) : (
                          <span style={{ width: 30, height: 30, flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1 }}>{name}</span>
                        {selected && (
                          <Check style={{ fontSize: 18, color: currentTheme.primary }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
