const TMDB_BASE = 'https://image.tmdb.org/t/p';

type PosterInput = string | { poster?: string } | null | undefined;

export const getImageUrl = (
  posterObj: PosterInput,
  size: 'w342' | 'w500' = 'w342',
  fallback = '/placeholder.jpg'
): string => {
  if (!posterObj) return fallback;
  const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${TMDB_BASE}/${size}${path}`;
};
