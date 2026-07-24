import { drawAxolotl } from '../../components/pet/drawAxolotl';
import { drawBird } from '../../components/pet/drawBird';
import { drawCat } from '../../components/pet/drawCat';
import { drawDog } from '../../components/pet/drawDog';
import { drawDragon } from '../../components/pet/drawDragon';
import { drawFox } from '../../components/pet/drawFox';
import { drawOwl } from '../../components/pet/drawOwl';
import { drawPanda } from '../../components/pet/drawPanda';
import { drawPenguin } from '../../components/pet/drawPenguin';
import { drawRabbit } from '../../components/pet/drawRabbit';

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
};

/** Sticker-Set: alle 10 Pets als Kawaii- (Lv25) und Evolutions-Form (Lv60). */
export const STICKER_IDS = Object.keys(STICKER_DRAWERS).flatMap((pet) => [
  `${pet}-25`,
  `${pet}-60`,
]);

export function isValidStickerId(id: string): boolean {
  const [pet, level] = id.split('-');
  return !!STICKER_DRAWERS[pet] && (level === '25' || level === '60');
}
