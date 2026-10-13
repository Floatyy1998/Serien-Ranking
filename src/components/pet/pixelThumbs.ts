import type { SeasonId } from '../../theme/seasonalThemes';
import type { Pet, PetAccessory } from '../../types/pet.types';
import { ACCESSORIES } from './data/accessories';
import { wornAccessories } from './outfit';
import { drawPetFigure } from './renderPet';
import { seasonCostume } from './seasonCostume';
import { drawAccessory, drawAccessoryBack } from './sprites/drawAccessory';

/** Hoch aufgelöst, damit die weich gezeichneten Pets auch auf Retina-Displays scharf bleiben. */
const THUMB_PS = 12;
const PORTRAIT_PS = 16;
/** Rand um das 32er-Raster, damit hohe Hüte und Flügel nicht abgeschnitten werden. */
const MARGIN = 10;
const cache = new Map<string, string>();

/** Zeichnet ins vergrößerte Raster und schneidet auf den sichtbaren Inhalt zu. */
function render(
  draw: (ctx: CanvasRenderingContext2D) => void,
  minCells: number,
  ps: number
): string {
  const full = (32 + MARGIN * 2) * ps;
  const canvas = document.createElement('canvas');
  canvas.width = full;
  canvas.height = full;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.translate(MARGIN * ps, MARGIN * ps);
  draw(ctx);

  const { data } = ctx.getImageData(0, 0, full, full);
  let minX = full;
  let minY = full;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < full; y++) {
    const row = y * full * 4 + 3;
    for (let x = 0; x < full; x++) {
      if (data[row + x * 4] < 8) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return '';

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const min = minCells * ps;
  const outW = Math.max(w, min);
  const outH = Math.max(h, min);
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const octx = out.getContext('2d');
  if (!octx) return '';
  octx.drawImage(canvas, minX, minY, w, h, (outW - w) / 2, (outH - h) / 2, w, h);
  return out.toDataURL('image/png');
}

function cached(key: string, make: () => string): string {
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const url = make();
  cache.set(key, url);
  return url;
}

const levelBucket = (level: number) =>
  level >= 50 ? 50 : level >= 20 ? 20 : level >= 15 ? 15 : level >= 10 ? 10 : level >= 5 ? 5 : 1;

/** Das Accessoire allein, so wie es auf diesem Pet-Typ sitzt. */
export function accessoryThumb(
  accessoryId: string,
  petType: Pet['type'],
  level: number,
  color?: string
): string {
  const bucket = levelBucket(level);
  return cached(`a|${accessoryId}|${petType}|${bucket}|${color ?? ''}`, () => {
    const def = ACCESSORIES[accessoryId];
    if (!def) return '';
    const accessory: PetAccessory = {
      id: accessoryId,
      type: def.slot,
      name: def.name,
      icon: def.icon,
      equipped: true,
      ...(color || def.color ? { color: color ?? def.color } : {}),
    };
    return render(
      (ctx) => {
        drawAccessoryBack(ctx, accessory, THUMB_PS, 0, petType, bucket);
        drawAccessory(ctx, accessory, THUMB_PS, 0, petType, bucket);
      },
      12,
      THUMB_PS
    );
  });
}

/** Ganzes Pet mit Outfit und, solange es läuft, dem Saison-Hut — ohne Glow. */
export function petPortrait(pet: Pet, color = pet.color, season: SeasonId | null = null): string {
  const worn = wornAccessories(pet)
    .map((a) => a.id)
    .join(',');
  return cached(`p|${pet.type}|${color}|${pet.level}|${worn}|${season ?? ''}`, () =>
    render(
      (ctx) =>
        drawPetFigure(ctx, color === pet.color ? pet : { ...pet, color }, {
          ps: PORTRAIT_PS,
          offset: 0,
          animated: false,
          frame: 0,
          animationSpeed: 0,
          overlay: seasonCostume(pet, season, PORTRAIT_PS, 0),
        }),
      0,
      PORTRAIT_PS
    )
  );
}
