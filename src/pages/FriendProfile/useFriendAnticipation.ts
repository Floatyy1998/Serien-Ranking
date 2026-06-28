import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchStaticCatalogSeries,
  fetchStaticCatalogSeasons,
  fetchStaticCatalogSeasonsBulk,
} from '../../lib/staticCatalog';
import { useSeriesList } from '../../contexts/SeriesListContext';
import type { CatalogSeason, CatalogSeries } from '../../types/CatalogTypes';

// No hard horizon — we want the SOONEST upcoming episodes regardless of how
// far out they are. Sorted by air date ascending, the top MAX_RESULTS are
// shown. If everything is years away, the user still gets a useful answer.
const MAX_RESULTS = 6;

export interface FriendAnticipationItem {
  seriesId: number;
  title: string;
  poster: string;
  airDate: string;
  daysUntil: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  bothWaiting: boolean;
}

interface UserSeriesEntry {
  watchlist?: boolean;
}

function parseAirDate(d: string | null | undefined): number | null {
  if (!d) return null;
  const ts = Date.parse(d);
  return isNaN(ts) ? null : ts;
}

interface RawEpisode {
  air_date?: string | null;
  airDate?: string | null;
  airstamp?: string | null;
  name?: string;
  season_number?: number;
  seasonNumber?: number;
  episode_number?: number;
  episodeNumber?: number;
}

interface RawSeason {
  season_number?: number;
  seasonNumber?: number;
  episodes?: RawEpisode[];
}

function findNextUpcoming(
  seasons: Record<string, CatalogSeason> | null,
  nowMs: number
): { airDate: string; seasonNumber: number; episodeNumber: number; title: string } | null {
  if (!seasons) return null;
  let best: {
    airDate: string;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    ts: number;
  } | null = null;
  // Backend writes TMDB raw shape (`air_date`, `season_number`) but the
  // TypeScript types optimistically claim camelCase. Read both.
  for (const rawSeason of Object.values(seasons) as unknown as RawSeason[]) {
    if (!rawSeason?.episodes) continue;
    const seasonNumber = rawSeason.seasonNumber ?? rawSeason.season_number ?? 0;
    for (const ep of rawSeason.episodes) {
      const dateStr = ep.air_date || ep.airDate || ep.airstamp || null;
      const ts = parseAirDate(dateStr);
      if (ts === null) continue;
      if (ts < nowMs) continue;
      if (!best || ts < best.ts) {
        best = {
          airDate: dateStr as string,
          seasonNumber: seasonNumber || ep.seasonNumber || ep.season_number || 0,
          episodeNumber: ep.episodeNumber ?? ep.episode_number ?? 0,
          title: ep.name || '',
          ts,
        };
      }
    }
  }
  return best;
}

export function useFriendAnticipation(friendUid: string | undefined): {
  loading: boolean;
  items: FriendAnticipationItem[];
} {
  const [watchlistIds, setWatchlistIds] = useState<number[] | null>(null);
  const [seriesCatalog, setSeriesCatalog] = useState<Record<string, CatalogSeries> | null>(null);
  const [seasonsByTmdb, setSeasonsByTmdb] = useState<Record<
    string,
    Record<string, CatalogSeason>
  > | null>(null);
  const { seriesList } = useSeriesList();

  useEffect(() => {
    if (!friendUid) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await firebase.database().ref(`users/${friendUid}/series`).once('value');
        if (cancelled) return;
        const data = (snap.val() ?? {}) as Record<string, UserSeriesEntry>;
        const allIds: number[] = [];
        const watchlistFlagged: number[] = [];
        for (const [tmdbId, entry] of Object.entries(data)) {
          const id = parseInt(tmdbId, 10);
          if (isNaN(id)) continue;
          allIds.push(id);
          if (entry?.watchlist === true) watchlistFlagged.push(id);
        }
        const sample = Object.entries(data).slice(0, 3).map(([id, entry]) => ({
          id,
          keys: entry ? Object.keys(entry) : null,
          watchlist: entry?.watchlist,
        }));
        console.log(
          `[FriendAnticipation] friend=${friendUid} total=${allIds.length} watchlist=${watchlistFlagged.length}`,
          sample
        );
        // Fallback: if watchlist flag is never set we still want a sensible scope.
        // Pick all series the friend has tracked — upcoming-episode filter (≤90d)
        // narrows that down anyway.
        setWatchlistIds(watchlistFlagged.length > 0 ? watchlistFlagged : allIds);
      } catch (err) {
        console.error('[useFriendAnticipation] watchlist fetch failed', err);
        if (!cancelled) setWatchlistIds([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [friendUid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [series, bulk] = await Promise.all([
        fetchStaticCatalogSeries(),
        fetchStaticCatalogSeasonsBulk(),
      ]);
      if (cancelled) return;
      setSeriesCatalog(series);
      if (bulk) setSeasonsByTmdb(bulk);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (seasonsByTmdb || !watchlistIds || watchlistIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const results: Record<string, Record<string, CatalogSeason>> = {};
      const settled = await Promise.allSettled(
        watchlistIds.map((id) => fetchStaticCatalogSeasons(id))
      );
      if (cancelled) return;
      settled.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          results[String(watchlistIds[idx])] = r.value;
        }
      });
      setSeasonsByTmdb(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [watchlistIds, seasonsByTmdb]);

  const ownWatchlistIds = useMemo(() => {
    const set = new Set<number>();
    for (const s of seriesList) {
      if (s.watchlist) set.add(s.id);
    }
    return set;
  }, [seriesList]);

  const items = useMemo<FriendAnticipationItem[]>(() => {
    if (!watchlistIds || !seriesCatalog || !seasonsByTmdb) return [];
    const now = Date.now();
    const collected: FriendAnticipationItem[] = [];
    let seasonsMissing = 0;
    let noUpcoming = 0;

    for (const id of watchlistIds) {
      const seasons = seasonsByTmdb[String(id)] ?? null;
      if (!seasons) {
        seasonsMissing += 1;
        continue;
      }
      const next = findNextUpcoming(seasons, now);
      if (!next) {
        noUpcoming += 1;
        continue;
      }
      const catalog = seriesCatalog[String(id)];
      if (!catalog) continue;
      collected.push({
        seriesId: id,
        title: catalog.title,
        poster: catalog.poster || '',
        airDate: next.airDate,
        daysUntil: Math.ceil((Date.parse(next.airDate) - now) / (1000 * 60 * 60 * 24)),
        seasonNumber: next.seasonNumber,
        episodeNumber: next.episodeNumber,
        episodeTitle: next.title,
        bothWaiting: ownWatchlistIds.has(id),
      });
    }

    console.log(
      `[FriendAnticipation] scanned=${watchlistIds.length} seasonsMissing=${seasonsMissing} noUpcoming=${noUpcoming} matched=${collected.length}`,
      collected.slice(0, 3).map((c) => ({ id: c.seriesId, title: c.title, days: c.daysUntil }))
    );

    collected.sort((a, b) => Date.parse(a.airDate) - Date.parse(b.airDate));
    return collected.slice(0, MAX_RESULTS);
  }, [watchlistIds, seriesCatalog, seasonsByTmdb, ownWatchlistIds]);

  const loading =
    watchlistIds === null || seriesCatalog === null || (watchlistIds.length > 0 && seasonsByTmdb === null);

  return { loading, items };
}
