import { FireworkBurst, Sparkle } from './NewYearArt';
import '../seasonal.css';
import './newyear.css';

const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 61) % 100}%`,
  duration: `${9 + ((i * 7) % 6)}s`,
  delay: `${-((i * 3.7) % 14)}s`,
  tone: i % 4,
  wide: i % 3 === 0,
}));

const SPARKLES = [
  { left: '8%', top: '9%', size: 10, delay: '0s' },
  { left: '31%', top: '4%', size: 7, delay: '-1.2s' },
  { left: '58%', top: '11%', size: 9, delay: '-2.1s' },
  { left: '83%', top: '6%', size: 12, delay: '-0.6s' },
  { left: '94%', top: '19%', size: 7, delay: '-1.7s' },
  { left: '18%', top: '23%', size: 6, delay: '-2.6s' },
];

export const Confetti = () => (
  <div className="ny-confetti">
    {CONFETTI.map((piece, i) => (
      <span
        key={i}
        className={`ny-confetti__piece ny-confetti__piece--${piece.tone}${piece.wide ? ' is-wide' : ''}`}
        style={{ left: piece.left, animationDuration: piece.duration, animationDelay: piece.delay }}
      />
    ))}
  </div>
);

export const NewYearLayer = () => (
  <div className="season-layer ny-layer" aria-hidden="true">
    <div className="ny-glow" />
    <div className="ny-bubbles">
      <div className="ny-bubbles__layer" />
    </div>
    {SPARKLES.map((s, i) => (
      <Sparkle
        key={i}
        className="ny-sparkle"
        style={{ left: s.left, top: s.top, width: s.size, animationDelay: s.delay }}
      />
    ))}
    <FireworkBurst className="ny-burst ny-burst--gold ny-burst--a" />
    <FireworkBurst className="ny-burst ny-burst--violet ny-burst--b" />
    <FireworkBurst className="ny-burst ny-burst--rose ny-burst--c" />
    <Confetti />
  </div>
);
