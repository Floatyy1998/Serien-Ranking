/**
 * Extrahiert pro normalisiertem Provider-Namen den TMDB-Logo-Pfad aus den
 * vorhandenen Serien und Filmen des Users. Da jede Serie ihren Provider mit
 * Logo mitliefert, reicht der erste Treffer.
 */

import { useMemo } from 'react';
import { useMovieList } from '../contexts/MovieListContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { normalizeProviderName } from '../lib/validation/providerChangeDetection';

export function useProviderLogos(): Record<string, string> {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();

  return useMemo(() => {
    const map: Record<string, string> = {};
    const collect = (entries?: { logo: string; name: string }[]) => {
      if (!entries) return;
      for (const entry of entries) {
        if (!entry?.logo || !entry?.name) continue;
        const key = normalizeProviderName(entry.name);
        if (!key || map[key]) continue;
        map[key] = entry.logo;
      }
    };
    for (const series of allSeriesList) collect(series.provider?.provider);
    for (const movie of movieList) collect(movie.provider?.provider);
    return map;
  }, [allSeriesList, movieList]);
}

export function tmdbLogoUrl(
  path: string | undefined,
  size: 'w45' | 'w92' | 'w154' = 'w92'
): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
