import { Bauble, LightString, Sleigh } from './ChristmasArt';
import '../seasonal.css';
import './christmas.css';

const LIGHT_SEGMENTS = Array.from({ length: 18 }, (_, i) => i);

export const Snowfall = ({ className = '' }: { className?: string }) => (
  <div className={`xmas-snow ${className}`}>
    <div className="xmas-snow__sway xmas-snow__sway--far">
      <div className="xmas-snow__layer xmas-snow__layer--far" />
    </div>
    <div className="xmas-snow__sway xmas-snow__sway--mid">
      <div className="xmas-snow__layer xmas-snow__layer--mid" />
    </div>
    <div className="xmas-snow__sway xmas-snow__sway--near">
      <div className="xmas-snow__layer xmas-snow__layer--near" />
    </div>
  </div>
);

export const ChristmasLayer = () => (
  <div className="season-layer xmas-layer" aria-hidden="true">
    <div className="xmas-glow" />
    <Snowfall />

    <div className="xmas-lights">
      {LIGHT_SEGMENTS.map((i) => (
        <LightString key={i} offset={i} className="xmas-lights__segment" />
      ))}
    </div>

    <div className="xmas-ornament xmas-ornament--a">
      <span className="xmas-ornament__ribbon" />
      <Bauble tone="red" className="xmas-ornament__ball" />
    </div>
    <div className="xmas-ornament xmas-ornament--b">
      <span className="xmas-ornament__ribbon" />
      <Bauble tone="gold" className="xmas-ornament__ball" />
    </div>

    <div className="xmas-flight">
      <Sleigh className="xmas-flight__sleigh" />
    </div>
  </div>
);
