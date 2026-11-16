import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fmt, step } from './kitHelpers';
import './wrapped.css';

/**
 * Jede Folie bekommt mit, ob sie gerade zu sehen ist (erst dann laufen Auftritt
 * und Zähler), und die Poster des Jahres für die Kulisse.
 */
export interface SlideProps {
  active?: boolean;
  posters?: (string | undefined)[];
}

/** Schräg laufende Wand aus den eigenen Postern. Ohne genug Poster bleibt sie weg. */
const PosterWall: React.FC<{ posters: (string | undefined)[] }> = ({ posters }) => {
  const rows = useMemo(() => {
    const urls = posters.filter((p): p is string => !!p);
    if (urls.length < 4) return [];
    const filled = Array.from({ length: 12 }, (_, i) => urls[i % urls.length]);
    return [0, 1, 2, 3].map((r) => {
      const row = filled.map((_, i) => filled[(i + r * 3) % filled.length]);
      return [...row, ...row];
    });
  }, [posters]);

  if (rows.length === 0) return null;
  return (
    <div className="w-wall" aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className="w-wall__row">
          {row.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" />
          ))}
        </div>
      ))}
    </div>
  );
};

interface StageProps extends SlideProps {
  /** Ein einzelnes Bild als weichgezeichnete Kulisse; ohne es läuft die Poster-Wand. */
  art?: string;
  /** Zusätzliche Kulisse über der Abdunklung: Mond, Echo-Schrift, Konfetti. */
  backdrop?: React.ReactNode;
  /** Eine Spalte auch im Breitbild. */
  single?: boolean;
  children: React.ReactNode;
}

export const Stage: React.FC<StageProps> = ({
  active = true,
  posters = [],
  art,
  backdrop,
  single,
  children,
}) => (
  <section className={`w-stage${active ? ' is-active' : ''}`}>
    {art ? (
      <img className="w-art" src={art} alt="" aria-hidden />
    ) : (
      <PosterWall posters={posters} />
    )}
    <div className="w-scrim" aria-hidden />
    <div className="w-glow w-glow--a" aria-hidden />
    <div className="w-glow w-glow--b" aria-hidden />
    {backdrop}
    <div className={`w-body${single ? ' w-body--single' : ''}`}>{children}</div>
  </section>
);

const COUNT_MS = 1500;

/** Zählt hoch, sobald die Folie sichtbar wird. Außerhalb davon steht der Endwert. */
export const Count: React.FC<{ value: number; active?: boolean }> = ({ value, active = false }) => {
  const [shown, setShown] = useState(value);
  const frame = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!active || reduced || value === 0) {
      setShown(value);
      return;
    }
    const start = performance.now();
    setShown(0);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_MS);
      setShown(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [active, value]);

  return <>{fmt(shown)}</>;
};

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10);

/**
 * Riesenzahl als Zählwerk: jede Ziffer rollt einzeln auf ihren Wert. Die
 * Schriftgröße richtet sich nach der Stellenzahl, damit die Zahl die Breite füllt.
 * Vorlesen und Tests sehen den fertigen Wert über das Label.
 */
export const Giant: React.FC<{ value: number; suffix?: string; className?: string }> = ({
  value,
  suffix = '',
  className = '',
}) => {
  const text = fmt(value);
  const chars = [...text];
  return (
    <p
      className={`w-giant ${className}`}
      style={{ '--len': Math.max(2, chars.length + suffix.length) } as React.CSSProperties}
      role="img"
      aria-label={`${text}${suffix}`}
    >
      {chars.map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="w-odo__col" aria-hidden>
            <span
              className="w-odo__strip"
              style={{ '--d': Number(ch), '--i': i } as React.CSSProperties}
            >
              {DIGITS.map((d, k) => (
                <span key={k}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} className="w-odo__sep" aria-hidden>
            {ch}
          </span>
        )
      )}
      {suffix && (
        <span className="w-odo__sep" aria-hidden>
          {suffix}
        </span>
      )}
    </p>
  );
};

export const Poster: React.FC<{
  src?: string;
  title: string;
  tilt?: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ src, title, tilt = 0, className = '', style }) => {
  const [broken, setBroken] = useState(false);
  return (
    <span
      className={`w-poster ${className}`}
      style={{ '--tilt': `${tilt}deg`, ...style } as React.CSSProperties}
    >
      {src && !broken ? (
        <img src={src} alt={title} onError={() => setBroken(true)} />
      ) : (
        <span className="w-poster__fallback">{title}</span>
      )}
    </span>
  );
};

export interface RankItem {
  key: string | number;
  title: string;
  image?: string;
  value: string;
}

/** Plätze 2 bis 5 unter dem Helden. */
const RankList: React.FC<{ items: RankItem[]; from?: number }> = ({ items, from = 2 }) => (
  <ol className="w-rank" start={from}>
    {items.map((item, i) => (
      <li key={item.key} className="w-rank__row w-side" style={step(i + 2)}>
        <span className="w-rank__no">{from + i}</span>
        {item.image ? (
          <img className="w-rank__thumb" src={item.image} alt="" loading="lazy" />
        ) : (
          <span className="w-rank__thumb" aria-hidden />
        )}
        <span className="w-rank__name">{item.title}</span>
        <span className="w-rank__val">{item.value}</span>
      </li>
    ))}
  </ol>
);

/** Die Nummer 1 als geworfenes Poster mit Riesenziffer, daneben der Rest der Liste. */
export const TopList: React.FC<{
  active?: boolean;
  kicker: string;
  hero: RankItem & { heroImage?: string };
  rest: RankItem[];
  note?: string;
}> = ({ active, kicker, hero, rest, note }) => (
  <Stage active={active} art={hero.heroImage ?? hero.image}>
    <div className="w-visual">
      <div className="w-hero">
        <Poster
          className="w-throw"
          src={hero.heroImage ?? hero.image}
          title={hero.title}
          tilt={-5}
          style={{ '--from-x': '-70%' } as React.CSSProperties}
        />
        <span className="w-hero__no w-slam" aria-hidden style={step(5)}>
          1
        </span>
      </div>
    </div>
    <div className="w-copy w-stack">
      <p className="w-kicker w-in" style={step(2)}>
        {kicker}
      </p>
      <h2 className="w-title w-title--sm w-slam" style={step(3)}>
        {hero.title}
      </h2>
      <p className="w-line w-pop-b w-in" style={step(4)}>
        {hero.value}
      </p>
      {rest.length > 0 && <RankList items={rest} />}
      {note && (
        <p className="w-note w-in" style={step(7)}>
          {note}
        </p>
      )}
    </div>
  </Stage>
);

/** Leerer Zustand einer Folie: eine Aussage, ein nächster Schritt. */
export const EmptyStage: React.FC<SlideProps & { title: string; hint: string }> = ({
  active,
  posters,
  title,
  hint,
}) => (
  <Stage active={active} posters={posters} single>
    <div className="w-copy w-stack">
      <h2 className="w-title w-slam">{title}</h2>
      <p className="w-line w-in">{hint}</p>
    </div>
  </Stage>
);
