/**
 * Eigener Platz in der Gesamt-Watchtime unter den Freunden — die Einordnung,
 * die auf der Statistik-Seite neben der eigenen Zahl fehlt.
 *
 * Freunde ohne veroeffentlichten Schnappschuss zaehlen nicht mit, sonst
 * behauptet die Zeile einen Platz, den es so nicht gibt.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { computeLibraryTotals } from '../../lib/stats/libraryTotals';
import { fetchLibraryTotals } from '../../services/social/userTotalsService';

export interface FriendTotalsRank {
  /** Eigener Platz (1-basiert) oder null, wenn es nichts zu vergleichen gibt. */
  rank: number | null;
  /** Verglichene Personen inklusive einem selbst. */
  of: number;
}

export const useFriendTotalsRank = (): FriendTotalsRank => {
  const { user } = useAuth() || {};
  const { friends } = useOptimizedFriends();
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [friendMinutes, setFriendMinutes] = useState<number[]>([]);

  const friendKey = friends.map((f) => f.uid).join(',');

  useEffect(() => {
    if (!user?.uid || !friendKey) {
      setFriendMinutes([]);
      return;
    }
    let cancelled = false;

    fetchLibraryTotals(friendKey.split(','))
      .then((map) => {
        if (cancelled) return;
        setFriendMinutes(
          Object.values(map)
            .filter((totals) => totals !== null)
            .map((totals) => totals.watchtimeMinutes)
        );
      })
      .catch(() => {
        if (!cancelled) setFriendMinutes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, friendKey]);

  const ownMinutes = useMemo(
    () => computeLibraryTotals(allSeriesList, movieList).watchtimeMinutes,
    [allSeriesList, movieList]
  );

  return useMemo(() => {
    if (friendMinutes.length === 0) return { rank: null, of: 0 };
    const ahead = friendMinutes.filter((minutes) => minutes > ownMinutes).length;
    return { rank: ahead + 1, of: friendMinutes.length + 1 };
  }, [friendMinutes, ownMinutes]);
};
