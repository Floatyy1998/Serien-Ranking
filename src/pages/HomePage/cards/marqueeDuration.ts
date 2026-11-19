// Leisurely reading pace – px per second. Lower = slower.
const MARQUEE_PIXELS_PER_SECOND = 48;

/** Dauer einer Runde in Sekunden — die CSS-Animation schiebt das Band um genau eine Rundenbreite. */
export function marqueeDuration(lapPx: number): number {
  return lapPx > 0 ? lapPx / MARQUEE_PIXELS_PER_SECOND : 0;
}
