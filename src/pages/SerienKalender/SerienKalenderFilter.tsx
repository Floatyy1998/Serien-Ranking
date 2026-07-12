/**
 * Genre-Filter-Dropdown für den Serien-Kalender.
 *
 * 1:1-Port des Glass-Dropdowns aus dem Anime-Season-Kalender
 * (AnimeSeasonStudioFilter) — kein natives <select> (das öffnet ein weißes
 * System-Menü, das mit dem Cinematic-Dark-Theme bricht), sondern ein eigenes
 * Glass-Panel im Filterbar-Look: getönter Trigger-Pill, animiertes Panel mit
 * Suchfeld, Hover-/Aktiv-States in Theme-Farben, Klick-außerhalb + Escape
 * schließen. Generisch gehalten (Optionen/Label/Icon als Props), damit dieselbe
 * Komponente hier für Genres und potenziell für Networks dient.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, KeyboardArrowDown, Search } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { hapticSelect } from '../../lib/haptics';

interface SerienKalenderFilterProps {
  options: string[];
  value: string;
  onChange: (option: string) => void;
  /** Trigger-Icon (z. B. <Category /> für Genres). */
  icon: React.ReactNode;
  /** Label für den „alle"-Reset + Trigger-Fallback (z. B. „Alle Genres"). */
  allLabel: string;
  /** Placeholder im Suchfeld (z. B. „Genre suchen …"). */
  searchPlaceholder: string;
}

export const SerienKalenderFilter: React.FC<SerienKalenderFilterProps> = ({
  options,
  value,
  onChange,
  icon,
  allLabel,
  searchPlaceholder,
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
    return q ? options.filter((s) => s.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const active = !!value;
  const label = value || allLabel;

  const pick = (option: string) => {
    hapticSelect();
    onChange(option);
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
        aria-label={allLabel}
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
        <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
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
              backdropFilter: 'var(--glass-filter-xl)',
              WebkitBackdropFilter: 'var(--glass-filter-xl)',
              boxShadow: `var(--shadow-cinematic), 0 0 40px ${currentTheme.primary}22`,
            }}
          >
            {/* Suchfeld (ab genug Optionen). */}
            {options.length > 6 && (
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
                  placeholder={searchPlaceholder}
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
              {/* „Alle …" (Reset) — nur ohne aktive Suche. */}
              {!query.trim() && (
                <FilterRow
                  label={allLabel}
                  selected={!value}
                  onClick={() => pick('')}
                  theme={currentTheme}
                />
              )}
              {filtered.map((option) => (
                <FilterRow
                  key={option}
                  label={option}
                  selected={value === option}
                  onClick={() => pick(option)}
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
                  Nichts gefunden
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function FilterRow({
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
