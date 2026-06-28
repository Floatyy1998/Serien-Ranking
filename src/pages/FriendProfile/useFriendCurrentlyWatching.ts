import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useMemo, useState } from 'react';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { fetchStaticCatalogSeries } from '../../lib/staticCatalog';
import { readEventUniversal } from '../../services/watchActivity/compactEvent';
import type { CatalogSeries } from '../../types/CatalogTypes';
import type { EpisodeWatchEvent } from '../../types/WatchActivity';

const LOOKBACK_DAYS = 14;

export type WatchingMood = 'binge' | 'active' | 'casual' | 'paused' | 'rewatch';

export interface FriendCurrentlyWatching {
  seriesId: number;
  title: string;
  poster: string;
  episodeCount: number;
  daysCovered: number;
  latestSeason: number;
  latestEpisode: number;
  latestWatchedAt: number;
  isRewatch: boolean;
  mood: WatchingMood;
  spoilerDiff: SpoilerDiff;
}

export interface SpoilerDiff {
  kind: 'equal' | 'friend-ahead' | 'user-ahead' | 'unknown' | 'rewatch';
  message: string;
  warning: boolean;
}

interface RawEpisodeEvent {
  type?: string;
  seriesId?: number;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  timestamp?: string;
  isRewatch?: boolean;
}

function computeMood(
  eventCount: number,
  hoursSinceLatest: number,
  isRewatch: boolean
): WatchingMood {
  if (isRewatch) return 'rewatch';
  if (hoursSinceLatest > 7 * 24) return 'paused';
  if (eventCount >= 5 && hoursSinceLatest <= 72) return 'binge';
  if (hoursSinceLatest <= 48) return 'active';
  return 'casual';
}

function computeSpoilerDiff(
  friendSeason: number,
  friendEpisode: number,
  userLast: { season: number; episode: number } | null
): SpoilerDiff {
  if (!userLast) {
    return {
      kind: 'unknown',
      message: 'Noch nicht angeschaut',
      warning: friendSeason > 1 || friendEpisode > 1,
    };
  }
  if (friendSeason === userLast.season && friendEpisode === userLast.episode) {
    return { kind: 'equal', message: 'Ihr seid gleichauf 🎉', warning: false };
  }
  if (friendSeason > userLast.season) {
    const seasonDiff = friendSeason - userLast.season;
    return {
      kind: 'friend-ahead',
      message: `${seasonDiff} Staffel${seasonDiff > 1 ? 'n' : ''} voraus — Spoiler-Alarm`,
      warning: true,
    };
  }
  if (friendSeason === userLast.season && friendEpisode > userLast.episode) {
    const diff = friendEpisode - userLast.episode;
    return {
      kind: 'friend-ahead',
      message: `${diff} Folge${diff > 1 ? 'n' : ''} voraus`,
      warning: diff >= 2,
    };
  }
  if (friendSeason < userLast.season) {
    const seasonDiff = userLast.season - friendSeason;
    return {
      kind: 'user-ahead',
      message: `Du bist ${seasonDiff} Staffel${seasonDiff > 1 ? 'n' : ''} voraus`,
      warning: false,
    };
  }
  const diff = userLast.episode - friendEpisode;
  return {
    kind: 'user-ahead',
    message: `Du bist ${diff} Folge${diff > 1 ? 'n' : ''} voraus`,
    warning: false,
  };
}

function findUserLastWatched(
  series: ReturnType<typeof useSeriesList>['seriesList'][number] | undefined
): { season: number; episode: number } | null {
  if (!series?.seasons) return null;
  let lastSeason = 0;
  let lastEpisode = 0;
  for (let s = 0; s < series.seasons.length; s++) {
    const season = series.seasons[s];
    if (!season?.episodes) continue;
    for (let e = 0; e < season.episodes.length; e++) {
      if (season.episodes[e]?.watched) {
        lastSeason = (season.seasonNumber ?? s) + 1;
        lastEpisode = e + 1;
      }
    }
  }
  if (lastSeason === 0 && lastEpisode === 0) return null;
  return { season: lastSeason, episode: lastEpisode };
}

export function useFriendCurrentlyWatching(friendUid: string | undefined): {
  loading: boolean;
  data: FriendCurrentlyWatching | null;
} {
  const [events, setEvents] = useState<RawEpisodeEvent[] | null>(null);
  const [catalog, setCatalog] = useState<Record<string, CatalogSeries> | null>(null);
  // `nowMs` is captured when events land, then frozen — keeping the relative
  // "X hours ago" stable across re-renders. Pure-function lint enforces that
  // Date.now() not be called during render.
  const [nowMs, setNowMs] = useState<number>(0);
  const { seriesList } = useSeriesList();

  useEffect(() => {
    if (!friendUid) return;
    let cancelled = false;
    const year = new Date().getFullYear();
    const cutoffMs = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
    const cutoffUnixSec = Math.floor(cutoffMs / 1000);

    (async () => {
      try {
        // Events use compact format: `ts` (unix seconds) instead of `timestamp`,
        // and `t: "ep"` instead of `type: "episode_watch"`. Sort by `ts` so the
        // query is index-friendly; readEventUniversal expands each event to the
        // legacy shape so downstream code can rely on `type`, `seriesId`, etc.
        const snap = await firebase
          .database()
          .ref(`users/${friendUid}/wrapped/${year}/events`)
          .orderByChild('ts')
          .startAt(cutoffUnixSec)
          .limitToLast(200)
          .once('value');
        if (cancelled) return;
        const raw = (snap.val() ?? {}) as Record<string, unknown>;
        const expanded = Object.values(raw).map((ev) => readEventUniversal(ev));
        setNowMs(Date.now());
        setEvents(expanded as RawEpisodeEvent[]);
      } catch (err) {
        console.error('[useFriendCurrentlyWatching] events fetch failed', err);
        if (!cancelled) {
          setNowMs(Date.now());
          setEvents([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [friendUid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await fetchStaticCatalogSeries();
      if (!cancelled) setCatalog(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = useMemo<FriendCurrentlyWatching | null>(() => {
    if (!events || !catalog) return null;
    const episodeEvents = events.filter(
      (e): e is EpisodeWatchEvent & { timestamp: string } =>
        e?.type === 'episode_watch' && typeof e.seriesId === 'number' && !!e.timestamp
    );
    if (episodeEvents.length === 0) return null;

    const byId = new Map<
      number,
      {
        count: number;
        rewatchCount: number;
        latestTs: number;
        latestSeason: number;
        latestEpisode: number;
        latestIsRewatch: boolean;
        earliestTs: number;
        title: string;
      }
    >();
    for (const ev of episodeEvents) {
      const ts = Date.parse(ev.timestamp);
      if (isNaN(ts)) continue;
      const id = ev.seriesId as number;
      const evIsRewatch = ev.isRewatch === true;
      const prev = byId.get(id);
      if (!prev) {
        byId.set(id, {
          count: 1,
          rewatchCount: evIsRewatch ? 1 : 0,
          latestTs: ts,
          latestSeason: ev.seasonNumber ?? 0,
          latestEpisode: ev.episodeNumber ?? 0,
          latestIsRewatch: evIsRewatch,
          earliestTs: ts,
          title: ev.seriesTitle ?? '',
        });
      } else {
        prev.count += 1;
        if (evIsRewatch) prev.rewatchCount += 1;
        if (ts > prev.latestTs) {
          prev.latestTs = ts;
          prev.latestSeason = ev.seasonNumber ?? prev.latestSeason;
          prev.latestEpisode = ev.episodeNumber ?? prev.latestEpisode;
          prev.latestIsRewatch = evIsRewatch;
        }
        if (ts < prev.earliestTs) prev.earliestTs = ts;
      }
    }
    if (byId.size === 0) return null;

    let bestId = -1;
    let bestEntry: ReturnType<typeof byId.get> | undefined;
    for (const [id, entry] of byId.entries()) {
      if (!bestEntry) {
        bestId = id;
        bestEntry = entry;
        continue;
      }
      if (
        entry.count > bestEntry.count ||
        (entry.count === bestEntry.count && entry.latestTs > bestEntry.latestTs)
      ) {
        bestId = id;
        bestEntry = entry;
      }
    }
    if (!bestEntry || bestId < 0) return null;

    const catalogEntry = catalog[String(bestId)];
    const title = catalogEntry?.title || bestEntry.title || 'Unbekannte Serie';
    const poster = catalogEntry?.poster || '';

    const hoursSinceLatest = (nowMs - bestEntry.latestTs) / (1000 * 60 * 60);
    const daysCovered = Math.max(
      1,
      Math.round((bestEntry.latestTs - bestEntry.earliestTs) / (1000 * 60 * 60 * 24)) + 1
    );

    // A series is treated as a rewatch session when either the latest event
    // is flagged as rewatch, OR the majority of the recent events in this
    // window are rewatches. Spoiler diff against the user's own progress
    // doesn't make sense in that case — the friend has already seen the show.
    const isRewatchSession =
      bestEntry.latestIsRewatch || bestEntry.rewatchCount * 2 >= bestEntry.count;

    const ownSeries = seriesList.find((s) => s.id === bestId);
    const userLast = findUserLastWatched(ownSeries);
    const spoilerDiff: SpoilerDiff = isRewatchSession
      ? { kind: 'rewatch', message: 'Rewatch — kein Spoiler-Risiko', warning: false }
      : computeSpoilerDiff(bestEntry.latestSeason, bestEntry.latestEpisode, userLast);

    return {
      seriesId: bestId,
      title,
      poster,
      episodeCount: bestEntry.count,
      daysCovered,
      latestSeason: bestEntry.latestSeason,
      latestEpisode: bestEntry.latestEpisode,
      latestWatchedAt: bestEntry.latestTs,
      isRewatch: isRewatchSession,
      mood: computeMood(bestEntry.count, hoursSinceLatest, isRewatchSession),
      spoilerDiff,
    };
  }, [events, catalog, seriesList, nowMs]);

  return { loading: events === null || catalog === null, data };
}
