const TMDB_BASE = 'https://image.tmdb.org/t/p';

type PosterInput = string | { poster?: string } | null | undefined;

// Alter Backend-Bug produzierte URLs wie ".../w342null" — als invalid erkennen, Fallback nutzen.
const isBrokenTmdbUrl = (url: string): boolean =>
  url.endsWith('/null') || url.endsWith('null') || url.endsWith('undefined');

// Vom ThemeProvider gesetzt, damit Caller keinen useTheme() für den themed Placeholder brauchen.
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
  // Caller-Fallback > themed > static; `fallback === ''` heißt explizit "nichts zeigen".
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

/** Backdrop-Größe: auf großen/Retina-Screens (effektiv ≥ 2200px) reicht w1280 nicht — dann original. */
export const getBackdropSize = (): TmdbImageSize => {
  if (typeof window === 'undefined') return 'w1280';
  const effectivePx = window.innerWidth * (window.devicePixelRatio || 1);
  return effectivePx >= 2200 ? 'original' : 'w1280';
};

/** Hebt eine fertige w1280-Backdrop-URL auf die zum Screen passende Größe an. */
export const upgradeBackdropUrl = <T extends string | undefined>(url: T): T => {
  if (!url || getBackdropSize() !== 'original') return url;
  return url.replace('/t/p/w1280/', '/t/p/original/') as T;
};

/** TMDB-`srcset` für responsives Laden; leer für Placeholder/externe URLs (nicht resizebar). */
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
