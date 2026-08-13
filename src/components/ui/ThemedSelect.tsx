/** Theme-gerechtes Dropdown als Ersatz für natives <select> (dessen Liste ist OS-gerendert und nicht stylebar). */

import { Check, ExpandMore } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

const PANEL_MAX_H = 320;
const GAP = 6;

interface PanelBox {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

export interface ThemedSelectOption {
  value: string;
  label: string;
}

interface ThemedSelectProps {
  value: string;
  options: ThemedSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** Breite des Triggers; Panel folgt ihr. Default: min(320px, 100%). */
  width?: string;
}

export const ThemedSelect = ({ value, options, onChange, ariaLabel, width }: ThemedSelectProps) => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PanelBox | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  /**
   * Panel am Trigger ausrichten; nach unten, sonst nach oben.
   *
   * Gerechnet wird RELATIV ZUM BODY, nicht zum Viewport: die Anzeigegroesse
   * setzt `zoom` auf <html>, und ein `position: fixed` Panel wuerde die schon
   * skalierten Werte aus getBoundingClientRect() ein zweites Mal skaliert
   * bekommen. Die Differenz zweier Rects aus derselben Quelle ist dagegen
   * unabhaengig vom Zoom.
   */
  const measure = useCallback(() => {
    const trigger = rootRef.current;
    if (!trigger) return;
    // Die Anzeigegroesse setzt `zoom` auf <html>. getBoundingClientRect()
    // liefert dann BEREITS skalierte Pixel, waehrend unsere top/left/width
    // beim Rendern nochmal skaliert wuerden — also einmal herausrechnen.
    const raw = parseFloat(getComputedStyle(document.documentElement).zoom || '1');
    const zoom = Number.isFinite(raw) && raw > 0 ? raw : 1;

    const rect = trigger.getBoundingClientRect();
    const origin = document.body.getBoundingClientRect();
    const viewport = document.documentElement.clientHeight;
    const below = viewport - rect.bottom / zoom - GAP - 8;
    const above = rect.top / zoom - GAP - 8;
    const flip = below < Math.min(PANEL_MAX_H, 200) && above > below;
    const maxHeight = Math.max(120, Math.min(PANEL_MAX_H, flip ? above : below));
    const top = (rect.top - origin.top) / zoom;
    const bottom = (rect.bottom - origin.top) / zoom;
    setBox({
      left: (rect.left - origin.left) / zoom,
      width: rect.width / zoom,
      maxHeight,
      top: flip ? top - GAP - maxHeight : bottom + GAP,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) measure();
    else setBox(null);
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // Das Panel haengt am document.body, liegt also NICHT im Trigger-Baum.
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // Scrollt die Seite unter dem Panel weg, wandert es mit statt zu kleben.
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    // Aktive Option beim Öffnen in Sicht bringen
    activeItemRef.current?.scrollIntoView?.({ block: 'nearest' });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  return (
    <div ref={rootRef} style={{ position: 'relative', width: width ?? 'min(320px, 100%)' }}>
      <motion.button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        whileTap={{ scale: 0.985 }}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '11px 14px 11px 16px',
          borderRadius: 12,
          border: `1px solid ${open ? `${currentTheme.primary}88` : currentTheme.border.default}`,
          background: open ? `${currentTheme.primary}14` : 'rgba(255,255,255,0.04)',
          color: currentTheme.text.primary,
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: open ? `0 0 0 3px ${currentTheme.primary}22` : 'none',
          transition: 'border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}
        >
          {selected?.label ?? value}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', color: open ? currentTheme.primary : currentTheme.text.muted }}
        >
          <ExpandMore style={{ fontSize: 20 }} />
        </motion.span>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && box && (
            <motion.div
              ref={panelRef}
              role="listbox"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              style={{
                /* Am document.body statt im Trigger-Baum: Sheets und Dialoge
                   haben overflow:hidden und wuerden das Panel abschneiden.
                   absolute (Seiten-Koordinaten), nicht fixed — siehe measure(). */
                position: 'absolute',
                top: box.top,
                left: box.left,
                width: box.width,
                zIndex: 1200,
                maxHeight: box.maxHeight,
                overflowY: 'auto',
                padding: 6,
                borderRadius: 14,
                // Deckende Basis: Blur darf nie die einzige Deckung sein (Opacity-Ancestor-Gotcha)
                background: 'rgba(12, 16, 26, 0.97)',
                WebkitBackdropFilter: 'blur(16px)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: `0 18px 48px rgba(0,0,0,0.65), 0 0 24px ${currentTheme.primary}18`,
                transformOrigin: 'top center',
              }}
            >
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    ref={active ? activeItemRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setOpen(false);
                      if (!active) onChange(opt.value);
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 9,
                      border: 'none',
                      background: active ? `${currentTheme.primary}1e` : 'transparent',
                      color: active ? currentTheme.primary : currentTheme.text.secondary,
                      fontWeight: active ? 700 : 500,
                      fontSize: 14,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {opt.label}
                    </span>
                    {active && <Check style={{ fontSize: 16, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
