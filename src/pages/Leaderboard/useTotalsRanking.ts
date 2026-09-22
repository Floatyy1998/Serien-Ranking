/**
 * Gesamtwertung der Rangliste: vergleicht die lebenslangen Zahlen der Freunde.
 *
 * Der eigene Wert wird live aus den geladenen Listen gerechnet (identisch zur
 * Statistik-Seite), die der Freunde kommen aus ihrem veroeffentlichten
 * Schnappschuss. Wer noch keinen hat, wird nicht mit 0 einsortiert, sondern
 * gezaehlt und unter der Liste ausgewiesen.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { computeLibraryTotals } from '../../lib/stats/libraryTotals';
import { t } from '../../services/i18n';
import {
  fetchLeaderboardData,
  fetchLeaderboardProfiles,
} from '../../services/social/leaderboardService';
import { fetchLibraryTotals } from '../../services/social/userTotalsService';
import type {
  LeaderboardEntry,
  LeaderboardStats,
  LeaderboardTotals,
  TotalsCategory,
} from '../../types/Leaderboard';

interface Profile {
  displayName: string;
  photoURL?: string;
  username?: string;
}

export interface TotalsRanking {
  entries: LeaderboardEntry[];
  /** Freunde ohne veroeffentlichten Schnappschuss. */
  missing: number;
  loading: boolean;
}

/** Die Streak steht im Monatsknoten, alles andere im Gesamt-Schnappschuss. */
export function totalsValue(
  category: TotalsCategory,
  totals: LeaderboardTotals | null,
  stats: LeaderboardStats | undefined
): number | null {
  if (category === 'streakAllTime') return stats?.streakAllTime ?? null;
  if (!totals) return null;
  return totals[category] ?? 0;
}

export function useTotalsRanking(
  active: boolean,
  userId: string | undefined,
  friendUids: string[],
  category: TotalsCategory
): TotalsRanking {
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [totalsData, setTotalsData] = useState<Record<string, LeaderboardTotals | null>>({});
  const [statsData, setStatsData] = useState<Record<string, LeaderboardStats>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  // Freunde-UIDs als stabiler Schluessel: das Array ist bei jedem Render neu.
  const friendKey = friendUids.join(',');

  const load = useCallback(async () => {
    if (!userId) return;
    const uids = friendKey ? friendKey.split(',') : [];
    setLoading(true);
    try {
      const [totals, stats, profileMap] = await Promise.all([
        fetchLibraryTotals(uids),
        fetchLeaderboardData(userId, uids),
        fetchLeaderboardProfiles([userId, ...uids]),
      ]);
      setTotalsData(totals);
      setStatsData(stats);
      setProfiles(profileMap);
    } catch (error) {
      console.error('[Leaderboard] Gesamtwertung nicht geladen:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, friendKey]);

  useEffect(() => {
    if (!active) return;
    load();
  }, [active, load]);

  const ownTotals = useMemo(
    () => computeLibraryTotals(allSeriesList, movieList),
    [allSeriesList, movieList]
  );

  return useMemo(() => {
    if (!userId) return { entries: [], missing: 0, loading: false };

    const own: LeaderboardTotals = {
      watchtimeMinutes: Math.round(ownTotals.watchtimeMinutes),
      episodes: ownTotals.episodes,
      seriesStarted: ownTotals.seriesStarted,
      seriesCompleted: ownTotals.seriesCompleted,
      movies: ownTotals.movies,
      // Der eigene Wert ist immer live — ein Zeitstempel hat hier keine Aussage.
      updatedAt: 0,
      v: 1,
    };

    const uids = friendKey ? friendKey.split(',') : [];
    const entries: LeaderboardEntry[] = [];
    let missing = 0;

    for (const uid of [userId, ...uids]) {
      const isCurrentUser = uid === userId;
      const totals = isCurrentUser ? own : (totalsData[uid] ?? null);
      const value = totalsValue(category, totals, statsData[uid]);

      if (value === null) {
        missing++;
        continue;
      }

      const rawName = profiles[uid]?.displayName;
      entries.push({
        uid,
        displayName:
          typeof rawName === 'string' && rawName.trim().length > 0 ? rawName : t('Unbekannt'),
        photoURL: profiles[uid]?.photoURL,
        username: profiles[uid]?.username,
        value,
        rank: 0,
        isCurrentUser,
        detail: category === 'seriesStarted' ? (totals?.seriesCompleted ?? undefined) : undefined,
      });
    }

    entries.sort((a, b) => b.value - a.value);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return { entries, missing, loading };
  }, [userId, friendKey, totalsData, statsData, profiles, ownTotals, category, loading]);
}
