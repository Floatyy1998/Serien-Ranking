import { coverAtSize } from '../../lib/books/bookSearchMapping';
import { discoverManga } from '../../services/api/anilistService';
import { fetchShelf } from '../../services/api/bookDiscovery';
import { getTmdbApiKey, tmdbFetch } from '../../services/api/tmdbClient';

export type Kind = 'series' | 'manga' | 'book';

export interface MockItem {
  kind: Kind;
  title: string;
  poster: string;
  art: string | null;
}

type TmdbTrendingResponse = {
  results?: Array<{
    name?: string;
    title?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
  }>;
};

const TMDB = 'https://image.tmdb.org/t/p';

async function loadSeries(): Promise<MockItem[]> {
  if (!getTmdbApiKey()) return [];
  const data = await tmdbFetch<TmdbTrendingResponse>('trending/tv/week').catch(() => null);
  return (data?.results || [])
    .filter((r) => (r.name || r.title) && r.poster_path)
    .map((r) => ({
      kind: 'series' as const,
      title: r.name || r.title || '',
      poster: `${TMDB}/w342${r.poster_path}`,
      art: r.backdrop_path ? `${TMDB}/w780${r.backdrop_path}` : null,
    }));
}

async function loadManga(): Promise<MockItem[]> {
  const { results } = await discoverManga('popular', 1, 12).catch(() => ({ results: [] }));
  return results
    .filter((m) => !m.isAdult && m.coverImage.large)
    .map((m) => ({
      kind: 'manga' as const,
      title: m.title.english || m.title.romaji,
      poster: m.coverImage.large,
      art: m.bannerImage,
    }));
}

async function loadBooks(): Promise<MockItem[]> {
  const list = await fetchShelf('fantasy', { limit: 12 }).catch(() => []);
  return list
    .map((b) => ({ title: b.title, cover: coverAtSize(b.cover, 'M') }))
    .filter((b): b is { title: string; cover: string } => !!b.cover)
    .map((b) => ({ kind: 'book' as const, title: b.title, poster: b.cover, art: null }));
}

export interface LandingCovers {
  series: MockItem[];
  manga: MockItem[];
  books: MockItem[];
}

// Modul-Cache: die Landing soll beim Navigieren Login→Start nicht neu laden.
let cached: LandingCovers | null = null;
let pending: Promise<LandingCovers> | null = null;

export const getLandingCovers = (): LandingCovers | null => cached;

/** Serien-Trends, beliebte Manga und Buch-Bestseller — einmal je Sitzung. */
export function loadLandingCovers(): Promise<LandingCovers> {
  if (cached) return Promise.resolve(cached);
  pending ??= Promise.all([loadSeries(), loadManga(), loadBooks()]).then(
    ([series, manga, books]) => (cached = { series, manga, books })
  );
  return pending;
}
