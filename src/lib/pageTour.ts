/**
 * Auswahl der Seitenhilfe zu einer Route und die Frage, ob sie noch aussteht.
 * Reine Logik ohne I/O — gespeichert wird in `services/pageTour.ts`.
 */

export interface PageTourAction {
  /** Schlüssel in die Icon-Tabelle von `features/tour/tourIcons.ts`. */
  icon: string;
  /** Deutscher Quelltext, wird beim Rendern durch `t()` geschickt. */
  title: string;
  text: string;
}

export interface PageTour {
  /** Route-Muster wie in React Router, z. B. `/series/:id`. */
  path: string;
  /** Hochzählen, wenn sich die Aktionen ändern — dann erscheint die Hilfe erneut. */
  version: number;
  title: string;
  intro: string;
  actions: PageTourAction[];
}

/** Gesehene Hilfen: Route-Muster → zuletzt gesehene Version. */
export type SeenTours = Record<string, number>;

const segments = (path: string): string[] => path.split('/').filter(Boolean);

/** Route-Muster gegen einen konkreten Pfad prüfen (`:param` passt auf ein Segment). */
export const matchesPath = (pattern: string, pathname: string): boolean => {
  const p = segments(pattern);
  const a = segments(pathname);
  if (p.length !== a.length) return false;
  return p.every((seg, i) => seg.startsWith(':') || seg === a[i]);
};

/**
 * Passende Hilfe zu einem Pfad. Exakte Treffer schlagen Muster mit Parametern,
 * damit `/manga/search` nicht an `/manga/:id` hängen bleibt.
 */
export const findTour = (tours: readonly PageTour[], pathname: string): PageTour | null => {
  let match: PageTour | null = null;
  for (const tour of tours) {
    if (!matchesPath(tour.path, pathname)) continue;
    if (!tour.path.includes(':')) return tour;
    match = match ?? tour;
  }
  return match;
};

export const isTourPending = (seen: SeenTours, tour: PageTour): boolean =>
  (seen[tour.path] ?? 0) < tour.version;

export const markTourSeen = (seen: SeenTours, tour: PageTour): SeenTours => ({
  ...seen,
  [tour.path]: tour.version,
});
