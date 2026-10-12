import { bookMatchKey } from '../../lib/books/bookIdentity';
import { mapOpenLibraryDoc, type OpenLibraryDoc } from '../../lib/books/bookSearchMapping';
import type { BookSearchResult } from '../../types/Book';
import { cached } from '../books/bookCache';
import { loadStaticShelf } from './bookStatic';
import { appLocale } from '../i18n';

const OPEN_LIBRARY = 'https://openlibrary.org';
const FIELDS = [
  'key',
  'title',
  'subtitle',
  'author_name',
  'cover_i',
  'first_publish_year',
  'number_of_pages_median',
  'isbn',
  'language',
  'publisher',
  'readinglog_count',
  'edition_count',
  'editions',
  'editions.key',
  'editions.title',
  'editions.subtitle',
  'editions.cover_i',
  'editions.language',
  'editions.isbn',
  'editions.number_of_pages',
  'editions.publisher',
].join(',');

const OL_LANGUAGE: Record<string, string> = {
  de: 'ger',
  en: 'eng',
  es: 'spa',
  fr: 'fre',
  pt: 'por',
};

export type ShelfId =
  | 'new'
  | 'fantasy'
  | 'thriller'
  | 'romance'
  | 'scifi'
  | 'classics'
  | 'ya'
  | 'horror'
  | 'nonfiction';

const SHELF_QUERY: Record<ShelfId, (year: number) => string> = {
  new: (year) => `first_publish_year:[${year - 3} TO ${year}]`,
  fantasy: () => 'subject:fantasy',
  thriller: () => 'subject:thriller',
  romance: () => 'subject:romance',
  scifi: () => 'subject:science_fiction',
  classics: () => 'subject:classics',
  ya: () => 'subject:young_adult_fiction',
  horror: () => 'subject:horror',
  nonfiction: () => 'subject:nonfiction',
};

const memory = new Map<string, Promise<BookSearchResult[]>>();

async function olSearch(q: string, limit: number): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    q,
    sort: 'readinglog',
    limit: String(limit),
    lang: appLocale,
    fields: FIELDS,
  });
  const res = await fetch(`${OPEN_LIBRARY}/search.json?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  const seen = new Set<string>();
  return (data.docs ?? []).map(mapOpenLibraryDoc).filter((r): r is BookSearchResult => {
    if (!r?.cover) return false;
    const key = bookMatchKey(r.title, r.authors);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cachedSearch(key: string, load: () => Promise<BookSearchResult[]>) {
  let pending = memory.get(key);
  if (!pending) {
    pending = load().catch((err) => {
      memory.delete(key);
      throw err;
    });
    memory.set(key, pending);
  }
  return pending;
}

const languageFilter = () => (OL_LANGUAGE[appLocale] ? ` language:${OL_LANGUAGE[appLocale]}` : '');

/** Regal fürs Stöbern: beliebteste Ausgaben in der App-Sprache. */
export function fetchShelf(id: ShelfId, limit = 24): Promise<BookSearchResult[]> {
  const year = new Date().getFullYear();
  const query = `${SHELF_QUERY[id](year)}${languageFilter()}`;
  const key = `shelf:${appLocale}:${id}:${limit}`;
  return cachedSearch(key, async () => {
    const stored = readShelfCache(key);
    if (stored) return stored;
    const prebuilt = await loadStaticShelf(id).catch(() => null);
    if (prebuilt && prebuilt.length >= 8) {
      const list = prebuilt.slice(0, limit);
      memoryShelves.set(key, list);
      return list;
    }
    const list = await olSearch(query, limit);
    writeShelfCache(key, list);
    return list;
  });
}

/** Sofort verfügbares Regal aus Speicher oder Tages-Cache — ohne Netzanfrage. */
export function peekShelf(id: ShelfId, limit = 24): BookSearchResult[] | null {
  return readShelfCache(`shelf:${appLocale}:${id}:${limit}`);
}

const SHELF_CACHE_PREFIX = 'bookShelf:';
const SHELF_TTL = 86_400_000;
const memoryShelves = new Map<string, BookSearchResult[]>();

/** Kompakt (nur Kartenfelder), damit neun Regale zusammen nur ein paar Dutzend KB belegen. */
function writeShelfCache(key: string, list: BookSearchResult[]) {
  memoryShelves.set(key, list);
  const compact = list.map((r) => ({
    id: r.id,
    title: r.title,
    authors: r.authors.slice(0, 1),
    cover: r.cover,
    pageCount: r.pageCount,
    publishedYear: r.publishedYear,
    isbn13: r.isbn13,
    olWorkId: r.olWorkId,
    language: r.language,
    source: r.source,
  }));
  try {
    localStorage.setItem(
      SHELF_CACHE_PREFIX + key,
      JSON.stringify({ at: Date.now(), list: compact })
    );
  } catch {
    /* Cache ist optional */
  }
}

function readShelfCache(key: string): BookSearchResult[] | null {
  const mem = memoryShelves.get(key);
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(SHELF_CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { at: number; list: BookSearchResult[] };
    if (Date.now() - entry.at > SHELF_TTL || !Array.isArray(entry.list)) return null;
    memoryShelves.set(key, entry.list);
    return entry.list;
  } catch {
    return null;
  }
}

/** Weitere Bücher derselben Person, ohne das gerade gezeigte. */
export function fetchMoreByAuthor(
  author: string,
  excludeTitle: string
): Promise<BookSearchResult[]> {
  const exclude = bookMatchKey(excludeTitle, [author]).split('|')[0];
  const name = author.replace(/"/g, '');
  return cached(
    'author',
    `${appLocale}:${name}`,
    3 * 86_400_000,
    async () => {
      let list = await olSearch(`author:"${name}"${languageFilter()}`, 24);
      if (list.length < 4) list = await olSearch(`author:"${name}"`, 24);
      return list;
    },
    60
  ).then((list) => list.filter((r) => bookMatchKey(r.title, r.authors).split('|')[0] !== exclude));
}

/** Kurzbeschreibung aus Wikipedia (REST-Summary) — Fallback, wenn Google/Open Library nichts Lesbares liefern. */
export async function fetchWikipediaSummary(lang: string, title: string): Promise<string | null> {
  try {
    const text = await cached(
      'wiki',
      `${lang}:${title}`,
      14 * 86_400_000,
      async () => {
        const res = await fetch(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
        );
        if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
        const data = (await res.json()) as { extract?: string; type?: string };
        return data.type === 'disambiguation' ? '' : (data.extract ?? '');
      },
      80
    );
    return text || null;
  } catch {
    return null;
  }
}
