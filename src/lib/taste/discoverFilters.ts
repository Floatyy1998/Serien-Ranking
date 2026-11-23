import { genreKeysOfIds, tmdbGenreIdOf, type TasteMedia } from './tasteEngine';

export type DiscoverEra = 'new' | 'mid' | 'old';

export interface DiscoverViewFilters {
  only: string[];
  hide: string[];
  eras: DiscoverEra[];
  minRating: number;
  minMatch: number;
}

export const DEFAULT_VIEW_FILTERS: DiscoverViewFilters = {
  only: [],
  hide: [],
  eras: [],
  minRating: 0,
  minMatch: 0,
};

export interface GenreOption {
  id: string;
  label: string;
  keys: string[];
}

export const GENRE_OPTIONS: GenreOption[] = [
  { id: 'anime', label: 'Anime', keys: [] },
  { id: 'animation', label: 'Animation', keys: ['animation'] },
  { id: 'action', label: 'Action', keys: ['action'] },
  { id: 'comedy', label: 'Comedy', keys: ['comedy'] },
  { id: 'drama', label: 'Drama', keys: ['drama'] },
  { id: 'crime', label: 'Krimi', keys: ['crime'] },
  { id: 'thriller', label: 'Thriller', keys: ['thriller'] },
  { id: 'mystery', label: 'Mystery', keys: ['mystery'] },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', keys: ['scifi', 'fantasy'] },
  { id: 'horror', label: 'Horror', keys: ['horror'] },
  { id: 'romance', label: 'Romantik', keys: ['romance'] },
  { id: 'kids', label: 'Kinder & Familie', keys: ['kids', 'family'] },
  { id: 'documentary', label: 'Dokus', keys: ['documentary'] },
  { id: 'reality', label: 'Reality', keys: ['reality', 'talk', 'soap', 'news'] },
];

export const ERA_OPTIONS: { id: DiscoverEra; label: string }[] = [
  { id: 'old', label: 'Vor 2000' },
  { id: 'mid', label: '2000–2015' },
  { id: 'new', label: 'Ab 2016' },
];

export const MIN_RATING_OPTIONS = [0, 7, 8];
export const MIN_MATCH_OPTIONS = [0, 60, 80];

const OPTION_BY_ID = new Map(GENRE_OPTIONS.map((option) => [option.id, option]));

const tmdbIdsOf = (id: string, media: TasteMedia): number[] => [
  ...new Set(
    (OPTION_BY_ID.get(id)?.keys ?? [])
      .map((key) => tmdbGenreIdOf(key, media))
      .filter((genreId): genreId is number => genreId !== undefined)
  ),
];

export const genreOptionsFor = (media: TasteMedia): GenreOption[] =>
  GENRE_OPTIONS.filter((option) => option.id === 'anime' || tmdbIdsOf(option.id, media).length > 0);

export function normalizeEras(raw: unknown): DiscoverEra[] {
  const wanted = Array.isArray(raw) ? raw : [];
  const eras = ERA_OPTIONS.map((option) => option.id).filter((id) => wanted.includes(id));
  return eras.length === ERA_OPTIONS.length ? [] : eras;
}

export function normalizeViewFilters(raw: unknown): DiscoverViewFilters {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<DiscoverViewFilters>;
  const known = (list: unknown): string[] =>
    Array.isArray(list) ? list.filter((id) => OPTION_BY_ID.has(id)) : [];
  const only = known(value.only);
  return {
    only,
    hide: known(value.hide).filter((id) => !only.includes(id)),
    eras: normalizeEras(value.eras),
    minRating: MIN_RATING_OPTIONS.includes(value.minRating as number)
      ? (value.minRating as number)
      : 0,
    minMatch: MIN_MATCH_OPTIONS.includes(value.minMatch as number) ? (value.minMatch as number) : 0,
  };
}

export const activeViewFilterCount = (filters: DiscoverViewFilters): number =>
  filters.only.length +
  filters.hide.length +
  (filters.eras.length > 0 ? 1 : 0) +
  (filters.minRating > 0 ? 1 : 0) +
  (filters.minMatch > 0 ? 1 : 0);

export interface DiscoverGenreParams {
  with_genres?: string;
  without_genres?: string;
  with_original_language?: string;
}

export function discoverGenreParams(
  filters: DiscoverViewFilters,
  media: TasteMedia
): DiscoverGenreParams | null {
  if (filters.only.length === 0) return null;
  const include = new Set<number>();
  const exclude = new Set<number>();
  const animeOnly = filters.only.length === 1 && filters.only[0] === 'anime';
  for (const id of filters.only) {
    if (id === 'anime') include.add(16);
    else for (const genreId of tmdbIdsOf(id, media)) include.add(genreId);
  }
  for (const id of filters.hide) {
    for (const genreId of tmdbIdsOf(id, media)) if (!include.has(genreId)) exclude.add(genreId);
  }
  return {
    with_genres: include.size > 0 ? [...include].join('|') : undefined,
    without_genres: exclude.size > 0 ? [...exclude].join(',') : undefined,
    with_original_language: animeOnly ? 'ja' : undefined,
  };
}

interface Filterable {
  genre_ids?: number[];
  original_language?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  match?: number;
}

const eraOf = (item: Filterable): DiscoverEra | null => {
  const year = Number(String(item.first_air_date || item.release_date || '').slice(0, 4));
  if (!Number.isFinite(year) || year < 1900) return null;
  if (year >= 2016) return 'new';
  return year >= 2000 ? 'mid' : 'old';
};

export function passesViewFilters(item: Filterable, filters: DiscoverViewFilters): boolean {
  if (filters.only.length > 0 || filters.hide.length > 0) {
    const keys = genreKeysOfIds(item.genre_ids);
    const anime = keys.includes('animation') && item.original_language === 'ja';
    const matches = (id: string): boolean =>
      id === 'anime'
        ? anime
        : (OPTION_BY_ID.get(id)?.keys.some((key) => keys.includes(key)) ?? false);
    if (filters.only.length > 0 && !filters.only.some(matches)) return false;
    if (filters.hide.some(matches)) return false;
  }
  if (filters.eras.length > 0) {
    const era = eraOf(item);
    if (!era || !filters.eras.includes(era)) return false;
  }
  if (filters.minRating > 0 && (item.vote_average ?? 0) < filters.minRating) return false;
  if (filters.minMatch > 0 && item.match !== undefined && item.match < filters.minMatch) {
    return false;
  }
  return true;
}
