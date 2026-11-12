import { useEffect, useMemo, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { isEpisodeWatched } from '../../lib/episode/seriesMetrics';
import {
  suggestInterests,
  type InterestSuggestion,
  type InterestTagMap,
} from '../../lib/interests/interests';
import { isMovieWatched, overallRatingValue } from '../../lib/rating/rating';
import { fetchStaticInterestTags } from '../../services/catalog/staticCatalog';
import { fetchInterests, subscribeInterests } from '../../services/profile/interestsService';
import type { Series } from '../../types/Series';

export function useOwnInterests(uid: string | undefined): string[] | null {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (!uid) return;
    return subscribeInterests(uid, setIds);
  }, [uid]);
  return uid ? ids : [];
}

export function useUserInterests(uid: string | undefined): string[] {
  const [state, setState] = useState<{ uid: string; ids: string[] } | null>(null);
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void fetchInterests(uid).then((ids) => {
      if (!cancelled) setState({ uid, ids });
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);
  return state && state.uid === uid ? state.ids : [];
}

const seriesStarted = (series: Series): boolean =>
  overallRatingValue(series) > 0 ||
  (series.seasons ?? []).some((season) => (season.episodes ?? []).some(isEpisodeWatched));

export function useInterestSuggestions(enabled = true): {
  loading: boolean;
  suggestions: InterestSuggestion[];
} {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [tagMap, setTagMap] = useState<InterestTagMap | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void fetchStaticInterestTags().then((map) => {
      if (!cancelled) setTagMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const suggestions = useMemo(() => {
    if (!tagMap) return [];
    return suggestInterests(
      {
        series: allSeriesList.filter(seriesStarted).map((s) => s.id),
        movies: movieList.filter(isMovieWatched).map((m) => m.id),
      },
      tagMap
    );
  }, [tagMap, allSeriesList, movieList]);

  return { loading: enabled && tagMap === undefined, suggestions };
}
