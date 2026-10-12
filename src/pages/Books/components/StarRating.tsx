import React, { useRef, useState } from 'react';
import { hapticSelect } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import './books.css';

const STAR_PATH = 'M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

interface StarRatingProps {
  /** 0–10, halbe Sterne = ganze Punkte. */
  value: number;
  onChange?: (value: number) => void;
  color: string;
  size?: number;
}

/** Fünf Sterne mit halben Schritten; Ziehen über die Reihe stellt den Wert ein. */
export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, color, size = 30 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value;
  const readOnly = !onChange;

  const valueAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return value;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.max(1, Math.ceil(ratio * 10));
  };

  const commit = (next: number) => {
    setPreview(null);
    if (!onChange) return;
    onChange(next === value ? 0 : next);
  };

  return (
    <div
      ref={ref}
      className="bk-stars"
      role={readOnly ? 'img' : 'slider'}
      aria-label={t('Bewertung')}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : 10}
      aria-valuenow={readOnly ? undefined : value}
      aria-valuetext={`${value / 2} / 5`}
      tabIndex={readOnly ? undefined : 0}
      style={{ cursor: readOnly ? 'default' : 'pointer' }}
      onPointerDown={(e) => {
        if (readOnly) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setPreview(valueAt(e.clientX));
      }}
      onPointerMove={(e) => {
        if (readOnly || preview === null) return;
        const next = valueAt(e.clientX);
        if (next !== preview) {
          hapticSelect();
          setPreview(next);
        }
      }}
      onPointerUp={(e) => {
        if (readOnly || preview === null) return;
        commit(valueAt(e.clientX));
      }}
      onPointerCancel={() => setPreview(null)}
      onKeyDown={(e) => {
        if (readOnly) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(10, value + 1));
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(0, value - 1));
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, (shown - i * 2) / 2));
        return (
          <span key={i} className="bk-star" style={{ width: size, height: size }}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={STAR_PATH} fill="rgba(255,255,255,0.12)" />
            </svg>
            <span className="bk-star-fill" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" aria-hidden style={{ width: size, height: size }}>
                <path d={STAR_PATH} fill={color} />
              </svg>
            </span>
          </span>
        );
      })}
    </div>
  );
};
