import type { Pet } from '../../types/pet.types';
import { PET_COLORS } from '../../types/pet.types';
import { adjustColor } from './colorUtils';
import { slotOf, wornAccessories, wornSlots } from './outfit';
import { drawAccessory, drawAccessoryBack } from './sprites/drawAccessory';
import { drawAxolotl } from './sprites/drawAxolotl';
import { drawBird } from './sprites/drawBird';
import { drawCat } from './sprites/drawCat';
import { drawDog } from './sprites/drawDog';
import { drawDragon, drawDragonWingsOverlay } from './sprites/drawDragon';
import { drawFox } from './sprites/drawFox';
import { drawOwl } from './sprites/drawOwl';
import { drawPanda } from './sprites/drawPanda';
import { drawPenguin } from './sprites/drawPenguin';
import { drawRabbit } from './sprites/drawRabbit';
import { NEUTRAL_POSE, type PetPose } from './sprites/pose';

type Drawer = typeof drawCat;

const DRAWERS: Record<Pet['type'], Drawer> = {
  cat: drawCat,
  dog: drawDog,
  dragon: drawDragon,
  bird: drawBird,
  fox: drawFox,
  rabbit: drawRabbit,
  panda: drawPanda,
  owl: drawOwl,
  penguin: drawPenguin,
  axolotl: drawAxolotl,
};

export interface PetColors {
  color: string;
  dark: string;
  light: string;
}

export function petColors(pet: Pick<Pet, 'color'>): PetColors {
  const color = PET_COLORS[pet.color as keyof typeof PET_COLORS] || PET_COLORS.blau;
  return { color, dark: adjustColor(color, -40), light: adjustColor(color, 40) };
}

const DRAW_ORDER = ['neck', 'face', 'head'];

export interface FigureOptions {
  ps: number;
  offset: number;
  animated: boolean;
  frame: number;
  animationSpeed: number;
  pose?: PetPose;
  colors?: PetColors;
  /** Zusätzliche Zeichnung nach den Accessoires, z. B. ein Saison-Kostüm. */
  overlay?: (ctx: CanvasRenderingContext2D) => void;
}

/** Zeichnet Körper, Accessoires und Drachenflügel im 32er-Raster ab (0,0). */
export function drawPetFigure(ctx: CanvasRenderingContext2D, pet: Pet, o: FigureOptions): void {
  const { color, dark, light } = o.colors ?? petColors(pet);
  const drawer = DRAWERS[pet.type] ?? drawCat;
  const worn = wornAccessories(pet).sort(
    (a, b) => DRAW_ORDER.indexOf(slotOf(a.id) ?? '') - DRAW_ORDER.indexOf(slotOf(b.id) ?? '')
  );
  worn.forEach((accessory) =>
    drawAccessoryBack(ctx, accessory, o.ps, o.offset, pet.type, pet.level)
  );
  drawer(
    ctx,
    pet.level,
    o.ps,
    color,
    dark,
    light,
    o.offset,
    o.animated,
    o.frame,
    o.animationSpeed,
    wornSlots(pet),
    o.pose ?? NEUTRAL_POSE
  );

  worn.forEach((accessory) => drawAccessory(ctx, accessory, o.ps, o.offset, pet.type, pet.level));

  o.overlay?.(ctx);

  if (pet.type === 'dragon') {
    drawDragonWingsOverlay(
      ctx,
      pet.level,
      o.ps,
      color,
      dark,
      o.offset,
      o.animated,
      o.frame,
      o.animationSpeed
    );
  }
}
