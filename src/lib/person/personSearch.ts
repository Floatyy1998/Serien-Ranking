import { normalizeTitle, type RankableResult } from '../text/searchRelevance';

export interface TmdbPersonResult {
  id: number;
  name?: string;
  adult?: boolean;
  profile_path?: string | null;
  known_for_department?: string;
  popularity?: number;
  known_for?: Array<{ title?: string; name?: string; media_type?: string; vote_count?: number }>;
}

export interface PersonHit {
  id: number;
  name: string;
  profilePath?: string;
  department?: string;
  knownFor?: string;
  popularity: number;
}

const words = (value: string): string[] =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

export function nameMatchesQuery(name: string, query: string): boolean {
  const queryWords = words(query);
  if (queryWords.length === 0) return false;
  const nameWords = words(name);
  return queryWords.every((q) => nameWords.some((w) => w.startsWith(q)));
}

const knownForVotes = (result: TmdbPersonResult): number =>
  Math.max(0, ...(result.known_for || []).map((k) => k.vote_count ?? 0));

export function toPersonHit(result: TmdbPersonResult): PersonHit {
  const known = [...(result.known_for || [])]
    .filter((k) => k.title || k.name)
    .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))[0];
  return {
    id: result.id,
    name: result.name || '',
    profilePath: result.profile_path || undefined,
    department: result.known_for_department || undefined,
    knownFor: known ? known.title || known.name : undefined,
    popularity: result.popularity ?? 0,
  };
}

const EXACT_NAME_BOOST = 3;
const MIN_KNOWN_FOR_VOTES = 50;
const STAR_KNOWN_FOR_VOTES = 1000;

export function pickPersonHits(
  results: TmdbPersonResult[] | undefined,
  query: string,
  limit = 24
): PersonHit[] {
  const target = normalizeTitle(query);
  const usable = (results || []).filter(
    (r) =>
      !r.adult &&
      r.name &&
      r.profile_path &&
      (knownForVotes(r) >= MIN_KNOWN_FOR_VOTES || normalizeTitle(r.name) === target)
  );
  const byName = usable.filter((r) => nameMatchesQuery(r.name || '', query));
  const pool = byName.length > 0 ? byName : usable.filter((r) => (r.popularity ?? 0) >= 1);
  const score = (r: TmdbPersonResult) =>
    (r.popularity ?? 0) * (normalizeTitle(r.name || '') === target ? EXACT_NAME_BOOST : 1);
  return pool
    .map((r) => ({ r, score: score(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ r }) => toPersonHit(r));
}

export function peopleLeadResults(
  people: PersonHit[],
  titles: RankableResult[],
  query: string
): boolean {
  if (people.length === 0) return false;
  const target = normalizeTitle(query);
  const exactTitles = titles.filter((r) =>
    [r.title, r.name, r.original_title, r.original_name].some(
      (value) => !!value && normalizeTitle(value) === target
    )
  );
  if (exactTitles.length === 0) return true;
  const best = Math.max(...exactTitles.map((r) => r.popularity ?? 0));
  return Math.max(...people.map((p) => p.popularity)) >= best;
}

export function pickPopularPeople(results: TmdbPersonResult[] | undefined): PersonHit[] {
  const seen = new Set<number>();
  return (results || [])
    .filter(
      (r) =>
        !r.adult &&
        r.name &&
        r.profile_path &&
        r.known_for_department === 'Acting' &&
        knownForVotes(r) >= STAR_KNOWN_FOR_VOTES &&
        !seen.has(r.id) &&
        seen.add(r.id)
    )
    .map(toPersonHit);
}
