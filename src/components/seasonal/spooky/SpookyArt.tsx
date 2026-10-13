import { useId, useMemo } from 'react';
import { useReducedMotion } from '../../../hooks/ui/useReducedMotion';
import { buildCobweb, WEB_SIZE } from './cobweb';
import './spooky.css';

interface ArtProps {
  className?: string;
  style?: React.CSSProperties;
}

const LEGS: [number, number, number, number, number, number][] = [
  [-3.5, -10, -12, -21, -17, -30],
  [-5, -8, -16, -14, -26, -17],
  [-5.5, -5.5, -16.5, -3, -27, 2],
  [-4.5, -3, -13, 7, -19, 22],
];

const legPaths = (side: 1 | -1) =>
  LEGS.map(([bx, by, kx, ky, fx, fy]) => ({
    femur: `M${bx * side} ${by}Q${(kx - 2) * side} ${ky - 3} ${kx * side} ${ky}`,
    tibia: `M${kx * side} ${ky}Q${((kx + fx) / 2 - 1) * side} ${(ky + fy) / 2 - 2} ${fx * side} ${fy}`,
  }));

const LEFT_LEGS = legPaths(1);
const RIGHT_LEGS = legPaths(-1);

const SPIDER_VIEWBOX = '-32 -34 64 64';

const spiderLegs = (legs: typeof LEFT_LEGS) =>
  legs.map((leg) => (
    <g key={leg.femur}>
      <path d={leg.femur} className="spk-femur" />
      <path d={leg.tibia} className="spk-tibia" />
    </g>
  ));

/** `layered`: Beine als eigene Elemente — das Zucken läuft dann auf der Grafikkarte (Dauer-Deko). */
export const Spider = ({ className, style, layered }: ArtProps & { layered?: boolean }) => {
  const id = useId().replace(/:/g, '');
  const body = (
    <>
      <defs>
        <radialGradient id={`${id}a`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#3b2f44" />
          <stop offset="0.55" stopColor="#140e19" />
          <stop offset="1" stopColor="#050307" />
        </radialGradient>
        <radialGradient id={`${id}c`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#2e2436" />
          <stop offset="1" stopColor="#07050a" />
        </radialGradient>
      </defs>
      <path d="M-1.6 -12.2q-1.4 -2.6 -0.4 -4.4M1.6 -12.2q1.4 -2.6 0.4 -4.4" className="spk-palp" />
      <ellipse cx="0" cy="8" rx="9.5" ry="11.5" fill={`url(#${id}a)`} />
      <path
        d="M0 1.5L-2.6 5.6L0 7.4L2.6 5.6ZM0 9.6L-2.2 13.4L0 15.6L2.2 13.4Z"
        className="spk-mark"
      />
      <ellipse cx="-3.4" cy="3" rx="2.6" ry="4.6" className="spk-sheen" />
      <ellipse cx="0" cy="-7" rx="6" ry="5.6" fill={`url(#${id}c)`} />
      <circle cx="-1.9" cy="-10.3" r="1.15" className="spk-eye" />
      <circle cx="1.9" cy="-10.3" r="1.15" className="spk-eye" />
      <circle cx="-3.7" cy="-8.8" r="0.7" className="spk-eye spk-eye--small" />
      <circle cx="3.7" cy="-8.8" r="0.7" className="spk-eye spk-eye--small" />
    </>
  );
  if (layered) {
    return (
      <span className={`${className ?? ''} spk-layered`} style={style} aria-hidden="true">
        <svg className="spk-legs spk-legs--l" viewBox={SPIDER_VIEWBOX}>
          {spiderLegs(LEFT_LEGS)}
        </svg>
        <svg className="spk-legs spk-legs--r" viewBox={SPIDER_VIEWBOX}>
          {spiderLegs(RIGHT_LEGS)}
        </svg>
        <svg viewBox={SPIDER_VIEWBOX}>{body}</svg>
      </span>
    );
  }
  return (
    <svg className={className} style={style} viewBox={SPIDER_VIEWBOX} aria-hidden="true">
      <g className="spk-legs spk-legs--l">{spiderLegs(LEFT_LEGS)}</g>
      <g className="spk-legs spk-legs--r">{spiderLegs(RIGHT_LEGS)}</g>
      {body}
    </svg>
  );
};

/** `layered`: Lichtschimmer und Tautropfen als eigene Elemente — laufen auf der Grafikkarte statt das ganze Netz pro Frame neu zu zeichnen. */
export const Cobweb = ({
  className,
  style,
  seed,
  layered,
}: ArtProps & { seed: number; layered?: boolean }) => {
  const id = useId().replace(/:/g, '');
  const web = useMemo(() => buildCobweb(seed), [seed]);
  const reduceMotion = useReducedMotion();
  const sweep = `-90;-90;${WEB_SIZE + 60}`;
  const viewBox = `0 0 ${WEB_SIZE} ${WEB_SIZE}`;
  const pct = (value: number) => `${(value / WEB_SIZE) * 100}%`;
  if (layered) {
    return (
      <span className={`${className ?? ''} web-layered`} style={style} aria-hidden="true">
        <svg viewBox={viewBox} overflow="visible">
          <defs>
            <radialGradient id={`${id}w`} cx="0" cy="0" r={WEB_SIZE} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f4ecdf" stopOpacity="0.62" />
              <stop offset="0.55" stopColor="#e9dfcf" stopOpacity="0.34" />
              <stop offset="1" stopColor="#e9dfcf" stopOpacity="0.04" />
            </radialGradient>
          </defs>
          <g fill="none" stroke={`url(#${id}w)`} strokeLinecap="round">
            <path d={web.spokes} strokeWidth="1.05" />
            <path d={web.rings} strokeWidth="0.75" />
            <path d={web.strands} strokeWidth="0.6" />
          </g>
        </svg>
        <span
          className="web-glint"
          style={{ '--glint-dur': `${9 + (seed % 4)}s` } as React.CSSProperties}
        >
          <svg className="web-glint__web" viewBox={viewBox} overflow="visible">
            <g fill="none" stroke="#fff8ec" strokeOpacity="0.95" strokeLinecap="round">
              <path d={web.rings} strokeWidth="1.1" />
              <path d={web.spokes} strokeWidth="1.3" />
            </g>
          </svg>
        </span>
        {web.drops.map((drop, i) => (
          <svg
            key={i}
            className="spk-dew web-dew"
            viewBox={`${-drop.r} ${-drop.r} ${drop.r * 2} ${drop.r * 2}`}
            style={{
              left: pct(drop.x - drop.r),
              top: pct(drop.y - drop.r),
              width: pct(drop.r * 2),
              height: pct(drop.r * 2),
              animationDelay: `${i * -1.7}s`,
            }}
          >
            <circle r={drop.r} />
          </svg>
        ))}
      </span>
    );
  }
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${WEB_SIZE} ${WEB_SIZE}`}
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        <radialGradient id={`${id}w`} cx="0" cy="0" r={WEB_SIZE} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f4ecdf" stopOpacity="0.62" />
          <stop offset="0.55" stopColor="#e9dfcf" stopOpacity="0.34" />
          <stop offset="1" stopColor="#e9dfcf" stopOpacity="0.04" />
        </radialGradient>
        <radialGradient id={`${id}g`} cx="-90" cy="-90" r="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff8ec" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff8ec" stopOpacity="0" />
          {!reduceMotion && (
            <>
              <animate
                attributeName="cx"
                values={sweep}
                keyTimes="0;0.45;1"
                dur={`${9 + (seed % 4)}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={sweep}
                keyTimes="0;0.45;1"
                dur={`${9 + (seed % 4)}s`}
                repeatCount="indefinite"
              />
            </>
          )}
        </radialGradient>
      </defs>
      <g fill="none" stroke={`url(#${id}w)`} strokeLinecap="round">
        <path d={web.spokes} strokeWidth="1.05" />
        <path d={web.rings} strokeWidth="0.75" />
        <path d={web.strands} strokeWidth="0.6" />
      </g>
      <g fill="none" stroke={`url(#${id}g)`} strokeLinecap="round">
        <path d={web.rings} strokeWidth="1.1" />
        <path d={web.spokes} strokeWidth="1.3" />
      </g>
      {web.drops.map((drop, i) => (
        <circle
          key={i}
          cx={drop.x}
          cy={drop.y}
          r={drop.r}
          className="spk-dew"
          style={{ animationDelay: `${i * -1.7}s` }}
        />
      ))}
    </svg>
  );
};

const FINGERS = [0, 1, 2, 3];

/** `layered`: Augen-Glut als eigenes Element — pulsiert auf der Grafikkarte; darüber liegt im Bild nichts. */
export const PeekingSkull = ({ className, style, layered }: ArtProps & { layered?: boolean }) => {
  const id = useId().replace(/:/g, '');
  const glowGradient = (
    <radialGradient id={`${id}e`} cx="50%" cy="50%" r="50%">
      <stop offset="0" stopColor="#ffb36b" />
      <stop offset="0.45" stopColor="#ff6a1a" />
      <stop offset="1" stopColor="#ff6a1a" stopOpacity="0" />
    </radialGradient>
  );
  const glowCircles = (className?: string) => (
    <>
      <circle cx="32" cy="49" r="7" fill={`url(#${id}e)`} className={className} />
      <circle cx="68" cy="49" r="7" fill={`url(#${id}e)`} className={className} />
    </>
  );
  const glowsInline = layered ? null : glowCircles('skl-glow');
  const skull = (
    <>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#f6efe2" />
          <stop offset="0.6" stopColor="#d9ccb6" />
          <stop offset="1" stopColor="#a8987f" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="62%" cy="38%" r="70%">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#2a1d14" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <g transform="translate(14 46)">
        <path
          d="M50 4C25 4 9 21 9 44c0 14 6 24 14 30v13c0 5 4 8 9 8h36c5 0 9-3 9-8V74c8-6 14-16 14-30C91 21 75 4 50 4Z"
          fill={`url(#${id}b)`}
        />
        <path
          d="M50 4C25 4 9 21 9 44c0 14 6 24 14 30v13c0 5 4 8 9 8h36c5 0 9-3 9-8V74c8-6 14-16 14-30C91 21 75 4 50 4Z"
          fill={`url(#${id}s)`}
        />
        <path d="M66 9l-4 9 5 5-4 8M63 18l6 2" className="skl-crack" />
        <path
          d="M21 47c0-10 9-15 17-12 6 2 8 11 5 18-3 6-12 9-18 5-3-2-4-6-4-11ZM79 47c0-10-9-15-17-12-6 2-8 11-5 18 3 6 12 9 18 5 3-2 4-6 4-11Z"
          className="skl-socket"
        />
        {glowsInline}
        <path d="M50 58l-5.5 12.5c2-1 4-1.3 5.5 0 1.5-1.3 3.5-1 5.5 0Z" className="skl-socket" />
        <path d="M31 80h38" className="skl-line" />
        <path
          d="M36 77v14M42 78v15M48 78v15M54 78v15M60 77v15M66 77v12"
          className="skl-line skl-line--thin"
        />
        <path d="M23 70c4 2 7 6 8 10M77 70c-4 2-7 6-8 10" className="skl-line skl-line--thin" />
      </g>
      <g transform="translate(0 6) rotate(-6 40 30)">
        {FINGERS.map((i) => (
          <g key={i} transform={`translate(0 ${i * 9.5})`}>
            <rect x="-6" y="0" width="30" height="7.4" rx="3.7" fill={`url(#${id}b)`} />
            <rect
              x="26"
              y="0.4"
              width={i === 0 ? 15 : 19}
              height="6.6"
              rx="3.3"
              fill={`url(#${id}b)`}
            />
            <path
              d={`M${i === 0 ? 43 : 47} 1.2q7 0.6 8 6.4l-1.6 1.2q-3-3.6-6.4-3.4Z`}
              fill={`url(#${id}b)`}
            />
            <circle cx="25" cy="3.7" r="2.4" className="skl-knuckle" />
            <circle cx={i === 0 ? 42 : 46} cy="3.7" r="1.9" className="skl-knuckle" />
          </g>
        ))}
      </g>
    </>
  );
  if (layered) {
    return (
      <span className={`${className ?? ''} skl-layered`} style={style} aria-hidden="true">
        <svg viewBox="0 0 120 150">{skull}</svg>
        <svg className="skl-glow" viewBox="0 0 120 150">
          <defs>{glowGradient}</defs>
          <g transform="translate(14 46)">{glowCircles()}</g>
        </svg>
      </span>
    );
  }
  return (
    <svg className={className} style={style} viewBox="0 0 120 150" aria-hidden="true">
      <defs>{glowGradient}</defs>
      {skull}
    </svg>
  );
};

const BAT_WINGS = (
  <>
    <path d="M29 15C25 10 19 7 11 7c2 3 2 6 0 8-3-2-7-2-11 1 5 1 7 4 7 7 3-3 8-3 11 0 2-3 6-4 9-2Z" />
    <path d="M35 15c4-5 10-8 18-8-2 3-2 6 0 8 3-2 7-2 11 1-5 1-7 4-7 7-3-3-8-3-11 0-2-3-6-4-9-2Z" />
  </>
);

const BAT_BODY = (
  <>
    <path d="M32 10.5c-2.2 0-3.4 2-3.4 4.6 0 4.3 1.6 8.4 3.4 9.4 1.8-1 3.4-5.1 3.4-9.4 0-2.6-1.2-4.6-3.4-4.6ZM29.6 11.4l-0.9-4 2.4 2.9ZM34.4 11.4l0.9-4-2.4 2.9Z" />
    <circle cx="30.8" cy="13.6" r="0.55" className="bat-eye" />
    <circle cx="33.2" cy="13.6" r="0.55" className="bat-eye" />
  </>
);

/** `layered`: Flügel als eigenes Element — so schlägt die Grafikkarte sie statt des Hauptthreads (Dauer-Deko). */
export const Bat = ({ className, style, layered }: ArtProps & { layered?: boolean }) =>
  layered ? (
    <span className={`${className ?? ''} bat-layered`} style={style} aria-hidden="true">
      <svg className="bat-wings" viewBox="0 0 64 32">
        {BAT_WINGS}
      </svg>
      <svg viewBox="0 0 64 32">{BAT_BODY}</svg>
    </span>
  ) : (
    <svg className={className} style={style} viewBox="0 0 64 32" aria-hidden="true">
      <g className="bat-wings">{BAT_WINGS}</g>
      {BAT_BODY}
    </svg>
  );

export const Pumpkin = ({ className, style }: ArtProps) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} style={style} viewBox="0 0 60 52" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}p`} cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#ffa24a" />
          <stop offset="0.6" stopColor="#e8601a" />
          <stop offset="1" stopColor="#8c3108" />
        </radialGradient>
        <radialGradient id={`${id}f`} cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset="1" stopColor="#ffb02e" />
        </radialGradient>
      </defs>
      <path d="M28.5 13c0-5 2-9 6.5-10.5l2.2 2.4c-3.4 1.4-4.6 4.4-4.4 8.6Z" fill="#4b3a1c" />
      <ellipse cx="17" cy="31" rx="14" ry="18" fill={`url(#${id}p)`} />
      <ellipse cx="43" cy="31" rx="14" ry="18" fill={`url(#${id}p)`} />
      <ellipse cx="30" cy="31" rx="13" ry="19.5" fill={`url(#${id}p)`} />
      <path
        d="M23 14c-4 5-5 26 0 35M37 14c4 5 5 26 0 35"
        fill="none"
        stroke="#7a2a06"
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <g fill={`url(#${id}f)`} className="pumpkin-face">
        <path d="M15 27l6.5-7 4 8Z" />
        <path d="M45 27l-6.5-7-4 8Z" />
        <path d="M30 29.5l-3 4.5h6Z" />
        <path d="M13 36c7 9 27 9 34 0l-3.5 1.2-2.6-2.4-2.8 3-3.4-2.6-2.7 3-2.7-3-3.4 2.6-2.8-3-2.6 2.4Z" />
      </g>
    </svg>
  );
};

const HAND_FINGERS = [
  { x: 24, a: -16, len: [15, 10, 8] },
  { x: 31, a: -5, len: [17, 11, 8] },
  { x: 38, a: 5, len: [16, 11, 8] },
  { x: 45, a: 15, len: [13, 9, 7] },
];

export const SkeletonHand = ({ className, style }: ArtProps) => {
  const id = useId().replace(/:/g, '');
  const bone = `url(#${id}h)`;
  return (
    <svg className={className} style={style} viewBox="0 0 70 130" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bfb19a" />
          <stop offset="0.45" stopColor="#f4ecdd" />
          <stop offset="1" stopColor="#a89880" />
        </linearGradient>
      </defs>
      <rect x="27" y="84" width="7" height="46" rx="3.5" fill={bone} />
      <rect x="36" y="84" width="6" height="46" rx="3" fill={bone} />
      <circle cx="30" cy="80" r="5" fill={bone} />
      <circle cx="39" cy="80" r="4.6" fill={bone} />
      <circle cx="34" cy="73" r="4.4" fill={bone} />
      <circle cx="25" cy="73" r="3.8" fill={bone} />
      <circle cx="43" cy="73" r="3.8" fill={bone} />
      {HAND_FINGERS.map((finger) => (
        <g key={finger.x} transform={`translate(${finger.x} 70) rotate(${finger.a})`}>
          <rect x="-2.6" y="-20" width="5.2" height="20" rx="2.6" fill={bone} />
          {finger.len.map((len, i) => {
            const y = -20 - finger.len.slice(0, i + 1).reduce((sum, l) => sum + l + 1.6, 0);
            const w = 4.8 - i * 0.6;
            return (
              <g key={i}>
                <rect x={-w / 2} y={y} width={w} height={len} rx={w / 2} fill={bone} />
                <circle cx="0" cy={y + len + 0.8} r={w / 2 + 0.4} className="skl-knuckle" />
              </g>
            );
          })}
        </g>
      ))}
      <g transform="translate(20 76) rotate(-48)">
        <rect x="-2.6" y="-14" width="5.2" height="14" rx="2.6" fill={bone} />
        <rect x="-2.3" y="-26" width="4.6" height="10.4" rx="2.3" fill={bone} />
        <rect x="-2" y="-35" width="4" height="7.6" rx="2" fill={bone} />
      </g>
    </svg>
  );
};

export const Graveyard = ({ className }: ArtProps) => (
  <div className={`graveyard ${className ?? ''}`} aria-hidden="true">
    <svg className="graveyard__hills" viewBox="0 0 360 90" preserveAspectRatio="none">
      <path d="M0 52Q50 36 110 46T230 42T360 48V90H0Z" className="graveyard__far" />
      <path d="M0 70Q70 58 150 66T300 62T360 66V90H0Z" />
    </svg>
    <svg className="graveyard__tree" viewBox="20 8 46 60">
      <path d="M42 66V30M42 30l-9-10M42 38l11-12M42 26l-3-9M42 46l-13-6M53 26l6-3M33 20l-5 1" />
    </svg>
    <svg className="graveyard__stones" viewBox="148 44 42 30">
      <path d="M150 74V55a8 8 0 0 1 16 0v19ZM174 74V61a6 6 0 0 1 12 0v13Z" />
    </svg>
    <svg className="graveyard__cross" viewBox="290 34 24 40">
      <path d="M300 74V48h-6v-5h6v-6h5v6h6v5h-6v26Z" />
    </svg>
  </div>
);
