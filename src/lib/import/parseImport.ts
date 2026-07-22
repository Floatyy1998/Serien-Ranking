/**
 * Import-Parser (Phase 1): erkennt und normalisiert TV-Rank-Export-JSON und
 * Trakt-JSON (watched-Shows/-Movies sowie History-Einträge). Alles id-basiert
 * (TMDB) — Titel-Matching (Netflix-CSV) ist bewusst Phase 2.
 * Pure — keine I/O.
 */

export interface ImportEpisodeItem {
  season: number;
  episode: number;
  watchedAt?: string;
  count: number;
}

export interface ImportSeriesItem {
  /** null = noch nicht aufgelöst (nur imdbId/tvdbId vorhanden). */
  tmdbId: number | null;
  imdbId?: string;
  tvdbId?: number;
  title: string;
  episodes: ImportEpisodeItem[];
}

export interface ImportMovieItem {
  /** null = noch nicht aufgelöst (nur imdbId/tvdbId vorhanden). */
  tmdbId: number | null;
  imdbId?: string;
  tvdbId?: number;
  title: string;
  watchedAt?: string;
  rating?: number;
}

export interface ParsedImport {
  source: 'tvrank' | 'trakt';
  series: ImportSeriesItem[];
  movies: ImportMovieItem[];
}

const toInt = (v: unknown): number | null => {
  const n = typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

const isIso = (v: unknown): v is string => typeof v === 'string' && !isNaN(Date.parse(v));

/* eslint-disable @typescript-eslint/no-explicit-any */

function parseTvRank(data: any): ParsedImport | null {
  if (data?.format !== 'tvrank' || !Array.isArray(data.series)) return null;
  const series: ImportSeriesItem[] = [];
  for (const s of data.series) {
    const tmdbId = toInt(s?.tmdbId);
    if (!tmdbId) continue;
    const episodes: ImportEpisodeItem[] = [];
    for (const ep of Array.isArray(s.episodes) ? s.episodes : []) {
      const season = toInt(ep?.season);
      const episode = toInt(ep?.episode);
      if (!season || !episode) continue;
      episodes.push({
        season,
        episode,
        ...(isIso(ep.firstWatchedAt) && { watchedAt: ep.firstWatchedAt }),
        count: toInt(ep?.watchCount) ?? 1,
      });
    }
    series.push({ tmdbId, title: String(s.title || ''), episodes });
  }
  const movies: ImportMovieItem[] = [];
  for (const m of Array.isArray(data.movies) ? data.movies : []) {
    const tmdbId = toInt(m?.tmdbId);
    if (!tmdbId || m?.watched === false) continue;
    movies.push({
      tmdbId,
      title: String(m.title || ''),
      ...(isIso(m.watchedAt) && { watchedAt: m.watchedAt }),
      ...(typeof m.rating === 'number' && m.rating > 0 && { rating: m.rating }),
    });
  }
  return { source: 'tvrank', series, movies };
}

interface ExternalIds {
  tmdbId: number | null;
  imdbId?: string;
  tvdbId?: number;
}

/** Zieht tmdb/imdb/tvdb aus einem Trakt-ids-Objekt; null = gar keine brauchbare Id. */
function extractIds(ids: any): ExternalIds | null {
  const tmdbId = toInt(ids?.tmdb);
  const imdbId = typeof ids?.imdb === 'string' && ids.imdb.startsWith('tt') ? ids.imdb : undefined;
  const tvdbId = toInt(ids?.tvdb) ?? undefined;
  if (!tmdbId && !imdbId && !tvdbId) return null;
  return { tmdbId, ...(imdbId && { imdbId }), ...(tvdbId && { tvdbId }) };
}

const identityKey = (ids: ExternalIds): string =>
  ids.tmdbId ? `t${ids.tmdbId}` : ids.imdbId ? `i${ids.imdbId}` : `v${ids.tvdbId}`;

/** Trakt: watched-Shows/-Movies-Arrays sowie History-Einträge (type + watched_at). */
function parseTrakt(data: any): ParsedImport | null {
  const arr = Array.isArray(data) ? data : null;
  if (!arr || arr.length === 0) return null;

  const seriesByKey = new Map<string, ImportSeriesItem>();
  const movieByKey = new Map<string, ImportMovieItem>();
  const epKey = (s: number, e: number) => `${s}x${e}`;
  const epMaps = new Map<string, Map<string, ImportEpisodeItem>>();
  let matchedAny = false;

  const upsertEpisode = (
    ids: ExternalIds,
    title: string,
    season: number,
    episode: number,
    watchedAt: string | undefined,
    plays: number
  ) => {
    matchedAny = true;
    const seriesKey = identityKey(ids);
    if (!seriesByKey.has(seriesKey)) {
      seriesByKey.set(seriesKey, { ...ids, title, episodes: [] });
      epMaps.set(seriesKey, new Map());
    }
    const eps = epMaps.get(seriesKey)!;
    const key = epKey(season, episode);
    const existing = eps.get(key);
    if (existing) {
      existing.count += plays;
      if (watchedAt && (!existing.watchedAt || watchedAt < existing.watchedAt)) {
        existing.watchedAt = watchedAt;
      }
    } else {
      const item: ImportEpisodeItem = {
        season,
        episode,
        ...(watchedAt && { watchedAt }),
        count: Math.max(1, plays),
      };
      eps.set(key, item);
      seriesByKey.get(seriesKey)!.episodes.push(item);
    }
  };

  for (const row of arr) {
    // watched-Shows-Export: { show:{title, ids}, seasons:[{number, episodes:[{number, plays, last_watched_at}]}] }
    const showIds = extractIds(row?.show?.ids);
    if (showIds && Array.isArray(row.seasons)) {
      for (const season of row.seasons) {
        const sn = toInt(season?.number);
        if (!sn) continue;
        for (const ep of Array.isArray(season.episodes) ? season.episodes : []) {
          const en = toInt(ep?.number);
          if (!en) continue;
          upsertEpisode(
            showIds,
            String(row.show.title || ''),
            sn,
            en,
            isIso(ep.last_watched_at) ? ep.last_watched_at : undefined,
            toInt(ep?.plays) ?? 1
          );
        }
      }
      continue;
    }

    // History-Eintrag: { type:'episode', watched_at, episode:{season, number}, show:{...} }
    if (row?.type === 'episode' && showIds) {
      const sn = toInt(row?.episode?.season);
      const en = toInt(row?.episode?.number);
      if (sn && en) {
        upsertEpisode(
          showIds,
          String(row.show.title || ''),
          sn,
          en,
          isIso(row.watched_at) ? row.watched_at : undefined,
          1
        );
      }
      continue;
    }

    // watched-/History-Movies: { movie:{title, ids}, plays?, last_watched_at?|watched_at? }
    const movieIds = extractIds(row?.movie?.ids);
    if (movieIds) {
      matchedAny = true;
      const watchedAt = isIso(row.last_watched_at)
        ? row.last_watched_at
        : isIso(row.watched_at)
          ? row.watched_at
          : undefined;
      const key = identityKey(movieIds);
      if (!movieByKey.has(key)) {
        movieByKey.set(key, {
          ...movieIds,
          title: String(row.movie.title || ''),
          ...(watchedAt && { watchedAt }),
        });
      }
    }
  }

  if (!matchedAny) return null;
  return { source: 'trakt', series: [...seriesByKey.values()], movies: [...movieByKey.values()] };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Erkennt das Format automatisch; null = nicht unterstützt (z. B. Netflix-CSV → Phase 2). */
export function parseImportFile(text: string): ParsedImport | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  return parseTvRank(data) ?? parseTrakt(data);
}
