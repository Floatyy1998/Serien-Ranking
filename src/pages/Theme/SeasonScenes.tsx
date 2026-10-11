import {
  Bat,
  Cobweb,
  Graveyard,
  Pumpkin,
  Spider,
} from '../../components/seasonal/spooky/SpookyArt';
import { LightString, PineTree, Sleigh } from '../../components/seasonal/christmas/ChristmasArt';
import { Snowfall } from '../../components/seasonal/christmas/ChristmasLayer';
import { FireworkBurst, Skyline, Sparkle } from '../../components/seasonal/newyear/NewYearArt';
import {
  CupidArrow,
  GlossyHeart,
  HeartGarland,
} from '../../components/seasonal/valentine/ValentineArt';
import { FallingPetals } from '../../components/seasonal/valentine/ValentineLayer';
import type { SeasonId } from '../../theme/seasonalThemes';

const SpookyScene = () => (
  <>
    <div className="spooky-card__moon" />
    <Cobweb seed={5} className="spooky-card__web" />
    <div className="spooky-card__dangler">
      <span className="spooky-card__thread" />
      <Spider className="spooky-card__spider" />
    </div>
    <Bat className="spooky-card__bat spooky-card__bat--a" />
    <Bat className="spooky-card__bat spooky-card__bat--b" />
    <Graveyard className="spooky-card__graves" />
    <Pumpkin className="spooky-card__pumpkin" />
  </>
);

const ChristmasScene = () => (
  <>
    <div className="xmas-scene__moon" />
    <Sleigh className="xmas-scene__sleigh" />
    <Snowfall />
    <svg className="xmas-scene__hills" viewBox="0 0 360 56" preserveAspectRatio="none">
      <path d="M0 26Q60 8 130 20T260 16T360 22V56H0Z" fill="#c9d6dc" />
      <path d="M0 38Q80 22 170 34T360 30V56H0Z" fill="#eef3f5" />
    </svg>
    <PineTree star className="xmas-scene__tree xmas-scene__tree--a" />
    <PineTree className="xmas-scene__tree xmas-scene__tree--b" />
    <PineTree className="xmas-scene__tree xmas-scene__tree--c" />
    <div className="xmas-scene__lights">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <LightString key={i} offset={i} />
      ))}
    </div>
  </>
);

const newYearNumber = (date = new Date()) =>
  date.getMonth() === 0 ? date.getFullYear() : date.getFullYear() + 1;

const NewYearScene = () => (
  <>
    <Sparkle className="ny-sparkle" style={{ left: '16%', top: '58%', width: 8 }} />
    <Sparkle
      className="ny-sparkle"
      style={{ left: '82%', top: '52%', width: 10, animationDelay: '-1.4s' }}
    />
    <FireworkBurst className="ny-burst ny-burst--gold ny-burst--a" />
    <FireworkBurst className="ny-burst ny-burst--violet ny-burst--b" />
    <FireworkBurst className="ny-burst ny-burst--rose ny-burst--c" />
    <span className="ny-scene__year">{newYearNumber()}</span>
    <Skyline className="ny-scene__skyline" />
  </>
);

const ValentineScene = () => (
  <>
    <div className="vt-scene__bokeh" />
    <FallingPetals />
    <GlossyHeart tone="blush" className="vt-scene__mini vt-scene__mini--a" />
    <GlossyHeart className="vt-scene__mini vt-scene__mini--b" />
    <GlossyHeart tone="blush" className="vt-scene__mini vt-scene__mini--c" />
    <div className="vt-scene__hero">
      <GlossyHeart className="vt-scene__heart" />
      <CupidArrow className="vt-scene__arrow" />
    </div>
    <div className="vt-scene__garland">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <HeartGarland key={i} offset={i} />
      ))}
    </div>
  </>
);

export const SeasonScene = ({ season }: { season: SeasonId }) => {
  if (season === 'spooky') return <SpookyScene />;
  if (season === 'christmas') return <ChristmasScene />;
  if (season === 'valentine') return <ValentineScene />;
  return <NewYearScene />;
};
