import { CupidArrow, GlossyHeart, HeartGarland, Petal } from './ValentineArt';
import '../seasonal.css';
import './valentine.css';

const GARLAND_SEGMENTS = Array.from({ length: 18 }, (_, i) => i);

const RISING = Array.from({ length: 9 }, (_, i) => ({
  left: `${(i * 37 + 6) % 96}%`,
  size: 10 + ((i * 7) % 4) * 4,
  duration: `${14 + ((i * 5) % 7)}s`,
  delay: `${-((i * 4.3) % 18)}s`,
  tone: i % 3 === 0 ? ('blush' as const) : ('rose' as const),
}));

const PETALS = Array.from({ length: 9 }, (_, i) => ({
  left: `${(i * 53 + 11) % 98}%`,
  duration: `${11 + ((i * 3) % 6)}s`,
  delay: `${-((i * 3.1) % 15)}s`,
}));

export const RisingHearts = () => (
  <div className="vt-rising">
    {RISING.map((h, i) => (
      <div
        key={i}
        className="vt-rising__heart"
        style={{
          left: h.left,
          width: h.size,
          animationDuration: h.duration,
          animationDelay: h.delay,
        }}
      >
        <GlossyHeart tone={h.tone} className="vt-rising__svg" />
      </div>
    ))}
  </div>
);

export const FallingPetals = () => (
  <div className="vt-petals">
    {PETALS.map((p, i) => (
      <div
        key={i}
        className="vt-petals__piece"
        style={{ left: p.left, animationDuration: p.duration, animationDelay: p.delay }}
      >
        <Petal className="vt-petals__svg" />
      </div>
    ))}
  </div>
);

export const ValentineLayer = () => (
  <div className="season-layer vt-layer" aria-hidden="true">
    <div className="vt-glow" />
    <div className="vt-bokeh">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
    <RisingHearts />
    <FallingPetals />
    <div className="vt-garland">
      {GARLAND_SEGMENTS.map((i) => (
        <HeartGarland key={i} offset={i} className="vt-garland__segment" />
      ))}
    </div>
    <div className="vt-cupid">
      <CupidArrow className="vt-cupid__arrow" />
    </div>
  </div>
);
