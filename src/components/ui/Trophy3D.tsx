import { motion } from 'framer-motion';

interface Trophy3DProps {
  place: 1 | 2 | 3;
  size?: number;
  autoRotate?: boolean;
  name?: string;
  monthLabel?: string;
}

const PLACE_STYLES: Record<
  number,
  {
    bodyLight: string;
    bodyMid: string;
    bodyDark: string;
    bodyDeep: string;
    highlight: string;
    engrave: string;
    shadow: string;
    glow: string;
  }
> = {
  1: {
    bodyLight: '#FFE87A',
    bodyMid: '#FFD700',
    bodyDark: '#DAA520',
    bodyDeep: '#B8860B',
    highlight: 'rgba(255,255,255,0.5)',
    engrave: '#B8860B',
    shadow: 'rgba(255, 215, 0, 0.4)',
    glow: 'rgba(255, 215, 0, 0.2)',
  },
  2: {
    bodyLight: '#F5F5F5',
    bodyMid: '#D8D8D8',
    bodyDark: '#ABABAB',
    bodyDeep: '#808080',
    highlight: 'rgba(255,255,255,0.55)',
    engrave: '#707070',
    shadow: 'rgba(180, 180, 210, 0.4)',
    glow: 'rgba(200, 200, 230, 0.15)',
  },
  3: {
    bodyLight: '#E8A860',
    bodyMid: '#CD7F32',
    bodyDark: '#A0622E',
    bodyDeep: '#7A4A1E',
    highlight: 'rgba(255,255,255,0.4)',
    engrave: '#6B3A10',
    shadow: 'rgba(205, 127, 50, 0.4)',
    glow: 'rgba(205, 127, 50, 0.15)',
  },
};

export const Trophy3D = ({
  place,
  size = 200,
  autoRotate = true,
  name,
  monthLabel,
}: Trophy3DProps) => {
  const s = PLACE_STYLES[place];
  const scale = size / 200;
  const showText = size >= 120;

  return (
    <motion.div
      animate={autoRotate ? { y: [0, -5, 0] } : undefined}
      transition={autoRotate ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
      style={{
        width: size,
        height: size,
        margin: '0 auto',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          inset: '5%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${s.glow}, transparent 70%)`,
          filter: `blur(${24 * scale}px)`,
          pointerEvents: 'none',
        }}
      />

      <svg
        viewBox="0 0 200 240"
        width={size * 0.9}
        height={size * 0.9 * 1.2}
        style={{
          filter: `drop-shadow(0 ${6 * scale}px ${20 * scale}px ${s.shadow})`,
          position: 'relative',
        }}
      >
        <defs>
          {/* Main body gradient */}
          <linearGradient id={`body-${place}`} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor={s.bodyLight} />
            <stop offset="30%" stopColor={s.bodyMid} />
            <stop offset="60%" stopColor={s.bodyDark} />
            <stop offset="85%" stopColor={s.bodyMid} />
            <stop offset="100%" stopColor={s.bodyLight} />
          </linearGradient>

          {/* Rim / horizontal gradient */}
          <linearGradient id={`rim-${place}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={s.bodyDark} />
            <stop offset="35%" stopColor={s.bodyLight} />
            <stop offset="65%" stopColor={s.bodyMid} />
            <stop offset="100%" stopColor={s.bodyDark} />
          </linearGradient>

          {/* Vertical base gradient */}
          <linearGradient id={`base-${place}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.bodyMid} />
            <stop offset="50%" stopColor={s.bodyDark} />
            <stop offset="100%" stopColor={s.bodyDeep} />
          </linearGradient>

          {/* Stem gradient */}
          <linearGradient id={`stem-${place}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={s.bodyDark} />
            <stop offset="40%" stopColor={s.bodyLight} />
            <stop offset="60%" stopColor={s.bodyMid} />
            <stop offset="100%" stopColor={s.bodyDark} />
          </linearGradient>

          {/* Highlight gradient */}
          <radialGradient id={`hl-${place}`} cx="0.35" cy="0.25" r="0.5">
            <stop offset="0%" stopColor={s.highlight} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Handle gradient */}
          <linearGradient id={`handle-${place}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.bodyLight} />
            <stop offset="50%" stopColor={s.bodyDark} />
            <stop offset="100%" stopColor={s.bodyMid} />
          </linearGradient>

          <filter id={`engrave-${place}`}>
            <feOffset dx="0" dy="0.5" result="off1" />
            <feFlood floodColor={s.bodyLight} floodOpacity="0.5" result="light" />
            <feComposite in="light" in2="off1" operator="in" result="lightComp" />
            <feOffset in="SourceGraphic" dx="0" dy="-0.3" result="off2" />
            <feFlood floodColor={s.bodyDeep} floodOpacity="0.6" result="dark" />
            <feComposite in="dark" in2="off2" operator="in" result="darkComp" />
            <feMerge>
              <feMergeNode in="darkComp" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="lightComp" />
            </feMerge>
          </filter>
        </defs>

        {/* ===== CUP BODY ===== */}
        {/* Classic trophy: wider at top, elegant curve down */}
        <path
          d={`
            M 48,52
            C 44,52 40,58 40,66
            L 44,105
            C 48,118 60,128 78,134
            Q 88,137 100,138
            Q 112,137 122,134
            C 140,128 152,118 156,105
            L 160,66
            C 160,58 156,52 152,52
            Z
          `}
          fill={`url(#body-${place})`}
          stroke={s.bodyDeep}
          strokeWidth="0.6"
        />
        {/* Highlight overlay */}
        <path
          d={`
            M 48,52
            C 44,52 40,58 40,66
            L 44,105
            C 48,118 60,128 78,134
            Q 88,137 100,138
            Q 112,137 122,134
            C 140,128 152,118 156,105
            L 160,66
            C 160,58 156,52 152,52
            Z
          `}
          fill={`url(#hl-${place})`}
        />

        {/* ===== RIM (top ellipse) ===== */}
        <ellipse
          cx="100"
          cy="52"
          rx="54"
          ry="10"
          fill={`url(#rim-${place})`}
          stroke={s.bodyDeep}
          strokeWidth="0.5"
        />
        <ellipse cx="94" cy="50" rx="30" ry="4" fill={s.highlight} opacity="0.5" />

        {/* Inner cup opening */}
        <ellipse cx="100" cy="52" rx="46" ry="6" fill={s.bodyDeep} opacity="0.5" />

        {/* ===== HANDLES ===== */}
        {/* Left handle — elegant curved */}
        <path
          d="M 44,62 C 20,58 10,72 12,92 C 14,112 28,122 46,112"
          fill="none"
          stroke={`url(#handle-${place})`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Left handle highlight */}
        <path
          d="M 44,62 C 22,58 13,72 15,90 C 16,104 26,114 42,108"
          fill="none"
          stroke={s.highlight}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.35"
        />
        {/* Left handle inner curve for elegance */}
        <path
          d="M 44,68 C 28,66 22,76 24,90 C 25,102 34,108 46,104"
          fill="none"
          stroke={s.bodyDeep}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.15"
        />

        {/* Right handle */}
        <path
          d="M 156,62 C 180,58 190,72 188,92 C 186,112 172,122 154,112"
          fill="none"
          stroke={`url(#handle-${place})`}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Right handle shadow */}
        <path
          d="M 156,68 C 172,66 178,76 176,90 C 175,102 166,108 154,104"
          fill="none"
          stroke={s.bodyDeep}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
        />

        {/* ===== DECORATIVE LINE ON CUP ===== */}
        <ellipse
          cx="100"
          cy="76"
          rx="42"
          ry="2.5"
          fill="none"
          stroke={s.bodyLight}
          strokeWidth="0.6"
          opacity="0.35"
        />

        {/* ===== ENGRAVED NAMEPLATE ===== */}
        {showText && name ? (
          <g>
            {/* Dark recessed plate */}
            <rect
              x="62"
              y={monthLabel ? 86 : 90}
              width="76"
              height={monthLabel ? 38 : 26}
              rx="4"
              fill={s.bodyDeep}
              opacity="0.55"
            />
            {/* Plate inner border (bright edge = beveled look) */}
            <rect
              x="63"
              y={monthLabel ? 87 : 91}
              width="74"
              height={monthLabel ? 36 : 24}
              rx="3.5"
              fill="none"
              stroke={s.bodyLight}
              strokeWidth="0.4"
              opacity="0.3"
            />
            {/* Name text */}
            <text
              x="100"
              y={monthLabel ? 101 : 103}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize={
                name.length > 14 ? '10' : name.length > 10 ? '11' : name.length > 7 ? '13' : '15'
              }
              fill={s.bodyLight}
              letterSpacing="0.8"
            >
              {name}
            </text>
            {/* Month label */}
            {monthLabel && (
              <text
                x="100"
                y="117"
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="Georgia, 'Times New Roman', serif"
                fontWeight="400"
                fontSize="8"
                fill={s.bodyMid}
                letterSpacing="0.5"
                opacity="0.9"
              >
                {monthLabel}
              </text>
            )}
          </g>
        ) : (
          /* Star emblem when no name */
          <g transform="translate(100, 95)">
            <polygon
              points="0,-14 3.5,-5 13,-5 5.5,1.5 8,11 0,5 -8,11 -5.5,1.5 -13,-5 -3.5,-5"
              fill={s.bodyLight}
              opacity="0.6"
            />
          </g>
        )}

        <ellipse
          cx="100"
          cy="128"
          rx="30"
          ry="2"
          fill="none"
          stroke={s.bodyLight}
          strokeWidth="0.6"
          opacity="0.25"
        />

        {/* ===== STEM ===== */}
        <path
          d={`
            M 86,138
            L 84,160
            C 83,163 82,164 80,166
            L 120,166
            C 118,164 117,163 116,160
            L 114,138
          `}
          fill={`url(#stem-${place})`}
          stroke={s.bodyDeep}
          strokeWidth="0.4"
        />
        {/* Stem highlight */}
        <rect x="91" y="140" width="5" height="24" rx="2.5" fill={s.highlight} opacity="0.3" />

        {/* ===== KNOB ===== */}
        <ellipse
          cx="100"
          cy="166"
          rx="24"
          ry="5"
          fill={`url(#rim-${place})`}
          stroke={s.bodyDeep}
          strokeWidth="0.4"
        />
        <ellipse cx="96" cy="164.5" rx="12" ry="2" fill={s.highlight} opacity="0.3" />

        {/* ===== BASE ===== */}
        <path
          d={`
            M 58,172
            C 58,169 72,166 100,166
            C 128,166 142,169 142,172
            L 144,184
            C 144,190 128,195 100,195
            C 72,195 56,190 56,184
            Z
          `}
          fill={`url(#base-${place})`}
          stroke={s.bodyDeep}
          strokeWidth="0.5"
        />
        {/* Base top highlight */}
        <ellipse cx="92" cy="174" rx="22" ry="3" fill={s.highlight} opacity="0.25" />
        {/* Base bottom edge */}
        <ellipse cx="100" cy="190" rx="44" ry="5.5" fill={s.bodyDeep} opacity="0.3" />

        {/* ===== NAMEPLATE ON BASE ===== */}
        {showText && name && (
          <>
            <rect x="76" y="176" width="48" height="11" rx="2" fill={s.bodyDeep} opacity="0.25" />
            <text
              x="100"
              y="183"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontWeight="600"
              fontSize="6.5"
              fill={s.bodyLight}
              letterSpacing="0.3"
              opacity="0.8"
            >
              {place === 1 ? '1ST' : place === 2 ? '2ND' : '3RD'}
            </text>
          </>
        )}
      </svg>
    </motion.div>
  );
};

export default Trophy3D;
