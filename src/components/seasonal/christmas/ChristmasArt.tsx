import { useId } from 'react';
import './christmas.css';

interface ArtProps {
  className?: string;
  style?: React.CSSProperties;
}

const BULB_COLORS = ['#ffcf5a', '#e0464f', '#5fd38a', '#fff3d6'];
const BULBS = [
  { x: 14, y: 13 },
  { x: 42, y: 22 },
  { x: 72, y: 22 },
  { x: 102, y: 13 },
];

export const LightString = ({ className, offset = 0 }: ArtProps & { offset?: number }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 120 44" aria-hidden="true" overflow="visible">
      <defs>
        {BULB_COLORS.map((color, i) => (
          <radialGradient key={color} id={`${id}g${i}`}>
            <stop offset="0" stopColor={color} stopOpacity="0.75" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      <path d="M0 2Q30 30 60 20T120 2" className="xmas-wire" />
      {BULBS.map((bulb, i) => {
        const colorIndex = (i + offset) % BULB_COLORS.length;
        const color = BULB_COLORS[colorIndex];
        return (
          <g
            key={i}
            className={`xmas-bulb xmas-bulb--${(i + offset) % 3}`}
            transform={`translate(${bulb.x} ${bulb.y}) rotate(${i % 2 ? 8 : -8})`}
          >
            <circle
              cx="0"
              cy="11"
              r="13"
              fill={`url(#${id}g${colorIndex})`}
              className="xmas-halo"
            />
            <rect x="-2.6" y="-1" width="5.2" height="5" rx="1.2" className="xmas-cap" />
            <path
              d="M0 3.5c3.6 0 5 4 5 7.6 0 3.6-2.4 6.4-5 6.4s-5-2.8-5-6.4C-5 7.5-3.6 3.5 0 3.5Z"
              fill={color}
            />
            <ellipse cx="-1.6" cy="8" rx="1.2" ry="2.4" fill="#fff" opacity="0.55" />
          </g>
        );
      })}
    </svg>
  );
};

export const Bauble = ({
  className,
  style,
  tone = 'red',
}: ArtProps & { tone?: 'red' | 'gold' }) => {
  const id = useId().replace(/:/g, '');
  const stops =
    tone === 'red' ? ['#ff8a8f', '#d22b36', '#6d0a14'] : ['#fff1bf', '#e2ad3c', '#7a5212'];
  return (
    <svg className={className} style={style} viewBox="0 0 60 74" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}b`} cx="36%" cy="34%" r="70%">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.5" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </radialGradient>
        <linearGradient id={`${id}c`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a2a" />
          <stop offset="0.5" stopColor="#f6dc8e" />
          <stop offset="1" stopColor="#8a6a2a" />
        </linearGradient>
      </defs>
      <path d="M30 1v5" className="xmas-ribbon-loop" />
      <rect x="23" y="6" width="14" height="8" rx="1.6" fill={`url(#${id}c)`} />
      <circle cx="30" cy="42" r="27" fill={`url(#${id}b)`} />
      <path
        d="M4.6 38c8 4 42.8 4 50.8 0M5.4 48c8 4 41.2 4 49.2 0"
        fill="none"
        stroke={tone === 'red' ? '#f6d48a' : '#fff6da'}
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <ellipse
        cx="20"
        cy="30"
        rx="6"
        ry="9"
        fill="#fff"
        opacity="0.32"
        transform="rotate(-28 20 30)"
      />
      <circle cx="17" cy="25" r="2" fill="#fff" opacity="0.8" />
    </svg>
  );
};

export const Sleigh = ({ className, style }: ArtProps) => (
  <svg className={className} style={style} viewBox="0 0 236 60" aria-hidden="true">
    <g className="xmas-sleigh-body" transform="translate(14 0)">
      <path d="M118 30c2 10 10 16 26 16h46c8 0 14-4 16-12l3-14h-8l-3 10h-24l-2-12h-50Z" />
      <path d="M112 52h92c6 0 10-3 12-8l3 1c-2 7-8 11-15 11h-92Z" />
      <path d="M150 46v6M190 46v6" className="xmas-stroke" />
      <path d="M170 14c0-6 4-10 9-10s9 4 9 10v6h-18Z" />
      <path d="M174 6c2-6 8-7 14-2l4 6-6-2Z" />
      <circle cx="194" cy="11" r="2" className="xmas-pompom" />
      <path d="M154 20l6-10h10l-4 10Z" />
    </g>
    {[0, 1].map((i) => (
      <g
        key={i}
        transform={`translate(${86 + i * 52} ${i ? 3 : 0}) scale(-1 1)`}
        className="xmas-deer"
      >
        <path d="M24 28c0-6 6-9 14-9h20c6 0 10 3 10 8s-4 8-10 8H36c-8 0-12-2-12-7Z" />
        <path d="M60 22l8-10c2-3 6-3 8-1l2 2-6 3-6 8Z" />
        <path d="M74 10l2-8M76 6l5-3M72 9l-4-7M70 5l-4 0" className="xmas-stroke" />
        <path d="M34 34l-6 12M40 34l2 13M54 34l6 11M60 33l10 8" className="xmas-stroke xmas-legs" />
        <path d="M24 26l-4-3" className="xmas-stroke" />
        {i === 0 && <circle cx="79" cy="12" r="2.4" className="xmas-nose" />}
      </g>
    ))}
    <path d="M62 27Q72 31 82 27M114 27Q124 32 132 30" className="xmas-stroke xmas-rein" />
  </svg>
);

export const PineTree = ({ className, style, star }: ArtProps & { star?: boolean }) => (
  <svg className={className} style={style} viewBox="0 0 60 90" aria-hidden="true">
    <path d="M30 6L8 40h10L4 62h12L0 84h60L44 62h12L42 40h10Z" className="xmas-pine" />
    <path d="M14 84q16-6 32-2M10 62q18-5 38-1M18 40q12-4 24 0" className="xmas-pine-snow" />
    <rect x="26" y="84" width="8" height="6" className="xmas-trunk" />
    {star && (
      <path
        d="M30 0l2.4 5 5.4.6-4 3.6 1.2 5.4L30 12l-5 2.6 1.2-5.4-4-3.6 5.4-.6Z"
        className="xmas-star"
      />
    )}
  </svg>
);
