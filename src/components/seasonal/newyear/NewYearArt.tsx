import './newyear.css';

interface ArtProps {
  className?: string;
  style?: React.CSSProperties;
}

const RAYS = Array.from({ length: 18 }, (_, i) => (i * 360) / 18);

export const FireworkBurst = ({ className, style }: ArtProps) => (
  <svg className={className} style={style} viewBox="-50 -50 100 100" aria-hidden="true">
    <circle r="5" className="ny-burst__flash" />
    {RAYS.map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const inner = i % 2 ? 12 : 9;
      const outer = i % 2 ? 36 : 42;
      return (
        <g key={deg}>
          <line
            x1={Math.cos(rad) * inner}
            y1={Math.sin(rad) * inner}
            x2={Math.cos(rad) * outer}
            y2={Math.sin(rad) * outer}
            className="ny-burst__ray"
          />
          <circle
            cx={Math.cos(rad) * (outer + 4)}
            cy={Math.sin(rad) * (outer + 4) + 2}
            r={i % 2 ? 1.2 : 1.7}
            className="ny-burst__spark"
          />
        </g>
      );
    })}
  </svg>
);

export const Sparkle = ({ className, style }: ArtProps) => (
  <svg className={className} style={style} viewBox="-10 -10 20 20" aria-hidden="true">
    <path d="M0-10C.8-3 3-.8 10 0 3 .8.8 3 0 10-.8 3-3 .8-10 0-3-.8-.8-3 0-10Z" />
  </svg>
);

const SkylineTile = () => (
  <svg viewBox="0 0 360 80" aria-hidden="true">
    <path
      d="M0 80V56h14V44h10v12h8V30h16v26h6V48h12v32ZM68 80V38h8v-8h4v8h8v42ZM88 80V52h18V40h14v40ZM120 80V22h6V10h2v12h6v58ZM134 80V46h20v-8h12v42ZM166 80V34h22v46ZM188 80V54h12V42h16v38ZM216 80V28h10v-6h8v6h10v52ZM244 80V50h14V36h18v44ZM276 80V44h12V30h4v14h12v36ZM304 80V54h16V40h20v40ZM340 80V58h20v22Z"
      className="ny-city"
    />
    <path
      d="M38 34h3v3h-3zM38 42h3v3h-3zM124 30h3v3h-3zM124 40h3v3h-3zM124 50h3v3h-3zM172 40h3v3h-3zM180 48h3v3h-3zM220 34h3v3h-3zM230 44h3v3h-3zM250 56h3v3h-3zM262 42h3v3h-3zM282 50h3v3h-3zM310 60h3v3h-3zM96 58h3v3h-3zM140 52h3v3h-3z"
      className="ny-windows"
    />
  </svg>
);

const SKYLINE_TILES = [0, 1, 2, 3, 4, 5];

export const Skyline = ({ className }: ArtProps) => (
  <div className={`ny-skyline ${className ?? ''}`} aria-hidden="true">
    {SKYLINE_TILES.map((i) => (
      <SkylineTile key={i} />
    ))}
  </div>
);
