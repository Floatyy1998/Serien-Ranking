import { useId } from 'react';
import './valentine.css';

interface ArtProps {
  className?: string;
  style?: React.CSSProperties;
}

const HEART_PATH =
  'M50 88C20 66 4 47 4 28 4 13 15 4 28 4c9 0 17 5 22 13C55 9 63 4 72 4c13 0 24 9 24 24 0 19-16 38-46 60Z';

export const GlossyHeart = ({
  className,
  style,
  tone = 'rose',
  gloss = true,
}: ArtProps & { tone?: 'rose' | 'blush'; gloss?: boolean }) => {
  const id = useId().replace(/:/g, '');
  const stops =
    tone === 'rose' ? ['#ff9dbb', '#ff3d6e', '#9e0f3c'] : ['#ffe3ec', '#ffa8c2', '#d25a82'];
  return (
    <svg className={className} style={style} viewBox="0 0 100 92" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}h`} cx="34%" cy="28%" r="80%">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </radialGradient>
      </defs>
      <path d={HEART_PATH} fill={`url(#${id}h)`} />
      {gloss && (
        <>
          <ellipse
            cx="29"
            cy="24"
            rx="12"
            ry="6.5"
            fill="#fff"
            opacity="0.5"
            transform="rotate(-32 29 24)"
          />
          <circle cx="21" cy="34" r="2.6" fill="#fff" opacity="0.7" />
        </>
      )}
    </svg>
  );
};

export const Petal = ({ className, style }: ArtProps) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} style={style} viewBox="0 0 24 28" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8fae" />
          <stop offset="1" stopColor="#c4163f" />
        </linearGradient>
      </defs>
      <path d="M12 1C19 5 23 14 19 21c-3 5-11 6-15 1C0 17 3 6 12 1Z" fill={`url(#${id}p)`} />
      <path
        d="M12 4c-1 6 0 13 3 19"
        fill="none"
        stroke="#7d0a2a"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
    </svg>
  );
};

export const CupidArrow = ({ className, style }: ArtProps) => (
  <svg className={className} style={style} viewBox="0 0 200 30" aria-hidden="true">
    <path d="M18 15H180" className="vt-arrow-shaft" />
    <path d="M196 15l-18-8 4 8-4 8Z" className="vt-arrow-head" />
    <path d="M30 15L14 4H4l12 11L4 26h10Z" className="vt-arrow-fletch" />
    <path d="M44 15L30 6h-8l11 9-11 9h8Z" className="vt-arrow-fletch vt-arrow-fletch--back" />
  </svg>
);

const GARLAND_HEARTS = [
  { x: 22, y: 11, s: 0.13, len: 3 },
  { x: 60, y: 15, s: 0.16, len: 6 },
  { x: 98, y: 11, s: 0.13, len: 3 },
];

export const HeartGarland = ({ className, offset = 0 }: ArtProps & { offset?: number }) => (
  <svg className={className} viewBox="0 0 120 56" aria-hidden="true" overflow="visible">
    <path d="M0 2Q30 18 60 15T120 2" className="vt-garland-thread" />
    {GARLAND_HEARTS.map((h, i) => (
      <g key={i} transform={`translate(${h.x} ${h.y})`}>
        <g className={`vt-garland-heart vt-garland-heart--${(i + offset) % 3}`}>
          <path d={`M0 0v${h.len}`} className="vt-garland-string" />
          <path
            d={HEART_PATH}
            transform={`translate(${-50 * h.s} ${h.len}) scale(${h.s})`}
            className={(i + offset) % 2 ? 'vt-garland-fill--blush' : 'vt-garland-fill--rose'}
          />
        </g>
      </g>
    ))}
  </svg>
);
