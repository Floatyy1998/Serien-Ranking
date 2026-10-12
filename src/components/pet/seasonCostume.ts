import type { SeasonId } from '../../theme/seasonalThemes';
import type { Pet } from '../../types/pet.types';
import { drawFlowerCrown, drawPartyHat, drawSantaHat, drawWitchHat } from './accessories/head';
import { getAnchors } from './sprites/drawAccessory';
import { wornSlots } from './outfit';

const HATS: Record<SeasonId, typeof drawSantaHat> = {
  spooky: drawWitchHat,
  christmas: drawSantaHat,
  newyear: drawPartyHat,
  valentine: drawFlowerCrown,
};

/** Dieselben Hüte als Accessoire, für Vorschaubilder und Namen. */
export const SEASON_HAT_ID: Record<SeasonId, string> = {
  spooky: 'witchHat',
  christmas: 'santaHat',
  newyear: 'partyHat',
  valentine: 'flowerCrown',
};

/** Saison-Hut, solange das Pet keinen eigenen Kopfschmuck trägt. */
export function seasonCostume(
  pet: Pet,
  season: SeasonId | null | undefined,
  ps: number,
  offset: number
): ((ctx: CanvasRenderingContext2D) => void) | undefined {
  if (!season || wornSlots(pet).has('head')) return undefined;
  const anchors = getAnchors(pet.type, pet.level);
  const draw = HATS[season];
  return (ctx) => draw(ctx, ps, offset, anchors);
}
