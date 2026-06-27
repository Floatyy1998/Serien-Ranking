import { useMemo } from 'react';
import { useMovieList } from '../contexts/MovieListContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { isSupportedProvider } from '../config/menuItems';
import { calculateOverallRating } from '../lib/rating/rating';
import { getProviderLogoUrl } from '../lib/providerMerge';
import { normalizeProviderName } from '../lib/validation/providerChangeDetection';
import type { Movie } from '../types/Movie';
import type { Series } from '../types/Series';
import { getImageUrl } from '../utils/imageUrl';

export interface TopRatedProvider {
  name: string;
  logo: string;
}

export interface TopRatedItem {
  type: 'series' | 'movie';
  id: number;
  title: string;
  poster: string;
  rating: number;
  genres: string;
  year?: string;
  providers?: TopRatedProvider[];
}

function extractProviders(item: Series | Movie): TopRatedProvider[] {
  const raw = item.provider?.provider;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const seen = new Set<string>();
  const out: TopRatedProvider[] = [];
  for (const p of raw) {
    if (!p?.name) continue;
    const normalized = normalizeProviderName(p.name);
    if (!normalized || !isSupportedProvider(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    const logo = getProviderLogoUrl(normalized) ?? p.logo ?? '';
    if (!logo) continue;
    out.push({ name: normalized, logo });
  }
  return out;
}

const TOP_N = 10;
const MAX_COMBINED = 20;

function collectTopRated<T extends Series | Movie>(
  list: T[],
  type: 'series' | 'movie',
  limit: number
): TopRatedItem[] {
  const rated: Array<{ item: T; rating: number }> = [];
  for (const item of list) {
    const rating = parseFloat(calculateOverallRating(item));
    if (rating > 0) {
      rated.push({ item, rating });
    }
  }
  rated.sort((a, b) => b.rating - a.rating);
  return rated.slice(0, limit).map(({ item, rating }) => {
    const genres = (item.genre?.genres ?? [])
      .filter((g) => g.toLowerCase() !== 'all')
      .slice(0, 2)
      .join(', ');
    let dateStr: string | undefined;
    if (type === 'series') {
      const s = item as Series;
      dateStr = s.first_air_date || s.release_date || undefined;
      // Fallback: first episode air_date
      if (!dateStr && s.seasons) {
        for (const season of s.seasons) {
          if (!season.episodes) continue;
          for (const ep of season.episodes) {
            if (!ep) continue;
            const d = ep.air_date || ep.airDate || ep.firstAired;
            if (d) {
              dateStr = d;
              break;
            }
          }
          if (dateStr) break;
        }
      }
    } else {
      dateStr = (item as Movie).release_date;
    }
    return {
      type,
      id: item.id,
      title: item.title,
      poster: getImageUrl(item.poster),
      rating,
      genres,
      year: dateStr ? String(dateStr).slice(0, 4) : undefined,
      providers: extractProviders(item),
    };
  });
}

export const useTopRated = (): TopRatedItem[] => {
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  return useMemo(() => {
    const combined = [
      ...collectTopRated(seriesList, 'series', TOP_N),
      ...collectTopRated(movieList, 'movie', TOP_N),
    ];
    combined.sort((a, b) => b.rating - a.rating);
    return combined.slice(0, MAX_COMBINED);
  }, [seriesList, movieList]);
};
