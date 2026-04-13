/**
 * Compact Watch Format – Utility-Funktionen
 *
 * Aktuelles Format (ID-basiert, ab April 2026):
 *   seriesWatch/{sid}/seasons/{sn}/eps/{epId}: { w, c, f, l }
 *
 * Vorheriges Format (Index-basiert, wird noch gelesen fuer Abwaertskompat.
 * waehrend Migration):
 *   seriesWatch/{sid}/seasons/{sn}: {
 *     w: [1,1,0,...],    // by index
 *     c: [10,5,0,...],
 *     f: [unix,...],
 *     l: [unix,...]
 *   }
 *
 * Felder pro Episode:
 *   w: watched (0/1)
 *   c: watchCount
 *   f: firstWatchedAt als Unix-Seconds (0/fehlend = nicht gesetzt)
 *   l: lastWatchedAt als Unix-Seconds (0/fehlend = nicht gesetzt)
 */

// ---------- Types ----------

export interface EpisodeWatchEntry {
  w?: number; // 0 or 1
  c?: number;
  f?: number;
  l?: number;
}

export interface EpidSeason {
  eps: Record<string, EpisodeWatchEntry>;
}

/** Legacy Kompaktformat (Index-basierte Arrays). Wird nur noch gelesen. */
export interface LegacyArraySeason {
  w: number[];
  c: number[];
  f?: number[];
  l?: number[];
}

export interface EpisodeWatch {
  watched: boolean;
  watchCount: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
}

// ---------- Format Detection ----------

/** Prueft ob Season-Daten im ID-basierten Format sind (hat `eps` Map). */
export function isEpidSeason(season: unknown): season is EpidSeason {
  return (
    season != null &&
    typeof season === 'object' &&
    'eps' in (season as Record<string, unknown>) &&
    typeof (season as EpidSeason).eps === 'object'
  );
}

/** Prueft ob Season-Daten im alten Array-Format sind (hat `w` Array). */
export function isLegacyArraySeason(season: unknown): season is LegacyArraySeason {
  return (
    season != null &&
    typeof season === 'object' &&
    'w' in (season as Record<string, unknown>) &&
    Array.isArray((season as LegacyArraySeason).w)
  );
}

// ---------- Read Helpers ----------

/** Liest Episode-Watch-Daten aus einer ID-basierten Season. */
export function readEpisodeById(
  season: EpidSeason | null | undefined,
  episodeId: number | string
): EpisodeWatch {
  const entry = season?.eps?.[String(episodeId)];
  return {
    watched: (entry?.w ?? 0) === 1,
    watchCount: entry?.c ?? 0,
    firstWatchedAt: unixToIso(entry?.f),
    lastWatchedAt: unixToIso(entry?.l),
  };
}

/** Liest Episode-Watch-Daten aus altem Array-Format. Nur fuer Migration. */
export function readEpisodeFromLegacyArray(
  season: LegacyArraySeason,
  episodeIdx: number
): EpisodeWatch {
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
 * Key ist die Episode-ID (aus Catalog `episode.id`), nicht der Index.
 *
 * @returns Record<string, unknown> mit Pfaden relativ zum DB-Root
 */
export function buildEpisodeWatchedUpdates(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeId: number | string,
  newWatchCount: number,
  nowIso: string,
  isFirstWatch: boolean
): Record<string, unknown> {
  const base = `users/${uid}/seriesWatch/${seriesId}/seasons/${seasonIndex}/eps/${episodeId}`;
  const updates: Record<string, unknown> = {
    [`${base}/w`]: 1,
    [`${base}/c`]: newWatchCount,
    [`${base}/l`]: isoToUnix(nowIso),
    [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
  };
  if (isFirstWatch) {
    updates[`${base}/f`] = isoToUnix(nowIso);
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
  episodeId: number | string,
  previousWatched: boolean,
  previousCount: number,
  previousFirstWatchedAt: string | null,
  previousLastWatchedAt: string | null
): Record<string, unknown> {
  const base = `users/${uid}/seriesWatch/${seriesId}/seasons/${seasonIndex}/eps/${episodeId}`;
  // Wenn komplett zurueckgesetzt wird (not watched, count 0), den gesamten
  // eps-Eintrag loeschen statt Nullen zu schreiben.
  if (!previousWatched && previousCount === 0) {
    return {
      [base]: null,
      [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
    };
  }
  return {
    [`${base}/w`]: previousWatched ? 1 : 0,
    [`${base}/c`]: previousCount,
    [`${base}/f`]: previousFirstWatchedAt ? isoToUnix(previousFirstWatchedAt) : 0,
    [`${base}/l`]: previousLastWatchedAt ? isoToUnix(previousLastWatchedAt) : 0,
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
