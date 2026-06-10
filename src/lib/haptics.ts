/**
 * Haptic feedback helpers.
 *
 * Wraps `navigator.vibrate` with semantic, app-wide patterns so callers don't
 * repeat magic numbers (`vibrate(10)` vs `vibrate([50,50,50])`). Each helper
 * is a no-op on devices without the Vibration API (most desktops, iOS Safari
 * outside web-share contexts) — safe to call unconditionally.
 *
 * Respect the user's reduced-motion preference: vibration is a motion cue,
 * so if the OS asks for reduced motion, we stay silent.
 */

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (prefersReducedMotion()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — some browsers throw if called too frequently
  }
};

/** Lightest touch — taps, toggles, list-item picks. */
export const hapticTap = (): void => vibrate(10);

/** Selection change — sort/filter switches, segmented controls. */
export const hapticSelect = (): void => vibrate(15);

/** Confirmation — episode marked, rating saved, item added. */
export const hapticSuccess = (): void => vibrate([20, 30, 20]);

/** Mild warning — destructive confirm, undo prompt. */
export const hapticWarning = (): void => vibrate([30, 40]);

/** Error — failed action, invalid input. */
export const hapticError = (): void => vibrate([60, 50, 60]);

/** Celebration — streak milestone, badge unlock, mystery box. */
export const hapticCelebrate = (): void => vibrate([60, 40, 60, 40, 120]);
