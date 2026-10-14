import type { AniListMangaSearchResult } from '../../types/Manga';
import { fromMangaUpdatesSeriesId } from './mangaSource';
import type { AliasHit } from './titleMatch';

export interface MangaUpdatesHit extends AliasHit {
  id?: number | null;
  type?: string | null;
  image?: string | null;
  year?: string | number | null;
  genres?: string[];
}

export interface MangaUpdatesSeries {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  type?: string | null;
  year?: string | number | null;
  rating?: number | null;
  genres?: string[];
  status?: string | null;
  associated?: string[];
  authors?: { name: string; type: string }[];
}

/** AniList führt nur ostasiatische Werke; alle anderen MangaUpdates-Typen fehlen dort. */
const MANGAUPDATES_ONLY_TYPES = new Set([
  'OEL',
  'French',
  'Spanish',
  'Nordic',
  'Filipino',
  'Indonesian',
  'Thai',
  'Vietnamese',
  'Malaysian',
]);

const ADULT_GENRES = new Set(['Adult', 'Hentai', 'Lolicon', 'Shotacon']);

const ANILIST_GENRES: Record<string, string> = {
  action: 'Action',
  adventure: 'Adventure',
  comedy: 'Comedy',
  drama: 'Drama',
  ecchi: 'Ecchi',
  fantasy: 'Fantasy',
  horror: 'Horror',
  mecha: 'Mecha',
  mystery: 'Mystery',
  psychological: 'Psychological',
  romance: 'Romance',
  'sci-fi': 'Sci-Fi',
  'slice of life': 'Slice of Life',
  sports: 'Sports',
  supernatural: 'Supernatural',
};

export const decodeMangaUpdatesText = (value: string): string =>
  value
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

export const isMangaUpdatesOnlyType = (type?: string | null): boolean =>
  !!type && MANGAUPDATES_ONLY_TYPES.has(type);

export const hasAdultGenre = (genres: string[] = []): boolean =>
  genres.some((genre) => ADULT_GENRES.has(genre));

export function parseMangaUpdatesStatus(raw?: string | null): {
  status: string;
  chapters: number | null;
  volumes: number | null;
} {
  const text = raw || '';
  const count = (pattern: RegExp) => {
    const match = text.match(pattern);
    return match ? parseInt(match[1], 10) : null;
  };
  const status = /hiatus/i.test(text)
    ? 'HIATUS'
    : /cancel|discontinu/i.test(text)
      ? 'CANCELLED'
      : /ongoing/i.test(text)
        ? 'RELEASING'
        : /complete/i.test(text)
          ? 'FINISHED'
          : '';
  return { status, chapters: count(/(\d+)\s*chapters?/i), volumes: count(/(\d+)\s*volumes?/i) };
}

export function mangaUpdatesToSearchResult(series: MangaUpdatesSeries): AniListMangaSearchResult {
  const title = decodeMangaUpdatesText(series.title);
  const image = series.image || '';
  const year = parseInt(String(series.year ?? ''), 10);
  const { status, chapters, volumes } = parseMangaUpdatesStatus(series.status);
  const finished = status === 'FINISHED';
  const genres = (series.genres || [])
    .map((genre) => ANILIST_GENRES[genre.toLowerCase()])
    .filter((genre): genre is string => !!genre);

  return {
    id: fromMangaUpdatesSeriesId(series.id),
    title: { romaji: title, english: title, native: null },
    synonyms: (series.associated || []).map(decodeMangaUpdatesText),
    coverImage: { large: image, medium: image },
    bannerImage: null,
    description: series.description || null,
    chapters: finished ? chapters : null,
    volumes: finished ? volumes : null,
    status,
    format: 'COMIC',
    countryOfOrigin: '',
    genres,
    averageScore: series.rating ? Math.round(series.rating * 10) : null,
    startDate: { year: Number.isFinite(year) ? year : null, month: null, day: null },
    isAdult: hasAdultGenre(series.genres),
    staff: {
      edges: (series.authors || []).map((author) => ({
        node: { name: { full: author.name } },
        role: author.type === 'Artist' ? 'Art' : 'Story',
      })),
    },
    externalLinks: [],
  };
}
