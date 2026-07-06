/**
 * Glass-Dropdown für die Monatsauswahl der Serien-Timeline.
 *
 * Ersetzt das native <select> (öffnete ein weißes System-Menü, das mit dem
 * Cinematic-Dark-Theme bricht, und hatte Touch-Targets < 44px). Muster
 * übernommen aus `SerienKalender/SerienKalenderFilter` (Glass-Panel,
 * Klick-außerhalb + Escape schließen, Theme-Farben, ARIA-Listbox).
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, KeyboardArrowDown } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SerienTabMonthSelectProps {
  /** 1-basierter Monat. */
  value: number;
  onChange: (month: number) => void;
  months: string[];
  /** Screenreader-Name für den Trigger, z. B. „Startmonat". */
  ariaLabel: string;
  compact?: boolean;
}

export const SerienTabMonthSelect: React.FC<SerienTabMonthSelectProps> = ({
  value,
  onChange,
  months,
  ariaLabel,
  compact = false,
}) => {
  const { currentTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (month: number) => {
    onChange(month);
    setOpen(false);
  };

  const primaryColor = currentTheme.primary;

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex' }}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
          boxSizing: 'border-box',
          padding: compact ? '6px 8px 6px 12px' : '8px 10px 8px 14px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${primaryColor}30`,
          background: `${primaryColor}15`,
          color: currentTheme.text.primary,
          fontSize: compact ? 12 : 13,
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>{months[value - 1]}</span>
        <KeyboardArrowDown
          style={{
            fontSize: 18,
            color: primaryColor,
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label={ariaLabel}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 50,
              width: 'max-content',
              minWidth: '100%',
              maxHeight: 300,
              overflowY: 'auto',
              padding: 6,
              transformOrigin: 'top left',
              borderRadius: 'var(--radius-lg)',
              background: `linear-gradient(160deg, ${currentTheme.background.surface}f2, ${currentTheme.background.default}f2)`,
              border: `1px solid color-mix(in srgb, ${primaryColor} 30%, transparent)`,
              backdropFilter: 'var(--blur-xl) saturate(1.4)',
              WebkitBackdropFilter: 'var(--blur-xl) saturate(1.4)',
              boxShadow: `var(--shadow-cinematic), 0 0 40px ${primaryColor}22`,
            }}
          >
            {months.map((name, i) => {
              const month = i + 1;
              const selected = month === value;
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(month)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    minHeight: 44,
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: selected ? 700 : 500,
                    fontFamily: 'inherit',
                    color: currentTheme.text.secondary,
                    background: selected
                      ? `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor} 55%, ${currentTheme.accent}))`
                      : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span style={{ flex: 1 }}>{name}</span>
                  {selected && <Check style={{ fontSize: 16, flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
