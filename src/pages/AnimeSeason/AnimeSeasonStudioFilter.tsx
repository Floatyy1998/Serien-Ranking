/**
 * Studio-Filter-Dropdown für den Anime-Season-Kalender.
 *
 * Kein natives <select> (das öffnet ein weißes System-Menü, das mit dem
 * Cinematic-Dark-Theme bricht), sondern ein eigenes Glass-Panel im
 * Filterbar-Look: getönter Trigger-Pill, animiertes Panel mit Suchfeld,
 * Hover-/Aktiv-States in Theme-Farben, Klick-außerhalb + Escape schließen.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Business, Check, KeyboardArrowDown, Search } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticSelect } from '../../lib/haptics';

interface AnimeSeasonStudioFilterProps {
  studios: string[];
  value: string;
  onChange: (studio: string) => void;
}

export const AnimeSeasonStudioFilter: React.FC<AnimeSeasonStudioFilterProps> = ({
  studios,
  value,
  onChange,
}) => {
  const { currentTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  // Klick außerhalb + Escape schließen.
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? studios.filter((s) => s.toLowerCase().includes(q)) : studios;
  }, [studios, query]);

  const active = !!value;
  const label = value || 'Alle Studios';

  const pick = (studio: string) => {
    hapticSelect();
    onChange(studio);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex' }}>
      {/* Trigger-Pill — baugleich zu den anderen Filter-Buttons. */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Studio-Filter"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          // volle Zeilenhöhe wie die Nachbar-Filter (Filterbar: align-items stretch)
          height: '100%',
          boxSizing: 'border-box',
          padding: '11px 12px 11px 14px',
          maxWidth: '220px',
          borderRadius: '18px',
          border: `1px solid ${active ? 'transparent' : currentTheme.border.default}`,
          background: active
            ? `linear-gradient(135deg, ${currentTheme.primary}, color-mix(in srgb, ${currentTheme.primary} 55%, ${currentTheme.accent}))`
            : `${currentTheme.text.muted}08`,
          backdropFilter: 'var(--blur-md)',
          WebkitBackdropFilter: 'var(--blur-md)',
          color: active ? currentTheme.text.secondary : currentTheme.text.muted,
          fontSize: '13.5px',
          fontWeight: active ? 700 : 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          boxShadow: active
            ? `0 4px 24px ${currentTheme.primary}35, inset 0 1px 0 rgba(255,255,255,0.1)`
            : 'none',
          transition: 'color 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <Business style={{ fontSize: '18px', flexShrink: 0 }} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <KeyboardArrowDown
          style={{
            fontSize: '18px',
            flexShrink: 0,
            marginLeft: 'auto',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 50,
              width: 'min(280px, 78vw)',
              transformOrigin: 'top right',
              borderRadius: '18px',
              overflow: 'hidden',
              background: `linear-gradient(160deg, ${currentTheme.background.surface}f2, ${currentTheme.background.default}f2)`,
              border: `1px solid color-mix(in srgb, ${currentTheme.primary} 30%, transparent)`,
              backdropFilter: 'var(--blur-xl) saturate(1.4)',
              WebkitBackdropFilter: 'var(--blur-xl) saturate(1.4)',
              boxShadow: `var(--shadow-cinematic), 0 0 40px ${currentTheme.primary}22`,
            }}
          >
            {/* Suchfeld (ab genug Studios). */}
            {studios.length > 6 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderBottom: `1px solid ${currentTheme.border.default}`,
                }}
              >
                <Search style={{ fontSize: '18px', color: currentTheme.text.muted }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Studio suchen …"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: currentTheme.text.secondary,
                    fontSize: '13.5px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            )}

            <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '6px' }}>
              {/* „Alle Studios" (Reset) — nur ohne aktive Suche. */}
              {!query.trim() && (
                <StudioRow
                  label="Alle Studios"
                  selected={!value}
                  onClick={() => pick('')}
                  theme={currentTheme}
                />
              )}
              {filtered.map((studio) => (
                <StudioRow
                  key={studio}
                  label={studio}
                  selected={value === studio}
                  onClick={() => pick(studio)}
                  theme={currentTheme}
                />
              ))}
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: '14px 12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: currentTheme.text.muted,
                  }}
                >
                  Kein Studio gefunden
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function StudioRow({
  label,
  selected,
  onClick,
  theme,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13.5px',
        fontWeight: selected ? 700 : 500,
        fontFamily: 'inherit',
        color: theme.text.secondary,
        background: selected
          ? `linear-gradient(135deg, ${theme.primary}, color-mix(in srgb, ${theme.primary} 55%, ${theme.accent}))`
          : hover
            ? 'var(--glass-light)'
            : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      {selected && <Check style={{ fontSize: '16px', flexShrink: 0 }} />}
    </button>
  );
}
