import { dbGet, paths } from '../../../services/db/ref';
import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import {
  analyzeFriendWatch,
  buildSeasonMaps,
  type EpPosition,
  type SeriesWatchSnap,
} from '../../../lib/series/friendWatchProgress';
import type { Series } from '../../../types/Series';

export interface FriendSeriesProgress {
  uid: string;
  displayName: string;
  photoURL?: string;
  watched: number;
  percentage: number;
  latestSeason: number | null;
  latestEpisode: number | null;
  hasStarted: boolean;
  completed: boolean;
}

/**
 * Loads each friend's progress for a given series in parallel.
 * Returns only friends who have watched at least one episode, sorted
 * descending by progress.
 */
interface RawFriendResult {
  watched: number;
  latest: EpPosition | null;
}

export function useFriendsSeriesProgress(
  seriesId: number | undefined,
  totalEpisodes: number,
  seasons: Series['seasons'] | null | undefined
): { loading: boolean; entries: FriendSeriesProgress[] } {
  const { friends: alleFreunde, grantedToMe } = useOptimizedFriends();
  // Seit der Freigabe-Pflicht zaehlen nur Freunde, die Einblick gegeben haben.
  // Schluessel statt Set-Identitaet: ein frisch gebautes Set bei jedem Render
  // wuerde die abhaengigen Effekte endlos neu ausloesen.
  const grantedKey = [...grantedToMe].sort().join(',');
  const friends = useMemo(
    () => alleFreunde.filter((friend) => grantedToMe.has(friend.uid)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alleFreunde, grantedKey]
  );
  const [rawByUid, setRawByUid] = useState<Record<string, RawFriendResult> | null>(null);

  const maps = useMemo(() => buildSeasonMaps(seasons), [seasons]);

  useEffect(() => {
    if (!seriesId || friends.length === 0) {
      setRawByUid({});
      return;
    }
    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        friends.map(async (f) => {
          try {
            const analyzed = analyzeFriendWatch(
              await dbGet<SeriesWatchSnap>(paths.seriesWatchItem(f.uid, seriesId)),
              maps
            );
            return [f.uid, analyzed] as const;
          } catch (err) {
            console.error(`[FriendsSeriesProgress] read failed for ${f.uid}`, err);
            return [f.uid, { watched: 0, latest: null } as RawFriendResult] as const;
          }
        })
      );
      if (cancelled) return;
      const map: Record<string, RawFriendResult> = {};
      for (const [uid, analyzed] of results) map[uid] = analyzed;
      setRawByUid(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [friends, seriesId, maps]);

  const entries = useMemo<FriendSeriesProgress[]>(() => {
    if (!rawByUid) return [];
    const list: FriendSeriesProgress[] = [];
    for (const friend of friends) {
      const raw = rawByUid[friend.uid];
      if (!raw || raw.watched === 0) continue;
      const percentage =
        totalEpisodes > 0 ? Math.min(100, Math.round((raw.watched / totalEpisodes) * 100)) : 0;
      list.push({
        uid: friend.uid,
        displayName: friend.displayName || friend.username || 'Friend',
        photoURL: friend.photoURL,
        watched: raw.watched,
        percentage,
        latestSeason: raw.latest?.seasonNumber ?? null,
        latestEpisode: raw.latest?.episodeNumber ?? null,
        hasStarted: raw.watched > 0,
        completed: totalEpisodes > 0 && raw.watched >= totalEpisodes,
      });
    }
    list.sort((a, b) => b.percentage - a.percentage || b.watched - a.watched);
    return list;
  }, [friends, rawByUid, totalEpisodes]);

  return { loading: rawByUid === null, entries };
}
