import { Bat, Cobweb, PeekingSkull, Spider } from './SpookyArt';
import { webPoint, WEB_SIZE } from './cobweb';
import './spooky.css';

const restingSpot = webPoint(5, 5);
const BATS = [0, 1, 2];

export const SpookyLayer = () => (
  <div className="spooky-layer" aria-hidden="true">
    <div className="spooky-moonlight" />
    <div className="spooky-fog">
      <div className="spooky-fog__band spooky-fog__band--back" />
      <div className="spooky-fog__band spooky-fog__band--front" />
    </div>

    <div className="spooky-corner spooky-corner--left">
      <Cobweb seed={3} className="spooky-web" />
      <Spider
        className="spooky-spider spooky-spider--resting"
        style={{
          left: `${(restingSpot.x / WEB_SIZE) * 100}%`,
          top: `${(restingSpot.y / WEB_SIZE) * 100}%`,
        }}
      />
    </div>

    <div className="spooky-corner spooky-corner--right">
      <Cobweb seed={8} className="spooky-web" />
    </div>

    <div className="spooky-dangler">
      <div className="spooky-dangler__bob">
        <span className="spooky-dangler__thread" />
        <Spider className="spooky-spider spooky-spider--hanging" />
      </div>
    </div>

    <div className="spooky-peek">
      <PeekingSkull className="spooky-peek__skull" />
    </div>

    <div className="spooky-bats">
      {BATS.map((i) => (
        <div key={i} className={`spooky-bat spooky-bat--${i}`}>
          <Bat className="spooky-bat__svg" />
        </div>
      ))}
    </div>
  </div>
);
