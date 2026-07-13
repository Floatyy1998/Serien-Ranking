const TMDB_BASE = 'https://image.tmdb.org/t/p';

type PosterInput = string | { poster?: string } | null | undefined;

// Aelteste Catalog-Eintraege haben durch einen Backend-Bug URLs wie
// ".../w342null" oder ".../w342undefined" produziert (String-Konkatenation
// mit fehlendem poster_path). Diese als invalid erkennen und auf Fallback.
const isBrokenTmdbUrl = (url: string): boolean =>
  url.endsWith('/null') || url.endsWith('null') || url.endsWith('undefined');

// Module-level Themed-Fallback. Wird vom ThemeProvider per Effect gesetzt, damit
// Caller (Hooks, Worker-Brueckenfunktionen, helpers, ...) keinen useTheme()
// brauchen, um den Theme-eingefaerbten Placeholder als Default zu bekommen.
let themedPlaceholder: string | null = null;

export const setThemedPlaceholder = (url: string | null): void => {
  themedPlaceholder = url;
};

export const STATIC_PLACEHOLDER = '/placeholder.svg';

/** True wenn die URL ein Placeholder ist (statisch oder themed data-URL). */
export const isPlaceholderUrl = (url: string | undefined | null): boolean => {
  if (!url) return true;
  if (url === STATIC_PLACEHOLDER || url === '/placeholder.jpg') return true;
  return url.startsWith('data:image/svg+xml');
};

export type TmdbImageSize =
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'w1280'
  | 'original';

export const getImageUrl = (
  posterObj: PosterInput,
  size: TmdbImageSize = 'w342',
  fallback?: string
): string => {
  // Priorisierung: expliziter Caller-Fallback (auch '' erlaubt um Bild zu
  // verstecken) > themed > static. `fallback === undefined` heisst "default
  // benutzen", `fallback === ''` heisst explizit "nichts zeigen".
  const fb = fallback !== undefined ? fallback : (themedPlaceholder ?? STATIC_PLACEHOLDER);
  if (!posterObj) return fb;
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return fb;
  if (path.startsWith('http')) {
    if (isBrokenTmdbUrl(path)) return fb;
    return path;
  }
  return `${TMDB_BASE}/${size}${path}`;
};

/**
 * Build a TMDB `srcset` for responsive loading. Returns an empty string for
 * placeholder URLs / external URLs that we cannot resize. Pair with a single
 * default `src` from `getImageUrl(..., 'w342')` and an appropriate `sizes`
 * attribute, e.g. `(max-width: 640px) 30vw, 200px`.
 */
export const getPosterSrcSet = (posterObj: PosterInput): string => {
  if (!posterObj) return '';
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return '';
  if (path.startsWith('http')) return ''; // external / already-final URLs cannot be resized
  return [
    `${TMDB_BASE}/w185${path} 185w`,
    `${TMDB_BASE}/w342${path} 342w`,
    `${TMDB_BASE}/w500${path} 500w`,
    `${TMDB_BASE}/w780${path} 780w`,
  ].join(', ');
};
