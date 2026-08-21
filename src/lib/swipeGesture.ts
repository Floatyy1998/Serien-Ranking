/** Reine Gesten-Mathematik der Episoden-/Kapitel-Karten: Dämpfung, Armierung und Commit in beide Richtungen. */

/** Weg, ab dem ein langsamer Swipe committet. */
export const SWIPE_COMMIT_PX = 110;
/** Mindestweg für einen schnellen Flick. */
export const SWIPE_FLICK_MIN_PX = 60;
/** Mindestgeschwindigkeit (px/s) für einen Flick. */
export const SWIPE_FLICK_VELOCITY = 600;
/** Ab hier folgt die Karte dem Finger nur noch gedämpft. */
export const SWIPE_SOFT_CAP_PX = 150;
/** Gesperrte Zeilen geben nur als Gummiband nach. */
export const SWIPE_LOCKED_RESISTANCE = 0.1;

export type SwipeDirection = 'left' | 'right';

/** Verschiebung der Karte: gesperrt = Gummiband, sonst 1:1 bis zum weichen Cap. */
export const dampSwipeOffset = (raw: number, canSwipe: boolean): number => {
  if (!canSwipe) return raw * SWIPE_LOCKED_RESISTANCE;
  const abs = Math.abs(raw);
  const damped =
    abs <= SWIPE_SOFT_CAP_PX ? abs : SWIPE_SOFT_CAP_PX + (abs - SWIPE_SOFT_CAP_PX) * 0.4;
  return raw < 0 ? -damped : damped;
};

/** True, sobald der Finger die Commit-Schwelle überschritten hat (beide Richtungen). */
export const isSwipeArmed = (rawOffset: number, canSwipe: boolean): boolean =>
  canSwipe && Math.abs(rawOffset) > SWIPE_COMMIT_PX;

/** Richtung, in die die Karte rausfliegen soll — oder null, wenn sie zurückfedert. */
export const resolveSwipeCommit = (
  rawOffset: number,
  velocity: number,
  canSwipe: boolean
): SwipeDirection | null => {
  if (!canSwipe) return null;
  const direction: SwipeDirection = rawOffset < 0 ? 'left' : 'right';
  if (Math.abs(rawOffset) > SWIPE_COMMIT_PX) return direction;
  const flick =
    Math.abs(rawOffset) > SWIPE_FLICK_MIN_PX &&
    Math.abs(velocity) > SWIPE_FLICK_VELOCITY &&
    Math.sign(velocity) === Math.sign(rawOffset);
  return flick ? direction : null;
};
