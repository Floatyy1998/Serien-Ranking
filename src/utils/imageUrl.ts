const TMDB_BASE = 'https://image.tmdb.org/t/p';

type PosterInput = string | { poster?: string } | null | undefined;

// Aelteste Catalog-Eintraege haben durch einen Backend-Bug URLs wie
// ".../w342null" oder ".../w342undefined" produziert (String-Konkatenation
// mit fehlendem poster_path). Diese als invalid erkennen und auf Fallback.
const isBrokenTmdbUrl = (url: string): boolean =>
  url.endsWith('/null') || url.endsWith('null') || url.endsWith('undefined');

export const getImageUrl = (
  posterObj: PosterInput,
  size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342',
  fallback = '/placeholder.svg'
): string => {
  if (!posterObj) return fallback;
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return fallback;
  if (path.startsWith('http')) {
    if (isBrokenTmdbUrl(path)) return fallback;
    return path;
  }
  return `${TMDB_BASE}/${size}${path}`;
};
