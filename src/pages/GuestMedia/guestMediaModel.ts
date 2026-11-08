export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

interface TmdbCastEntry {
  id: number;
  name: string;
  profile_path?: string | null;
  character?: string;
  roles?: { character?: string; episode_count?: number }[];
  total_episode_count?: number;
}

export interface TmdbSimilarEntry {
  id: number;
  name?: string;
  title?: string;
  poster_path?: string | null;
  vote_average?: number;
  first_air_date?: string;
  release_date?: string;
}

export interface TmdbSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date?: string | null;
  poster_path?: string | null;
}

export interface TmdbNextEpisode {
  air_date?: string;
  season_number: number;
  episode_number: number;
}

export interface TmdbProvider {
  provider_id?: number;
  provider_name?: string;
  logo_path?: string;
}

export interface TmdbDetail {
  name?: string;
  title?: string;
  tagline?: string;
  first_air_date?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  genres?: { name: string }[];
  seasons?: TmdbSeason[];
  next_episode_to_air?: TmdbNextEpisode | null;
  videos?: { results?: TmdbVideo[] };
  credits?: { cast?: TmdbCastEntry[]; crew?: { id: number; name: string; job?: string }[] };
  created_by?: { id: number; name: string }[];
  external_ids?: { imdb_id?: string | null };
  belongs_to_collection?: { id: number; name: string } | null;
  aggregate_credits?: { cast?: TmdbCastEntry[] };
  recommendations?: { results?: TmdbSimilarEntry[] };
  similar?: { results?: TmdbSimilarEntry[] };
  'watch/providers'?: {
    results?: Record<string, { flatrate?: TmdbProvider[]; ads?: TmdbProvider[] }>;
  };
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

const TRAILER_RANK: Record<string, number> = { Trailer: 0, Teaser: 1 };

export function pickTrailerKey(videos: TmdbVideo[] | undefined): string | null {
  const candidates = (videos || []).filter(
    (v) => v.site === 'YouTube' && v.key && v.type in TRAILER_RANK
  );
  candidates.sort(
    (a, b) =>
      TRAILER_RANK[a.type] - TRAILER_RANK[b.type] || Number(!!b.official) - Number(!!a.official)
  );
  return candidates[0]?.key ?? null;
}

export function pickCast(detail: TmdbDetail, limit = 12): CastMember[] {
  const raw = detail.aggregate_credits?.cast?.length
    ? detail.aggregate_credits.cast
    : detail.credits?.cast || [];
  return raw.slice(0, limit).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character || c.roles?.[0]?.character || '',
    profilePath: c.profile_path ?? null,
  }));
}

export function pickSimilar(detail: TmdbDetail, limit = 12): TmdbSimilarEntry[] {
  const recs = detail.recommendations?.results || [];
  const pool = recs.length >= 4 ? recs : [...recs, ...(detail.similar?.results || [])];
  const seen = new Set<number>();
  return pool.filter((e) => e.poster_path && !seen.has(e.id) && seen.add(e.id)).slice(0, limit);
}

export function pickSeasons(detail: TmdbDetail): TmdbSeason[] {
  return (detail.seasons || []).filter((s) => s.season_number > 0 && s.episode_count > 0);
}

export function upcomingEpisode(detail: TmdbDetail, now = new Date()): TmdbNextEpisode | null {
  const next = detail.next_episode_to_air;
  if (!next?.air_date) return null;
  const airs = new Date(`${next.air_date}T23:59:59`);
  return airs.getTime() >= now.getTime() ? next : null;
}

export function totalWatchMinutes(detail: TmdbDetail): number {
  if (detail.runtime) return detail.runtime;
  const perEpisode = detail.episode_run_time?.[0];
  if (!perEpisode || !detail.number_of_episodes) return 0;
  return perEpisode * detail.number_of_episodes;
}

export interface TmdbCollection {
  name: string;
  parts?: TmdbSimilarEntry[];
}

export function pickMakers(detail: TmdbDetail): string[] {
  const directors = (detail.credits?.crew || [])
    .filter((c) => c.job === 'Director')
    .map((c) => c.name);
  const creators = (detail.created_by || []).map((c) => c.name);
  return [...new Set([...creators, ...directors])].slice(0, 2);
}

export function sortCollection(collection: TmdbCollection | null): TmdbSimilarEntry[] {
  const parts = collection?.parts || [];
  return [...parts]
    .filter((p) => p.poster_path)
    .sort((a, b) => (a.release_date || '9999').localeCompare(b.release_date || '9999'));
}

export function isUpcoming(iso: string | undefined, now = new Date()): boolean {
  if (!iso) return false;
  return new Date(`${iso}T00:00:00`).getTime() > now.getTime();
}
