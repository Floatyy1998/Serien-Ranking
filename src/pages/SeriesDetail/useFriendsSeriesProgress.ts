import { dbGet, paths } from '../../services/db/ref';
import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import type { Series } from '../../types/Series';

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

interface SeriesWatchSnap {
  seasons?: Record<string, SeasonWatch | null>;
}

interface SeasonWatch {
  eps?: Record<string, { w?: number }>;
  w?: number[];
}

interface EpPosition {
  seasonNumber: number;
  episodeNumber: number;
  absIndex: number;
}

/**
 * Build maps:
 *  - epIdToPos: TMDB episode-id → its position (used by the compact {eps} format)
 *  - seasonNumberArrPositions: season-key → [{s, e, absIndex}] sorted, indexed
 *    by within-season order (used by the legacy {w[]} array format)
 */
function buildSeasonMaps(seasons: Series['seasons'] | null | undefined): {
  epIdToPos: Map<number, EpPosition>;
  seasonArrayPositions: Map<string, EpPosition[]>;
} {
  const epIdToPos = new Map<number, EpPosition>();
  const seasonArrayPositions = new Map<string, EpPosition[]>();
  if (!seasons) return { epIdToPos, seasonArrayPositions };
  let absIndex = 0;
  for (const season of seasons) {
    if (!season?.episodes) continue;
    const sn = (season.seasonNumber ?? 0) + 1;
    const arr: EpPosition[] = [];
    season.episodes.forEach((ep, idx) => {
      absIndex += 1;
      const pos: EpPosition = {
        seasonNumber: sn,
        episodeNumber: idx + 1,
        absIndex,
      };
      arr.push(pos);
      if (typeof ep?.id === 'number') epIdToPos.set(ep.id, pos);
    });
    seasonArrayPositions.set(String(season.seasonNumber ?? 0), arr);
  }
  return { epIdToPos, seasonArrayPositions };
}

/**
 * Walk a friend's seriesWatch snapshot, counting watched episodes AND tracking
 * the most-advanced one (latest by season×episode order). Supports both compact
 * ({eps} keyed by episode-id) and legacy ({w[]} indexed by position).
 */
function analyzeFriendWatch(
  data: SeriesWatchSnap | null,
  epIdToPos: Map<number, EpPosition>,
  seasonArrayPositions: Map<string, EpPosition[]>
): { watched: number; latest: EpPosition | null } {
  if (!data?.seasons) return { watched: 0, latest: null };
  let watched = 0;
  let latest: EpPosition | null = null;
  const consider = (pos: EpPosition | undefined | null) => {
    if (!pos) return;
    if (!latest || pos.absIndex > latest.absIndex) latest = pos;
  };

  for (const [seasonKey, season] of Object.entries(data.seasons)) {
    if (!season) continue;
    if (season.eps && typeof season.eps === 'object') {
      for (const [epIdStr, ep] of Object.entries(season.eps)) {
        if (ep?.w !== 1) continue;
        watched += 1;
        const epId = parseInt(epIdStr, 10);
        if (!isNaN(epId)) consider(epIdToPos.get(epId));
      }
    } else if (Array.isArray(season.w)) {
      const positions = seasonArrayPositions.get(seasonKey);
      season.w.forEach((flag, idx) => {
        if (flag !== 1) return;
        watched += 1;
        if (positions && positions[idx]) consider(positions[idx]);
      });
    }
  }
  return { watched, latest };
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
  const { friends } = useOptimizedFriends();
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
              maps.epIdToPos,
              maps.seasonArrayPositions
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
