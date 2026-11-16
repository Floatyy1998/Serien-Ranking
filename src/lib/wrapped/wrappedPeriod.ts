/**
 * Der Wrapped-Kalender: gezählt wird vom 1.1. bis einschließlich 5.12., gezeigt
 * vom 6.12. bis 31.12. Während der Laufzeit steht damit immer derselbe Stand;
 * was ab dem 6.12. geschaut wird, zählt in keinem Rückblick, und das neue Jahr
 * beginnt am 1.1. wieder bei null. Alle Grenzen gelten in Ortszeit des Geräts.
 */

const RELEASE_MONTH = 11; // Dezember
const RELEASE_DAY = 6;

/** Erster Moment, der nicht mehr mitzählt (6.12., 0 Uhr), in Millisekunden. */
export const wrappedCutoff = (year: number): number =>
  new Date(year, RELEASE_MONTH, RELEASE_DAY).getTime();

/** Das Jahr, dessen Wrapped gerade läuft, oder null außerhalb des Zeitraums. */
export const liveWrappedYear = (now: Date): number | null =>
  now.getMonth() === RELEASE_MONTH && now.getDate() >= RELEASE_DAY ? now.getFullYear() : null;

/** Zählt dieser Zeitpunkt noch für das Wrapped des Jahres? Ungültige Angaben zählen nicht. */
export const countsForWrapped = (timeMs: number, year: number): boolean =>
  Number.isFinite(timeMs) && timeMs < wrappedCutoff(year);

export interface WrappedSwitch {
  /** Für alle einschalten, auch außerhalb des Zeitraums (z. B. zum Vorab-Test). */
  enabled?: boolean;
  /** Notbremse: bleibt aus, auch wenn der Zeitraum läuft. */
  paused?: boolean;
  year?: number;
}

/**
 * Ob Wrapped sichtbar ist und für welches Jahr. Der Kalender entscheidet; der
 * Schalter in der Datenbank kann es nur vorziehen oder anhalten.
 */
export function resolveWrapped(
  data: WrappedSwitch | null | undefined,
  now: Date
): { enabled: boolean; year: number } {
  const liveYear = liveWrappedYear(now);
  const currentYear = now.getFullYear();
  if (data?.paused === true) return { enabled: false, year: liveYear ?? currentYear };
  if (liveYear !== null) return { enabled: true, year: liveYear };
  if (data?.enabled === true) return { enabled: true, year: data.year ?? currentYear };
  return { enabled: false, year: currentYear };
}
