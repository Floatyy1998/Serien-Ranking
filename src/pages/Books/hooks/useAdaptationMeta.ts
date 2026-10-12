import { useEffect, useMemo, useState } from 'react';
import { useMovieList } from '../../../contexts/MovieListContext';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { tmdbFetch } from '../../../services/api/tmdbClient';
import { cached } from '../../../services/books/bookCache';
import { appLocale } from '../../../services/i18n';
import type { BookAdaptation } from '../../../types/Book';

export interface AdaptationMeta extends BookAdaptation {
  poster?: string;
  year?: number;
  inList: boolean;
  displayTitle: string;
}

/** Poster und Jahr aus TMDB, „in deiner Liste" aus den eigenen Listen. */
export function useAdaptationMeta(adaptations: BookAdaptation[]): AdaptationMeta[] {
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [fetched, setFetched] = useState<
    Record<string, { poster?: string; year?: number; title?: string }>
  >({});
  const key = adaptations.map((a) => `${a.kind}-${a.tmdbId}`).join(',');

  useEffect(() => {
    let alive = true;
    void Promise.all(
      adaptations.slice(0, 12).map(async (a) => {
        const id = `${a.kind}-${a.tmdbId}`;
        try {
          const meta = await cached('tmdbMeta', `${appLocale}:${id}`, 7 * 86_400_000, async () => {
            const data = await tmdbFetch<{
              poster_path?: string;
              name?: string;
              title?: string;
              first_air_date?: string;
              release_date?: string;
            }>(`${a.kind === 'series' ? 'tv' : 'movie'}/${a.tmdbId}`);
            return {
              poster: data.poster_path ?? undefined,
              title: data.name ?? data.title,
              year:
                Number((data.first_air_date ?? data.release_date ?? '').slice(0, 4)) || undefined,
            };
          });
          return [id, meta] as const;
        } catch {
          return [id, {}] as const;
        }
      })
    ).then((entries) => {
      if (alive) setFetched(Object.fromEntries(entries));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useMemo(() => {
    const seriesIds = new Set(seriesList.map((s) => Number(s.id)));
    const movieIds = new Set(movieList.map((m) => Number(m.id)));
    return adaptations
      .map((a) => {
        const meta = fetched[`${a.kind}-${a.tmdbId}`] ?? {};
        return {
          ...a,
          poster: meta.poster,
          year: meta.year,
          displayTitle: meta.title || a.title,
          inList: a.kind === 'series' ? seriesIds.has(a.tmdbId) : movieIds.has(a.tmdbId),
        };
      })
      .sort((a, b) => Number(b.inList) - Number(a.inList) || (a.year ?? 9999) - (b.year ?? 9999));
  }, [adaptations, fetched, seriesList, movieList]);
}
