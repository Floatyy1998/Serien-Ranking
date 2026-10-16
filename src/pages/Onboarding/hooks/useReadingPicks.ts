import { useCallback, useEffect, useRef, useState } from 'react';
import { coverAtSize } from '../../../lib/books/bookSearchMapping';
import { discoverManga, discoverMangaByGenres } from '../../../services/api/anilistService';
import { fetchShelf, type ShelfId } from '../../../services/api/bookDiscovery';
import { searchBooks } from '../../../services/api/booksApi';
import { searchMangaWithTitleFallback } from '../../../services/api/mangaSearch';
import type { BookSearchResult } from '../../../types/Book';
import type { AniListMangaSearchResult } from '../../../types/Manga';

export type ReadingKind = 'book' | 'manga';
export type ReadingPickStatus = 'reading' | 'completed' | 'planned';

export interface ReadingItem {
  key: string;
  kind: ReadingKind;
  title: string;
  cover?: string;
  year?: string;
  book?: BookSearchResult;
  manga?: AniListMangaSearchResult;
}

export interface ReadingPick extends ReadingItem {
  status: ReadingPickStatus;
}

export const bookItem = (book: BookSearchResult): ReadingItem => ({
  key: `book-${book.id}`,
  kind: 'book',
  title: book.title,
  cover: coverAtSize(book.cover, 'M'),
  year: book.publishedYear ? String(book.publishedYear) : undefined,
  book,
});

export const mangaItem = (manga: AniListMangaSearchResult): ReadingItem => ({
  key: `manga-${manga.id}`,
  kind: 'manga',
  title: manga.title.english || manga.title.romaji,
  cover: manga.coverImage.large,
  year: manga.startDate?.year ? String(manga.startDate.year) : undefined,
  manga,
});

/** Onboarding-Genre → Bücherregal fürs Stöbern. */
const BOOK_SHELF: Record<string, ShelfId | null> = {
  drama: 'classics',
  comedy: 'ya',
  action: 'fantasy',
  crime: 'thriller',
  scifi: 'scifi',
  animation: 'fantasy',
  horror: 'horror',
  romance: 'romance',
};

/** Onboarding-Genre → AniList-Genre. */
const MANGA_GENRE: Record<string, string> = {
  drama: 'Drama',
  comedy: 'Comedy',
  action: 'Action',
  crime: 'Mystery',
  scifi: 'Sci-Fi',
  animation: 'Fantasy',
  horror: 'Horror',
  romance: 'Romance',
};

const DEFAULT_SHELVES: ShelfId[] = ['fantasy', 'thriller', 'romance'];

/** Beschriftung der Kurations-Kacheln beim Lesen — Animation wird Fantasy, Mystery wird Horror. */
export const READING_GENRE_LABEL: Record<string, string> = {
  animation: 'Fantasy',
  horror: 'Horror',
};

/** Manga- und Buchcover je Onboarding-Genre (abwechselnd, bis zu 16 Kandidaten) — für die Lese-Kuration. */
export async function readingGenreCovers(slug: string): Promise<string[]> {
  const genre = MANGA_GENRE[slug];
  const shelf = BOOK_SHELF[slug];
  const [manga, books] = await Promise.all([
    genre ? discoverMangaByGenres([genre], 12).catch(() => []) : Promise.resolve([]),
    shelf ? fetchShelf(shelf, { limit: 14 }).catch(() => []) : Promise.resolve([]),
  ]);
  const mangaCovers = manga.filter((m) => !m.isAdult).map((m) => m.coverImage.large);
  const bookCovers = books.map((b) => coverAtSize(b.cover, 'M')).filter((c): c is string => !!c);
  return interleave([mangaCovers.slice(0, 8), bookCovers.slice(0, 8)]).filter(Boolean);
}

/** Vier Cover je Kachel, bekannte Bestseller nicht in mehreren Kacheln zugleich. */
export function spreadCovers(bySlug: Record<string, string[]>): Record<string, string[]> {
  const used = new Set<string>();
  const out: Record<string, string[]> = {};
  for (const [slug, covers] of Object.entries(bySlug)) {
    const fresh = covers.filter((c) => !used.has(c));
    const pick = [...fresh, ...covers.filter((c) => used.has(c))].slice(0, 4);
    pick.forEach((c) => used.add(c));
    out[slug] = pick;
  }
  return out;
}

/** Lieblings-Buchgenres aus der Onboarding-Kuration (für „Für dich" bei den Büchern). */
export const bookGenresFor = (genreSlugs: string[]): string[] => [
  ...new Set(genreSlugs.map((slug) => BOOK_SHELF[slug]).filter((id): id is ShelfId => !!id)),
];

/** Bücher landen meist als schon gelesen im Regal, Manga als laufende Reihe. */
export const defaultPickStatus = (kind: ReadingKind): ReadingPickStatus =>
  kind === 'book' ? 'completed' : 'reading';
const SUGGESTION_COUNT = 24;

const interleave = <T>(lists: T[][]): T[] => {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) for (const list of lists) if (list[i]) out.push(list[i]);
  return out;
};

const uniqueByKey = (items: ReadingItem[]): ReadingItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.key) && !!seen.add(item.key));
};

async function suggestBooks(genreSlugs: string[]): Promise<ReadingItem[]> {
  const mapped = genreSlugs.map((slug) => BOOK_SHELF[slug]).filter((id): id is ShelfId => !!id);
  const shelves = [...new Set(mapped.length ? mapped : DEFAULT_SHELVES)].slice(0, 3);
  const lists = await Promise.all(
    shelves.map((id) => fetchShelf(id, { limit: 14 }).catch(() => [] as BookSearchResult[]))
  );
  return uniqueByKey(
    interleave(lists)
      .filter((b) => b.cover)
      .map(bookItem)
  ).slice(0, SUGGESTION_COUNT);
}

async function suggestManga(genreSlugs: string[]): Promise<ReadingItem[]> {
  const genres = [...new Set(genreSlugs.map((slug) => MANGA_GENRE[slug]).filter(Boolean))];
  const results = genres.length
    ? await discoverMangaByGenres(genres, SUGGESTION_COUNT).catch(() => [])
    : [];
  const list = results.length
    ? results
    : (await discoverManga('popular', 1, SUGGESTION_COUNT).catch(() => ({ results: [] }))).results;
  return uniqueByKey(list.filter((m) => !m.isAdult).map(mangaItem));
}

/** Vorschläge und Suche für den Lese-Akt, je Reiter (Bücher / Manga). */
export function useReadingPicks(genreSlugs: string[]) {
  const [suggestions, setSuggestions] = useState<Record<ReadingKind, ReadingItem[]>>({
    book: [],
    manga: [],
  });
  const [loading, setLoading] = useState<Record<ReadingKind, boolean>>({
    book: true,
    manga: true,
  });
  const [results, setResults] = useState<ReadingItem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchId = useRef(0);
  const genreKey = genreSlugs.join(',');

  useEffect(() => {
    let cancelled = false;
    const slugs = genreKey ? genreKey.split(',') : [];
    const load = (kind: ReadingKind, run: () => Promise<ReadingItem[]>) =>
      run()
        .catch(() => [] as ReadingItem[])
        .then((items) => {
          if (cancelled) return;
          setSuggestions((prev) => ({ ...prev, [kind]: items }));
          setLoading((prev) => ({ ...prev, [kind]: false }));
        });
    void load('book', () => suggestBooks(slugs));
    void load('manga', () => suggestManga(slugs));
    return () => {
      cancelled = true;
    };
  }, [genreKey]);

  const search = useCallback((kind: ReadingKind, query: string) => {
    const id = ++searchId.current;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const run =
      kind === 'book'
        ? searchBooks(q).then((list) => list.map(bookItem))
        : searchMangaWithTitleFallback(q, 24).then((outcome) =>
            outcome.results.filter((m) => !m.isAdult).map(mangaItem)
          );
    run
      .catch(() => [] as ReadingItem[])
      .then((items) => {
        if (id !== searchId.current) return;
        setResults(uniqueByKey(items));
        setSearching(false);
      });
  }, []);

  return { suggestions, loading, results, searching, search };
}
