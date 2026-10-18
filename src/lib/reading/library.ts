/** Eine Bibliothek für Bücher und Manga: gemeinsame Einträge, Filter und Sortierung (ohne I/O). */

import type { Book, BookStatus } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { progressPercent } from '../books/bookProgress';
import { bookGenres } from '../books/shelfView';
import { mangaStand, mangaTotalVolumes } from '../manga/progress';
import { normalizeTitle } from '../text/searchRelevance';

export type LibraryKind = 'book' | 'manga' | 'manhwa' | 'manhua';

export type LibraryStatusFilter = 'all' | BookStatus | 'owned' | 'hidden';

/** 'manga' umfasst das ganze Medium (auch Manhwa und Manhua). */
export type LibraryMediumFilter = 'all' | 'books' | 'manga' | 'manhwa' | 'manhua';

export type LibrarySortKey =
  'recent' | 'added' | 'title' | 'author' | 'rating' | 'progress' | 'pages';

export type LibraryView = 'shelf' | 'grid';

export interface LibraryItem {
  key: string;
  kind: LibraryKind;
  title: string;
  author?: string;
  status: BookStatus;
  hidden: boolean;
  owned: boolean;
  genres: string[];
  rating: number;
  progress: number;
  /** Seiten; bei Manga geschätzt aus Bänden bzw. Kapiteln. */
  size: number;
  addedAt: number;
  activityAt: number;
  completedAt: number;
  book?: Book;
  manga?: Manga;
}

export const STATUS_FILTERS: LibraryStatusFilter[] = [
  'all',
  'reading',
  'planned',
  'completed',
  'paused',
  'dropped',
  'owned',
  'hidden',
];

export const MEDIUM_FILTERS: LibraryMediumFilter[] = ['all', 'books', 'manga', 'manhwa', 'manhua'];

export const LIBRARY_SORTS: LibrarySortKey[] = [
  'recent',
  'added',
  'title',
  'author',
  'rating',
  'progress',
  'pages',
];

export const LIBRARY_DEFAULT_DESC: Record<LibrarySortKey, boolean> = {
  recent: true,
  added: true,
  title: false,
  author: false,
  rating: true,
  progress: true,
  pages: true,
};

const PAGES_PER_VOLUME = 190;
const PAGES_PER_CHAPTER = 20;
const ARTICLE = /^(the|a|an|der|die|das|ein|eine|le|la|les|el|los|las)\s+/i;
const GENRE_ALIAS: Record<string, string> = {
  'science fiction': 'sci-fi',
  'science-fiction': 'sci-fi',
  scifi: 'sci-fi',
};

const time = (iso: string | undefined): number => {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : 0;
};

const latest = (...dates: (string | undefined)[]) => Math.max(0, ...dates.map(time));

export const genreKey = (name: string): string => {
  const key = name.trim().toLowerCase();
  return GENRE_ALIAS[key] ?? key;
};

export const mangaKind = (manga: Pick<Manga, 'countryOfOrigin'>): LibraryKind =>
  manga.countryOfOrigin === 'KR' ? 'manhwa' : manga.countryOfOrigin === 'CN' ? 'manhua' : 'manga';

export function bookItem(book: Book): LibraryItem {
  return {
    key: `b:${book.id}`,
    kind: 'book',
    title: book.title,
    author: book.authors?.[0] || undefined,
    status: book.status,
    hidden: !!book.hidden,
    owned: !!book.ownedAt,
    genres: bookGenres(book),
    rating: book.rating ?? 0,
    progress: progressPercent(book),
    size: book.pageCount ?? 0,
    addedAt: time(book.addedAt),
    activityAt: latest(book.completedAt, book.lastReadAt, book.startedAt, book.addedAt),
    completedAt: time(book.completedAt),
    book,
  };
}

export function mangaItem(manga: Manga, uid: string | undefined): LibraryItem {
  const volumes = mangaTotalVolumes(manga);
  const chapters = Math.max(manga.chapters || 0, manga.latestChapterAvailable || 0);
  return {
    key: `m:${manga.anilistId}`,
    kind: mangaKind(manga),
    title: manga.title,
    status: manga.readStatus,
    hidden: !!manga.hidden,
    owned: false,
    genres: (manga.genres ?? []).map((g) => g?.trim()).filter(Boolean),
    rating: uid ? manga.rating?.[uid] || 0 : 0,
    progress: mangaStand(manga).percent,
    size: volumes > 0 ? volumes * PAGES_PER_VOLUME : chapters * PAGES_PER_CHAPTER,
    addedAt: time(manga.addedAt),
    activityAt: latest(manga.lastReadAt, manga.completedAt, manga.startedAt, manga.addedAt),
    completedAt: time(manga.completedAt),
    manga,
  };
}

export interface LibrarySources {
  books: Book[];
  hiddenBooks: Book[];
  manga: Manga[];
  hiddenManga: Manga[];
  showBooks: boolean;
  showManga: boolean;
  uid: string | undefined;
}

/** Alle Einträge der genutzten Lesebereiche, ausgeblendete markiert. */
export function buildLibrary(src: LibrarySources): LibraryItem[] {
  const out: LibraryItem[] = [];
  if (src.showBooks) {
    for (const b of src.books) out.push(bookItem(b));
    for (const b of src.hiddenBooks) out.push({ ...bookItem(b), hidden: true });
  }
  if (src.showManga) {
    for (const m of src.manga) out.push(mangaItem(m, src.uid));
    for (const m of src.hiddenManga) out.push({ ...mangaItem(m, src.uid), hidden: true });
  }
  return out;
}

export const matchesStatus = (item: LibraryItem, filter: LibraryStatusFilter): boolean => {
  if (filter === 'hidden') return item.hidden;
  if (item.hidden) return false;
  if (filter === 'all') return true;
  if (filter === 'owned') return item.owned;
  return item.status === filter;
};

export const matchesMedium = (item: LibraryItem, filter: LibraryMediumFilter): boolean => {
  if (filter === 'all') return true;
  if (filter === 'books') return item.kind === 'book';
  if (filter === 'manga') return item.kind !== 'book';
  return item.kind === filter;
};

export function countByStatus(items: LibraryItem[]): Record<LibraryStatusFilter, number> {
  const out = Object.fromEntries(STATUS_FILTERS.map((f) => [f, 0])) as Record<
    LibraryStatusFilter,
    number
  >;
  for (const item of items) for (const f of STATUS_FILTERS) if (matchesStatus(item, f)) out[f] += 1;
  return out;
}

/** Medium-Chips: nur wenn es überhaupt etwas zu unterscheiden gibt. */
export function mediumOptions(items: LibraryItem[]): LibraryMediumFilter[] {
  const kinds = new Set(items.map((i) => i.kind));
  if (kinds.size < 2) return [];
  const hasBooks = kinds.has('book');
  const hasManga = [...kinds].some((k) => k !== 'book');
  return MEDIUM_FILTERS.filter((f) => {
    if (f === 'all') return true;
    if (f === 'books' || f === 'manga') return hasBooks && hasManga;
    return kinds.has(f);
  });
}

export function matchesLibraryQuery(item: LibraryItem, query: string): boolean {
  const words = query.trim().split(/\s+/).map(normalizeTitle).filter(Boolean);
  if (words.length === 0) return true;
  const hay = [
    item.title,
    item.book?.subtitle,
    item.book?.series?.name,
    ...(item.book?.authors ?? []),
    item.manga?.titleEnglish,
    item.manga?.titleRomaji,
  ]
    .filter((v): v is string => !!v)
    .map(normalizeTitle)
    .join(' ');
  return words.every((w) => hay.includes(w));
}

export function hasGenre(item: LibraryItem, key: string | null): boolean {
  return !key || item.genres.some((g) => genreKey(g) === key);
}

/** Häufigste Genres über Bücher und Manga; gleiche Genres unterschiedlicher Schreibweise zählen zusammen. */
export function collectLibraryGenres(
  items: LibraryItem[],
  max = 12
): { key: string; name: string; count: number }[] {
  const byKey = new Map<string, { key: string; name: string; count: number }>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const name of item.genres) {
      const key = genreKey(name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = byKey.get(key) ?? { key, name, count: 0 };
      entry.count += 1;
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || compareText(a.name, b.name))
    .slice(0, max);
}

const compareText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

const sortTitle = (item: LibraryItem) => item.title.replace(ARTICLE, '').trim();

const byTitle = (a: LibraryItem, b: LibraryItem) => compareText(sortTitle(a), sortTitle(b));

const sortValue = (item: LibraryItem, sort: LibrarySortKey): number => {
  switch (sort) {
    case 'added':
      return item.addedAt;
    case 'rating':
      return item.rating;
    case 'progress':
      return item.progress;
    case 'pages':
      return item.size;
    default:
      return item.activityAt;
  }
};

/** Sortiert; Einträge ohne Autor (Manga) stehen bei „Autor" immer hinten, nach Titel. */
export function sortLibrary(items: LibraryItem[], sort: LibrarySortKey, flip: boolean) {
  const dir = LIBRARY_DEFAULT_DESC[sort] !== flip ? -1 : 1;
  const list = [...items];
  if (sort === 'title') return list.sort((a, b) => dir * byTitle(a, b));
  if (sort === 'author') {
    return list.sort((a, b) => {
      if (!a.author || !b.author) return a.author ? -1 : b.author ? 1 : byTitle(a, b);
      return dir * (compareText(a.author, b.author) || byTitle(a, b));
    });
  }
  return list.sort((a, b) => dir * (sortValue(a, sort) - sortValue(b, sort)) || byTitle(a, b));
}

export interface LibraryQuery {
  status: LibraryStatusFilter;
  medium: LibraryMediumFilter;
  query: string;
  genre: string | null;
  sort: LibrarySortKey;
  flip: boolean;
}

/** Status und Medium — die Basis für Genre-Chips und Zähler. */
export const libraryBase = (
  items: LibraryItem[],
  status: LibraryStatusFilter,
  medium: LibraryMediumFilter
): LibraryItem[] => items.filter((i) => matchesStatus(i, status) && matchesMedium(i, medium));

export function filterLibrary(items: LibraryItem[], q: LibraryQuery): LibraryItem[] {
  const narrowed = libraryBase(items, q.status, q.medium).filter(
    (i) => hasGenre(i, q.genre) && matchesLibraryQuery(i, q.query)
  );
  return sortLibrary(narrowed, q.sort, q.flip);
}

/** Beendetes nach Jahr des Abschlusses, neueste Jahre zuerst; ohne Datum unter „other". */
export function groupByYear(items: LibraryItem[], other: string): [string, LibraryItem[]][] {
  const groups = new Map<string, LibraryItem[]>();
  for (const item of items) {
    const key = item.completedAt ? String(new Date(item.completedAt).getFullYear()) : other;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].sort((a, b) =>
    a[0] === other ? 1 : b[0] === other ? -1 : b[0].localeCompare(a[0])
  );
}

/** Buchrücken-Form fürs Regal; Manga zeigen über `manga-<id>` auf ihre Detailseite. */
export function shelfBook(item: LibraryItem): Book {
  const m = item.manga;
  if (item.book || !m) return item.book as Book;
  return {
    id: `manga-${m.anilistId}`,
    title: m.title,
    authors: [],
    cover: m.poster,
    status: m.readStatus,
    currentPage: 0,
    pageCount: item.size || undefined,
    addedAt: m.addedAt ?? '',
    completedAt: m.completedAt,
    rating: item.rating || undefined,
  };
}

export const shelfBooks = (items: LibraryItem[]): Book[] => {
  const byId = new Map<string, Book>();
  for (const item of items) {
    const book = shelfBook(item);
    if (!byId.has(book.id)) byId.set(book.id, book);
  }
  return [...byId.values()];
};

export const libraryHref = (book: Pick<Book, 'id'>): string =>
  book.id.startsWith('manga-')
    ? `/manga/${book.id.slice(6)}`
    : `/books/${encodeURIComponent(book.id)}`;

export const itemHref = (item: LibraryItem): string =>
  item.manga ? `/manga/${item.manga.anilistId}` : libraryHref(shelfBook(item));

export const parseStatusFilter = (value: string | null): LibraryStatusFilter =>
  STATUS_FILTERS.includes(value as LibraryStatusFilter) ? (value as LibraryStatusFilter) : 'all';

export const parseMediumFilter = (value: string | null): LibraryMediumFilter =>
  MEDIUM_FILTERS.includes(value as LibraryMediumFilter) ? (value as LibraryMediumFilter) : 'all';

export interface LibraryPrefs {
  sort: LibrarySortKey;
  flip: boolean;
  view: LibraryView | null;
}

const isSort = (v: unknown): v is LibrarySortKey => LIBRARY_SORTS.includes(v as LibrarySortKey);

const parseSortPref = (raw: string | null) => {
  const [sort, flip] = (raw ?? '').split(':');
  return isSort(sort) ? { sort, flip: flip === '1' } : null;
};

/** Gespeicherte Wahl; beim ersten Mal aus Bücherregal bzw. Manga-Sammlung übernommen. */
export function readLibraryPrefs(get: (key: string) => string | null): LibraryPrefs {
  let sortPref = parseSortPref(get('readingLibrarySort')) ?? parseSortPref(get('bookShelfSort'));
  let mangaPrefs: { sort?: unknown } | null;
  try {
    mangaPrefs = JSON.parse(get('mangaCollectionPrefs') || 'null');
  } catch {
    mangaPrefs = null;
  }
  if (!sortPref && mangaPrefs && isSort(mangaPrefs.sort)) {
    sortPref = { sort: mangaPrefs.sort, flip: false };
  }
  const viewOf = (v: string | null): LibraryView | null =>
    v === 'shelf' || v === 'grid' ? v : null;
  const view =
    viewOf(get('readingLibraryView')) ??
    viewOf(get('bookShelfView')) ??
    (mangaPrefs && typeof mangaPrefs === 'object' ? 'grid' : null);
  return { sort: sortPref?.sort ?? 'recent', flip: sortPref?.flip ?? false, view };
}

export const encodeSortPref = (sort: LibrarySortKey, flip: boolean) => `${sort}:${flip ? 1 : 0}`;
