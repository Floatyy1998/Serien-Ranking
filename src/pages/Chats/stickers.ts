import { drawAxolotl } from '../../components/pet/sprites/drawAxolotl';
import { drawBat } from '../../components/pet/sprites/drawBat';
import { drawBird } from '../../components/pet/sprites/drawBird';
import { drawCapybara } from '../../components/pet/sprites/drawCapybara';
import { drawCat } from '../../components/pet/sprites/drawCat';
import { drawDog } from '../../components/pet/sprites/drawDog';
import { drawDragon } from '../../components/pet/sprites/drawDragon';
import { drawFox } from '../../components/pet/sprites/drawFox';
import { drawFrog } from '../../components/pet/sprites/drawFrog';
import { drawHedgehog } from '../../components/pet/sprites/drawHedgehog';
import { drawOtter } from '../../components/pet/sprites/drawOtter';
import { drawOwl } from '../../components/pet/sprites/drawOwl';
import { drawPanda } from '../../components/pet/sprites/drawPanda';
import { drawPenguin } from '../../components/pet/sprites/drawPenguin';
import { drawRabbit } from '../../components/pet/sprites/drawRabbit';
import { drawUnicorn } from '../../components/pet/sprites/drawUnicorn';

export type StickerDrawFn = (
  ctx: CanvasRenderingContext2D,
  level: number,
  ps: number,
  color: string,
  dark: string,
  light: string,
  offset: number,
  animated: boolean,
  frame: number,
  animationSpeed: number
) => void;

export const STICKER_DRAWERS: Record<string, { fn: StickerDrawFn; color: string }> = {
  cat: { fn: drawCat as StickerDrawFn, color: '#ffb74d' },
  dog: { fn: drawDog as StickerDrawFn, color: '#a1887f' },
  bird: { fn: drawBird as StickerDrawFn, color: '#4fc3f7' },
  dragon: { fn: drawDragon as StickerDrawFn, color: '#9575cd' },
  fox: { fn: drawFox as StickerDrawFn, color: '#ff8a65' },
  rabbit: { fn: drawRabbit as StickerDrawFn, color: '#f8bbd0' },
  panda: { fn: drawPanda as StickerDrawFn, color: '#eceff1' },
  owl: { fn: drawOwl as StickerDrawFn, color: '#8d6e63' },
  penguin: { fn: drawPenguin as StickerDrawFn, color: '#455a64' },
  axolotl: { fn: drawAxolotl as StickerDrawFn, color: '#f48fb1' },
  frog: { fn: drawFrog as StickerDrawFn, color: '#81c784' },
  hedgehog: { fn: drawHedgehog as StickerDrawFn, color: '#a1887f' },
  otter: { fn: drawOtter as StickerDrawFn, color: '#b08968' },
  capybara: { fn: drawCapybara as StickerDrawFn, color: '#c8a27c' },
  unicorn: { fn: drawUnicorn as StickerDrawFn, color: '#e1bee7' },
  bat: { fn: drawBat as StickerDrawFn, color: '#7e6bc4' },
};

/** Sticker-Set: alle Pets als Kawaii- (Lv25) und Evolutions-Form (Lv60). */
export const STICKER_IDS = Object.keys(STICKER_DRAWERS).flatMap((pet) => [
  `${pet}-25`,
  `${pet}-60`,
]);

export function isValidStickerId(id: string): boolean {
  const [pet, level] = id.split('-');
  return !!STICKER_DRAWERS[pet] && (level === '25' || level === '60');
}
