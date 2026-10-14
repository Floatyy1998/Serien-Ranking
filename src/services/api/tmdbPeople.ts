import { FALLBACK_CHAIN } from '../../i18n/locales';
import type { TmdbPersonCredit } from '../../lib/person/filmography';
import { pickPersonHits, pickPopularPeople } from '../../lib/person/personSearch';
import type { PersonHit, TmdbPersonResult } from '../../lib/person/personSearch';
import { appLocale } from '../i18n';
import { tmdbFetch } from './tmdbClient';

interface TmdbPersonList {
  results?: TmdbPersonResult[];
}

interface TmdbPersonDetails {
  id: number;
  name?: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  combined_credits?: { cast?: TmdbPersonCredit[]; crew?: TmdbPersonCredit[] };
  translations?: {
    translations?: Array<{ iso_639_1?: string; data?: { biography?: string } }>;
  };
}

export interface PersonProfile {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string;
  placeOfBirth?: string;
  profilePath?: string;
  department?: string;
  cast: TmdbPersonCredit[];
  crew: TmdbPersonCredit[];
}

export async function searchPeople(query: string): Promise<PersonHit[]> {
  const data = await tmdbFetch<TmdbPersonList>('search/person', { query, page: 1 });
  return pickPersonHits(data.results, query);
}

export async function fetchTrendingPeople(): Promise<PersonHit[]> {
  const pages = await Promise.all(
    [1, 2].map((page) =>
      tmdbFetch<TmdbPersonList>('person/popular', { page }).catch(() => ({ results: [] }))
    )
  );
  return pickPopularPeople(pages.flatMap((p) => p.results || []));
}

function pickBiography(data: TmdbPersonDetails): string {
  const own = (data.biography || '').trim();
  if (own) return own;
  const translations = data.translations?.translations || [];
  for (const lang of new Set([...FALLBACK_CHAIN[appLocale], 'en'])) {
    const bio = translations.find((tr) => tr.iso_639_1 === lang)?.data?.biography?.trim();
    if (bio) return bio;
  }
  return '';
}

export async function fetchPersonProfile(id: number): Promise<PersonProfile> {
  const data = await tmdbFetch<TmdbPersonDetails>(`person/${id}`, {
    append_to_response: 'combined_credits,translations',
  });
  return {
    id: data.id,
    name: data.name || '',
    biography: pickBiography(data),
    birthday: data.birthday || undefined,
    deathday: data.deathday || undefined,
    placeOfBirth: data.place_of_birth || undefined,
    profilePath: data.profile_path || undefined,
    department: data.known_for_department || undefined,
    cast: data.combined_credits?.cast || [],
    crew: data.combined_credits?.crew || [],
  };
}
