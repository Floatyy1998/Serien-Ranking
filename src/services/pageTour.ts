/**
 * Merkt sich pro Gerät, welche Seitenhilfen schon gezeigt wurden. Bewusst
 * localStorage und nicht die RTDB: Egress sparen, und auf einem neuen Gerät
 * schadet die Hilfe kein zweites Mal.
 */

import type { SeenTours } from '../lib/pageTour';

const STORAGE_KEY = 'pageToursSeen';

export const readSeenTours = (): SeenTours => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const seen: SeenTours = {};
    for (const [path, version] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof version === 'number' && Number.isFinite(version)) seen[path] = version;
    }
    return seen;
  } catch {
    return {};
  }
};

export const writeSeenTours = (seen: SeenTours): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    /* Quota voll — die Hilfe erscheint dann eben noch einmal */
  }
};

/** Alle Hilfen wieder aktivieren (Knopf in den Einstellungen). */
export const resetSeenTours = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nichts zu tun */
  }
};
