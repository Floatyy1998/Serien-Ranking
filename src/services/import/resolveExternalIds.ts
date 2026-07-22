/**
 * Löst Import-Einträge ohne TMDB-Id über die TMDB-find-API auf (IMDb/TVDB als
 * Querverweis — betrifft seltene Trakt-Einträge ohne tmdb-Id). Nicht
 * Auflösbares wird verworfen und gezählt.
 */
import type { ParsedImport } from '../../lib/import/parseImport';
import { tmdbFetch } from '../tmdbClient';

interface FindResult {
  tv_results?: { id: number }[];
  movie_results?: { id: number }[];
}

async function findTmdbId(
  kind: 'tv' | 'movie',
  imdbId?: string,
  tvdbId?: number
): Promise<number | null> {
  const sources: Array<[string, string | number]> = [];
  if (imdbId) sources.push(['imdb_id', imdbId]);
  if (tvdbId) sources.push(['tvdb_id', tvdbId]);
  for (const [source, externalId] of sources) {
    try {
      const data = await tmdbFetch<FindResult>(`find/${externalId}`, {
        external_source: source,
        language: undefined,
      });
      const hit = kind === 'tv' ? data.tv_results?.[0]?.id : data.movie_results?.[0]?.id;
      if (hit) return hit;
    } catch {
      // best-effort — nächste Quelle probieren
    }
  }
  return null;
}

export interface ResolvedImport {
  parsed: ParsedImport;
  /** Einträge, die auch über IMDb/TVDB nicht auflösbar waren. */
  unresolved: number;
}

export async function resolveMissingTmdbIds(parsed: ParsedImport): Promise<ResolvedImport> {
  let unresolved = 0;

  const series: ParsedImport['series'] = [];
  for (const s of parsed.series) {
    if (s.tmdbId) {
      series.push(s);
      continue;
    }
    const resolved = await findTmdbId('tv', s.imdbId, s.tvdbId);
    if (resolved) series.push({ ...s, tmdbId: resolved });
    else unresolved++;
  }

  const movies: ParsedImport['movies'] = [];
  for (const m of parsed.movies) {
    if (m.tmdbId) {
      movies.push(m);
      continue;
    }
    const resolved = await findTmdbId('movie', m.imdbId, m.tvdbId);
    if (resolved) movies.push({ ...m, tmdbId: resolved });
    else unresolved++;
  }

  return { parsed: { ...parsed, series, movies }, unresolved };
}
