import { t } from '../../services/i18n';
import type { SeasonId } from '../../theme/seasonalThemes';
import { Bat, Cobweb, Graveyard, PeekingSkull, SkeletonHand, Spider } from './spooky/SpookyArt';
import { LightString, PineTree, Sleigh } from './christmas/ChristmasArt';
import { Snowfall } from './christmas/ChristmasLayer';
import { FireworkBurst, Skyline, Sparkle } from './newyear/NewYearArt';
import { Confetti } from './newyear/NewYearLayer';
import { GlossyHeart, HeartGarland } from './valentine/ValentineArt';
import { FallingPetals, RisingHearts } from './valentine/ValentineLayer';
import './seasonalSplash.css';

const BAT_BURST = [
  { tx: '-42vw', ty: '-34vh', r: '-18deg', s: 1.2, d: '0.15s' },
  { tx: '38vw', ty: '-30vh', r: '14deg', s: 1, d: '0.25s' },
  { tx: '-36vw', ty: '-8vh', r: '-6deg', s: 0.8, d: '0.4s' },
  { tx: '44vw', ty: '-12vh', r: '10deg', s: 1.1, d: '0.32s' },
  { tx: '-12vw', ty: '-42vh', r: '-4deg', s: 0.7, d: '0.5s' },
  { tx: '18vw', ty: '-44vh', r: '8deg', s: 0.9, d: '0.2s' },
  { tx: '30vw', ty: '-46vh', r: '16deg', s: 0.6, d: '0.6s' },
];

const EYES = [
  { left: '9%', top: '64%', delay: '0.6s', scale: '1' },
  { left: '12%', top: '80%', delay: '1.4s', scale: '0.8' },
  { left: '24%', top: '36%', delay: '2.1s', scale: '0.6' },
];

const SpookySplash = () => (
  <div className="season-splash spooky-splash" aria-hidden="true">
    <div className="spooky-splash__moon" />
    <div className="spooky-splash__vignette" />
    <div className="spooky-splash__lightning" />
    {EYES.map((eye, i) => (
      <span
        key={i}
        className="spooky-splash__eyes"
        style={{ left: eye.left, top: eye.top, animationDelay: eye.delay, scale: eye.scale }}
      >
        <i />
        <i />
      </span>
    ))}
    <Cobweb seed={3} className="spooky-splash__web spooky-splash__web--l" />
    <Cobweb seed={8} className="spooky-splash__web spooky-splash__web--r" />
    <div className="spooky-splash__drop">
      <span className="spooky-splash__thread" />
      <Spider className="spooky-splash__spider" />
    </div>
    {BAT_BURST.map((bat, i) => (
      <div
        key={i}
        className="spooky-splash__bat"
        style={
          {
            '--tx': bat.tx,
            '--ty': bat.ty,
            '--r': bat.r,
            '--s': bat.s,
            animationDelay: bat.d,
          } as React.CSSProperties
        }
      >
        <Bat className="spooky-bat__svg" />
      </div>
    ))}
    <div className="spooky-fog">
      <div className="spooky-fog__band spooky-fog__band--back" />
      <div className="spooky-fog__band spooky-fog__band--front" />
    </div>
    <SkeletonHand className="spooky-splash__hand" />
    <Graveyard className="spooky-splash__graves" />
    <PeekingSkull className="spooky-splash__skull" />
  </div>
);

const ChristmasSplash = () => (
  <div className="season-splash xmas-splash" aria-hidden="true">
    <div className="xmas-splash__glow" />
    <Snowfall />
    <div className="xmas-splash__lights">
      {Array.from({ length: 12 }, (_, i) => (
        <LightString key={i} offset={i} />
      ))}
    </div>
    <Sleigh className="xmas-splash__sleigh" />
    <svg className="xmas-splash__hills" viewBox="0 0 360 70" preserveAspectRatio="none">
      <path d="M0 30Q60 10 130 24T260 18T360 26V70H0Z" fill="#c9d6dc" />
      <path d="M0 46Q80 26 170 40T360 36V70H0Z" fill="#eef3f5" />
    </svg>
    <PineTree star className="xmas-splash__tree xmas-splash__tree--a" />
    <PineTree className="xmas-splash__tree xmas-splash__tree--b" />
    <PineTree className="xmas-splash__tree xmas-splash__tree--c" />
    <PineTree className="xmas-splash__tree xmas-splash__tree--d" />
  </div>
);

const NewYearSplash = () => (
  <div className="season-splash ny-splash" aria-hidden="true">
    <div className="ny-splash__glow" />
    <FireworkBurst className="ny-splash__burst ny-burst--gold ny-splash__burst--a" />
    <FireworkBurst className="ny-splash__burst ny-burst--violet ny-splash__burst--b" />
    <FireworkBurst className="ny-splash__burst ny-burst--rose ny-splash__burst--c" />
    <FireworkBurst className="ny-splash__burst ny-burst--gold ny-splash__burst--d" />
    <Sparkle className="ny-sparkle" style={{ left: '12%', top: '40%', width: 10 }} />
    <Sparkle
      className="ny-sparkle"
      style={{ left: '86%', top: '46%', width: 12, animationDelay: '-1s' }}
    />
    <Confetti />
    <Skyline className="ny-splash__skyline" />
  </div>
);

const HEART_BURST = [
  { tx: '-40vw', ty: '-30vh', s: 1.1, d: '0.15s' },
  { tx: '36vw', ty: '-34vh', s: 0.9, d: '0.22s' },
  { tx: '-34vw', ty: '6vh', s: 0.8, d: '0.35s' },
  { tx: '42vw', ty: '-4vh', s: 1, d: '0.3s' },
  { tx: '-10vw', ty: '-44vh', s: 0.7, d: '0.45s' },
  { tx: '16vw', ty: '-42vh', s: 0.85, d: '0.18s' },
  { tx: '28vw', ty: '20vh', s: 0.6, d: '0.55s' },
  { tx: '-24vw', ty: '24vh', s: 0.65, d: '0.5s' },
];

const ValentineSplash = () => (
  <div className="season-splash vt-splash" aria-hidden="true">
    <div className="vt-splash__glow" />
    <GlossyHeart gloss={false} className="vt-splash__heart" />
    {HEART_BURST.map((h, i) => (
      <div
        key={i}
        className="vt-splash__burst"
        style={
          {
            '--tx': h.tx,
            '--ty': h.ty,
            '--s': h.s,
            animationDelay: h.d,
          } as React.CSSProperties
        }
      >
        <GlossyHeart tone={i % 3 === 0 ? 'blush' : 'rose'} />
      </div>
    ))}
    <RisingHearts />
    <FallingPetals />
    <div className="vt-splash__garland">
      {Array.from({ length: 12 }, (_, i) => (
        <HeartGarland key={i} offset={i} />
      ))}
    </div>
  </div>
);

export const SeasonalSplashDecor = ({ season }: { season: SeasonId | null }) => {
  if (season === 'spooky') return <SpookySplash />;
  if (season === 'christmas') return <ChristmasSplash />;
  if (season === 'newyear') return <NewYearSplash />;
  if (season === 'valentine') return <ValentineSplash />;
  return null;
};

const newYearNumber = (date = new Date()) =>
  date.getMonth() === 0 ? date.getFullYear() : date.getFullYear() + 1;

export const SeasonalSplashEyebrow = ({ season }: { season: SeasonId | null }) => {
  if (!season) return null;
  const label =
    season === 'spooky'
      ? 'Spooky Season'
      : season === 'christmas'
        ? t('Frohe Weihnachten')
        : season === 'valentine'
          ? t('Alles Liebe zum Valentinstag')
          : `${t('Frohes neues Jahr')} ${newYearNumber()}`;
  return <span className={`season-eyebrow season-eyebrow--${season}`}>{label}</span>;
};
