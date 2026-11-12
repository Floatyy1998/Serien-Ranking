import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
import { getImageUrl } from '../../utils/imageUrl';

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

export interface InterestExample {
  title: string;
  poster?: string;
  backdrop?: string;
}

export function useInterestSuggestions(enabled = true): {
  loading: boolean;
  suggestions: InterestSuggestion[];
  examples: Record<string, InterestExample>;
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

  const { suggestions, examples } = useMemo(() => {
    if (!tagMap) return { suggestions: [], examples: {} };
    const series = allSeriesList.filter(seriesStarted);
    const movies = movieList.filter(isMovieWatched);
    const found: Record<string, InterestExample> = {};
    for (const [items, map] of [
      [series, tagMap.series],
      [movies, tagMap.movies],
    ] as const) {
      for (const item of items) {
        for (const tag of map[String(item.id)] ?? []) {
          if (found[tag]?.backdrop) continue;
          found[tag] = {
            title: item.title,
            poster: getImageUrl(item.poster, 'w342', '') || undefined,
            backdrop: getImageUrl(item.backdrop, 'w780', '') || undefined,
          };
        }
      }
    }
    return {
      suggestions: suggestInterests(
        { series: series.map((s) => s.id), movies: movies.map((m) => m.id) },
        tagMap
      ),
      examples: found,
    };
  }, [tagMap, allSeriesList, movieList]);

  return { loading: enabled && tagMap === undefined, suggestions, examples };
}

const DISMISS_KEY = 'interestsHintDismissed';

const readDismissed = (uid: string | undefined): boolean => {
  if (!uid) return true;
  try {
    return localStorage.getItem(`${DISMISS_KEY}:${uid}`) === '1';
  } catch {
    return false;
  }
};

/** Startseiten-Hinweis: nur ohne eigene Interessen und mit mindestens zwei Vorschlägen. */
export function useInterestsHint(): {
  uid: string | undefined;
  suggestions: InterestSuggestion[];
  examples: Record<string, InterestExample>;
  dismiss: () => void;
} {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const saved = useOwnInterests(uid);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const dismissed = dismissedFor === uid || readDismissed(uid);
  const eligible = !!uid && saved !== null && saved.length === 0 && !dismissed;
  const { suggestions, examples } = useInterestSuggestions(eligible);

  const dismiss = () => {
    if (!uid) return;
    try {
      localStorage.setItem(`${DISMISS_KEY}:${uid}`, '1');
    } catch {
      // ignore
    }
    setDismissedFor(uid);
  };

  return {
    uid,
    suggestions: eligible && suggestions.length >= 2 ? suggestions.slice(0, 6) : [],
    examples,
    dismiss,
  };
}
