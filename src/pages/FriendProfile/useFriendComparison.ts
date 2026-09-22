/**
 * Gesamtzahlen fuer den direkten Vergleich mit einem Freund.
 *
 * Der eigene Wert wird live aus den geladenen Listen gerechnet (identisch zur
 * Statistik-Seite), der des Freundes kommt aus seinem veroeffentlichten
 * Schnappschuss unter `users/$uid/leaderboard/totals`. Beides sind aggregierte
 * Zahlen — sie haengen bewusst nicht an der Freigabe, die die Titel schuetzt.
 */

import { useEffect, useMemo, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { computeLibraryTotals } from '../../lib/stats/libraryTotals';
import { fetchLibraryTotals } from '../../services/social/userTotalsService';
import type { LeaderboardTotals } from '../../types/Leaderboard';

export interface ComparisonTotals {
  watchtimeMinutes: number;
  seriesStarted: number;
  seriesCompleted: number;
  movies: number;
  episodes: number;
}

export interface FriendComparison {
  own: ComparisonTotals;
  friend: ComparisonTotals | null;
  loading: boolean;
}

const toComparison = (totals: LeaderboardTotals): ComparisonTotals => ({
  watchtimeMinutes: totals.watchtimeMinutes,
  seriesStarted: totals.seriesStarted,
  seriesCompleted: totals.seriesCompleted,
  movies: totals.movies,
  episodes: totals.episodes,
});

export const useFriendComparison = (friendId: string | undefined): FriendComparison => {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [friend, setFriend] = useState<ComparisonTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!friendId) return;
    let cancelled = false;

    setLoading(true);
    setFriend(null);
    fetchLibraryTotals([friendId])
      .then((map) => {
        if (cancelled) return;
        const totals = map[friendId];
        setFriend(totals ? toComparison(totals) : null);
      })
      .catch(() => {
        if (!cancelled) setFriend(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [friendId]);

  const own = useMemo(() => {
    const totals = computeLibraryTotals(allSeriesList, movieList);
    return {
      watchtimeMinutes: Math.round(totals.watchtimeMinutes),
      seriesStarted: totals.seriesStarted,
      seriesCompleted: totals.seriesCompleted,
      movies: totals.movies,
      episodes: totals.episodes,
    };
  }, [allSeriesList, movieList]);

  return useMemo(() => ({ own, friend, loading }), [own, friend, loading]);
};
