/** Serien-Suche und Staffel-/Folgenlisten für den Crossover-Editor. */
import { tmdbFetch } from '../api/tmdbClient';
import { fetchStaticCatalogSeasons } from '../catalog/staticCatalog';

export interface PickerSeries {
  id: number;
  title: string;
  year: string;
  poster_path?: string | null;
}

export interface PickerEpisode {
  number: number;
  name: string;
}

export interface PickerSeason {
  number: number;
  episodes: PickerEpisode[];
}

interface TmdbTvSearch {
  results?: Array<{
    id: number;
    name?: string;
    first_air_date?: string;
    poster_path?: string | null;
  }>;
}

interface TmdbTv {
  seasons?: Array<{ season_number: number; episode_count?: number }>;
}

interface TmdbSeason {
  episodes?: Array<{ episode_number: number; name?: string }>;
}

export async function searchSeriesForPicker(query: string): Promise<PickerSeries[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await tmdbFetch<TmdbTvSearch>('search/tv', { query: q, page: 1 });
  return (res.results || []).slice(0, 12).map((r) => ({
    id: r.id,
    title: r.name || '',
    year: (r.first_air_date || '').slice(0, 4),
    poster_path: r.poster_path,
  }));
}

const seasonCache = new Map<number, Promise<PickerSeason[]>>();

async function loadFromCatalog(tmdbId: number): Promise<PickerSeason[] | null> {
  const data = await fetchStaticCatalogSeasons(tmdbId).catch(() => null);
  if (!data) return null;
  return Object.entries(data)
    .map(([k, season]) => ({ key: Number(k), season }))
    .filter((e) => Number.isFinite(e.key))
    .sort((a, b) => a.key - b.key)
    .map((e) => ({
      number: e.key + 1,
      episodes: (e.season.episodes || []).map((ep, idx) => ({
        number: ep.episodeNumber ?? idx + 1,
        name: ep.name || '',
      })),
    }));
}

async function loadFromTmdb(tmdbId: number): Promise<PickerSeason[]> {
  const tv = await tmdbFetch<TmdbTv>(`tv/${tmdbId}`);
  const numbers = (tv.seasons || [])
    .map((s) => s.season_number)
    .filter((n) => n > 0)
    .slice(0, 40);
  const seasons = await Promise.all(
    numbers.map(async (n) => {
      const season = await tmdbFetch<TmdbSeason>(`tv/${tmdbId}/season/${n}`).catch(() => null);
      return {
        number: n,
        episodes: (season?.episodes || []).map((ep) => ({
          number: ep.episode_number,
          name: ep.name || '',
        })),
      };
    })
  );
  return seasons;
}

/** Katalog zuerst (gleiche Nummerierung wie in der App), sonst TMDB. */
export function loadSeasonsForPicker(tmdbId: number): Promise<PickerSeason[]> {
  let pending = seasonCache.get(tmdbId);
  if (!pending) {
    pending = loadFromCatalog(tmdbId).then((fromCatalog) =>
      fromCatalog && fromCatalog.length ? fromCatalog : loadFromTmdb(tmdbId)
    );
    seasonCache.set(tmdbId, pending);
    pending.catch(() => seasonCache.delete(tmdbId));
  }
  return pending;
}
