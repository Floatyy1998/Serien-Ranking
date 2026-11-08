import { APP_READY_EVENT } from './appReady';

// Länger wartet niemand vor dem Splash; danach greift wieder die Update-Pille.
const MAX_HOLD_MS = 10000;
const RESUME_KEY = 'splashResume';
const RESUME_MAX_AGE_MS = 15000;

/** Balkenstand, solange das Update lädt — der Splash nach dem Reload macht hier weiter. */
export const HELD_PROGRESS = 0.9;

let heldUntil = 0;
let resumed: boolean | null = null;

function notify(): void {
  window.dispatchEvent(new CustomEvent(APP_READY_EVENT));
}

/** Splash stehen lassen, solange beim Start ein neuer Build installiert wird. */
export function holdSplashForUpdate(): void {
  if (typeof window === 'undefined' || window.splashScreenComplete !== false) return;
  heldUntil = Date.now() + MAX_HOLD_MS;
  notify();
}

export function releaseSplashHold(): void {
  if (!heldUntil) return;
  heldUntil = 0;
  if (typeof window !== 'undefined') notify();
}

export function isSplashHeldForUpdate(): boolean {
  return heldUntil > Date.now();
}

/** Vor dem Update-Reload aus dem Splash: der nächste Splash setzt ohne Einblenden fort. */
export function markSplashResume(): void {
  try {
    sessionStorage.setItem(RESUME_KEY, String(Date.now()));
  } catch {
    /* ohne Storage gibt es eben ein zweites Einblenden */
  }
}

/** Einmal pro Seite gelesen und verbraucht. */
export function isSplashResumed(): boolean {
  if (resumed !== null) return resumed;
  resumed = false;
  try {
    const stamp = Number(sessionStorage.getItem(RESUME_KEY));
    sessionStorage.removeItem(RESUME_KEY);
    resumed = stamp > 0 && Date.now() - stamp < RESUME_MAX_AGE_MS;
  } catch {
    /* Storage gesperrt */
  }
  return resumed;
}
