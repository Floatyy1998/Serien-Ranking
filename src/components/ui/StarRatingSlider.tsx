import { Star } from '@mui/icons-material';
import { useCallback, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/haptics';
import { t } from '../../services/i18n';

interface StarRatingSliderProps {
  /** Aktueller Wert 0–10 (0 = unbewertet), eine Nachkommastelle. */
  value: number;
  /** Live-Änderung beim Ziehen/Tippen (noch nicht gespeichert). */
  onChange: (value: number) => void;
  /**
   * Ende der Eingabe (Loslassen, Enter, Fokusverlust) — hier gehört das
   * Speichern hin. Beim Ziehen entsteht ein Wert pro Pixel; ohne diesen
   * Abschluss würde jede Zwischenstufe geschrieben.
   */
  onCommit?: (value: number) => void;
  /** Stern-Größe in px (Default 24 — bei 10 Sternen muss die Reihe mobil passen). */
  size?: number;
  /** Numerischen Wert darunter zeigen (Default true). */
  showValue?: boolean;
}

const MAX = 10;
const STARS = 10; // jeder Stern = 1 Punkt, passend zur 1-10-Skala
const STEP = 0.1;

/** :focus-visible kennen nicht alle Umgebungen (jsdom wirft beim Selektor). */
const isFocusVisible = (el: Element): boolean => {
  try {
    return el.matches(':focus-visible');
  } catch {
    return false;
  }
};

const round1 = (v: number): number => Math.round(v * 10) / 10;
const clamp = (v: number): number => Math.max(0, Math.min(MAX, v));

/**
 * Zieh-/Tipp-Sternebewertung mit Dezimalwerten (0–10) und Teilfüllung.
 * Controlled: meldet nur den Entwurf über onChange — Speichern macht der Aufrufer.
 */
export const StarRatingSlider: React.FC<StarRatingSliderProps> = ({
  value,
  onChange,
  onCommit,
  size = 24,
  showValue = true,
}) => {
  const { currentTheme } = useTheme();
  const gold = currentTheme.status?.warning || '#f5b301';
  const muted = currentTheme.text?.muted || 'rgba(255,255,255,0.2)';
  const rowRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  // WebKit vergibt :focus-visible auch nach Touch an tabindex-Elemente — der globale
  // Fokusring rahmte die Sternreihe dann dauerhaft ein. Ring nur bei Tastatur zeigen.
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const lastTick = useRef(-1);
  // Der value-Prop hinkt beim Ziehen einen Render hinterher.
  const latest = useRef(value);

  const commit = useCallback(
    (v: number) => {
      const next = round1(clamp(v));
      latest.current = next;
      const tick = Math.round(next * 2); // Haptik alle 0.5
      if (tick !== lastTick.current) {
        lastTick.current = tick;
        hapticTap();
      }
      onChange(next);
    },
    [onChange]
  );

  const fireCommit = useCallback(() => {
    onCommit?.(latest.current);
  }, [onCommit]);

  const fromClientX = useCallback(
    (clientX: number): number => {
      const el = rowRef.current;
      if (!el) return value;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, ratio)) * MAX;
    },
    [value]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setKeyboardFocus(false);
    setDragging(true);
    commit(fromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    commit(fromClientX(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    setKeyboardFocus(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    fireCommit();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + STEP;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - STEP;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = MAX;
    if (next !== null) {
      e.preventDefault();
      setKeyboardFocus(true);
      commit(next);
      return;
    }
    // Tastatur: nicht bei jedem Pfeiltastendruck speichern, erst auf Enter.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKeyboardFocus(true);
      fireCommit();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div
        ref={rowRef}
        role="slider"
        tabIndex={0}
        aria-label={t('Folge bewerten')}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-valuetext={t('{n} von 10', { n: round1(value) })}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          // Tastatur-Fokus (Tab) meldet sich ohne vorheriges pointerdown
          if (isFocusVisible(e.currentTarget) && !dragging) setKeyboardFocus(true);
        }}
        onBlur={() => {
          setKeyboardFocus(false);
          fireCommit();
        }}
        className="star-slider"
        data-kbd={keyboardFocus ? 'true' : undefined}
        style={{
          display: 'inline-flex',
          gap: '2px',
          padding: '6px 4px',
          touchAction: 'none',
          cursor: 'pointer',
          outline: 'none',
          maxWidth: '100%',
        }}
      >
        {Array.from({ length: STARS }, (_, i) => {
          const frac = Math.max(0, Math.min(1, value - i));
          return (
            <div key={i} style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
              <Star style={{ fontSize: `${size}px`, color: muted, display: 'block' }} />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  width: `${frac * 100}%`,
                  pointerEvents: 'none',
                }}
              >
                <Star style={{ fontSize: `${size}px`, color: gold, display: 'block' }} />
              </div>
            </div>
          );
        })}
      </div>
      {showValue && (
        <div
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: value > 0 ? gold : muted,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {round1(value).toFixed(1)}
          <span style={{ fontSize: '14px', fontWeight: 600, color: currentTheme.text?.muted }}>
            {' '}
            / 10
          </span>
        </div>
      )}
    </div>
  );
};
