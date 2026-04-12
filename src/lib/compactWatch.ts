/**
 * Compact Watch Format – Utility-Funktionen
 *
 * Kompaktformat pro Season:
 *   { w: [1,1,0,...], c: [10,5,0,...], f: [unix,...], l: [unix,...] }
 *
 * Felder:
 *   w: watched (0/1 pro Episode)
 *   c: watchCount pro Episode
 *   f: firstWatchedAt als Unix-Seconds (0 = nicht gesetzt)
 *   l: lastWatchedAt als Unix-Seconds (0 = nicht gesetzt)
 *
 * Firebase-Pfade fuer atomare Writes:
 *   seriesWatch/{sid}/seasons/{s}/w/{episodeIdx} = 1
 *   seriesWatch/{sid}/seasons/{s}/c/{episodeIdx} = count
 *   seriesWatch/{sid}/seasons/{s}/f/{episodeIdx} = unixSeconds
 *   seriesWatch/{sid}/seasons/{s}/l/{episodeIdx} = unixSeconds
 */

// ---------- Types ----------

export interface CompactSeason {
  w: number[]; // 0/1 per episode
  c: number[]; // watchCount per episode
  f?: number[]; // firstWatchedAt unix seconds (0 = not set)
  l?: number[]; // lastWatchedAt unix seconds (0 = not set)
}

export interface EpisodeWatch {
  watched: boolean;
  watchCount: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
}

// ---------- Format Detection ----------

/** Prüft ob Season-Daten im neuen Kompaktformat sind (hat `w` Array). */
export function isCompactSeason(season: unknown): season is CompactSeason {
  return (
    season != null &&
    typeof season === 'object' &&
    'w' in (season as Record<string, unknown>) &&
    Array.isArray((season as CompactSeason).w)
  );
}

// ---------- Read Helpers ----------

/** Liest Episode-Watch-Daten aus einer Compact-Season. */
export function readEpisodeFromCompact(season: CompactSeason, episodeIdx: number): EpisodeWatch {
  return {
    watched: (season.w?.[episodeIdx] ?? 0) === 1,
    watchCount: season.c?.[episodeIdx] ?? 0,
    firstWatchedAt: unixToIso(season.f?.[episodeIdx]),
    lastWatchedAt: unixToIso(season.l?.[episodeIdx]),
  };
}

// ---------- Write Helpers ----------

/**
 * Erzeugt Firebase Multi-Path-Updates fuer einen Episode-Watched-Event.
 * Kein Read noetig – einzelne Array-Indizes werden direkt gesetzt.
 *
 * @returns Record<string, unknown> mit Pfaden relativ zum DB-Root
 */
export function buildEpisodeWatchedUpdates(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeIndex: number,
  newWatchCount: number,
  nowIso: string,
  isFirstWatch: boolean
): Record<string, unknown> {
  const base = `users/${uid}/seriesWatch/${seriesId}/seasons/${seasonIndex}`;
  const updates: Record<string, unknown> = {
    [`${base}/w/${episodeIndex}`]: 1,
    [`${base}/c/${episodeIndex}`]: newWatchCount,
    [`${base}/l/${episodeIndex}`]: isoToUnix(nowIso),
    [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
  };
  if (isFirstWatch) {
    updates[`${base}/f/${episodeIndex}`] = isoToUnix(nowIso);
  }
  return updates;
}

/**
 * Erzeugt Firebase Multi-Path-Updates fuer Episode-Unwatch (Revert).
 */
export function buildEpisodeUnwatchUpdates(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeIndex: number,
  previousWatched: boolean,
  previousCount: number,
  previousFirstWatchedAt: string | null,
  previousLastWatchedAt: string | null
): Record<string, unknown> {
  const base = `users/${uid}/seriesWatch/${seriesId}/seasons/${seasonIndex}`;
  return {
    [`${base}/w/${episodeIndex}`]: previousWatched ? 1 : 0,
    [`${base}/c/${episodeIndex}`]: previousCount,
    [`${base}/f/${episodeIndex}`]: previousFirstWatchedAt ? isoToUnix(previousFirstWatchedAt) : 0,
    [`${base}/l/${episodeIndex}`]: previousLastWatchedAt ? isoToUnix(previousLastWatchedAt) : 0,
    [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
  };
}

// ---------- Conversion Helpers ----------

export function isoToUnix(iso: string | undefined | null): number {
  if (!iso) return 0;
  const ts = Math.floor(new Date(iso).getTime() / 1000);
  return isNaN(ts) ? 0 : ts;
}

export function unixToIso(unix: number | undefined | null): string | undefined {
  if (!unix || unix === 0) return undefined;
  return new Date(unix * 1000).toISOString();
}
