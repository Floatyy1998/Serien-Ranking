import { bookMatchKey } from '../../lib/books/bookIdentity';
import { mapOpenLibraryDoc, type OpenLibraryDoc } from '../../lib/books/bookSearchMapping';
import type { BookSearchResult } from '../../types/Book';
import { cached, cacheGet, cacheSet } from '../books/bookCache';
import { loadStaticShelf } from './bookStatic';
import { appLocale } from '../i18n';
import {
  hardcoverAuthorBooks,
  hardcoverBrowse,
  hardcoverReady,
  type HardcoverSort,
} from './hardcoverApi';

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
  'ratings_average',
  'ratings_count',
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

/** popular = meistgelesen, top = bestbewertet, gems = stark bewertet abseits der Bestseller, recent = letzte Jahre. */
export type ShelfSort = 'popular' | 'top' | 'gems' | 'recent';

/** Kinder und Jugend trennt Open Library nicht verlässlich — daher nur Erwachsene gegen Jugend & Kinder. */
export type ShelfAudience = 'adult' | 'young';

export interface ShelfOptions {
  sort?: ShelfSort;
  theme?: string;
  audience?: ShelfAudience;
  limit?: number;
}

const AUDIENCE_QUERY: Record<ShelfAudience, string> = {
  adult: ' -subject:juvenile_fiction -subject:young_adult_fiction',
  young: ' (subject:juvenile_fiction OR subject:young_adult_fiction)',
};

/** Genres, bei denen sich die Zielgruppe wählen lässt (Young Adult ist selbst eine, Sachbuch schließt Fiction aus). */
export const SHELF_AUDIENCES: ShelfId[] = ['fantasy', 'thriller', 'romance', 'scifi', 'horror'];

const SHELF_QUERY: Record<ShelfId, (year: number) => string> = {
  new: (year) => `first_publish_year:[${year - 3} TO ${year}]`,
  fantasy: () => 'subject:fantasy',
  thriller: () => 'subject:thriller',
  romance: () => 'subject:romance',
  scifi: () => 'subject:"science fiction"',
  classics: () => 'subject:classics',
  ya: () => 'subject:young_adult_fiction',
  horror: () =>
    '(subject:"horror fiction" OR subject:"fiction, horror" OR subject:"horror tales" OR subject:"horror stories")',
  nonfiction: () => 'subject:nonfiction -subject:fiction',
};

const SORT_QUERY: Record<ShelfSort, { filter: (year: number) => string; sort: string }> = {
  popular: { filter: () => '', sort: 'readinglog' },
  top: { filter: () => ' ratings_count:[15 TO *]', sort: 'rating' },
  gems: { filter: () => ' readinglog_count:[15 TO 800] ratings_count:[4 TO *]', sort: 'rating' },
  recent: { filter: (year) => ` first_publish_year:[${year - 6} TO ${year}]`, sort: 'readinglog' },
};

/** Sortierungen je Regal — bei „Neu" sind Bewertungen noch zu dünn für „top". */
export const SHELF_SORTS: Record<ShelfId, ShelfSort[]> = {
  new: ['popular', 'gems'],
  fantasy: ['top', 'gems', 'recent', 'popular'],
  thriller: ['top', 'gems', 'recent', 'popular'],
  romance: ['top', 'gems', 'recent', 'popular'],
  scifi: ['top', 'gems', 'recent', 'popular'],
  classics: ['top', 'gems', 'popular'],
  ya: ['top', 'gems', 'recent', 'popular'],
  horror: ['top', 'gems', 'recent', 'popular'],
  nonfiction: ['top', 'gems', 'recent', 'popular'],
};

/** Untergenres als Open-Library-Schlagworte — ersetzen die Genre-Abfrage. */
export const SHELF_THEMES: Partial<Record<ShelfId, Record<string, string>>> = {
  fantasy: {
    epic: 'subject:"fantasy, epic"',
    romantasy: 'subject:fantasy subject:romance',
    dragons: 'subject:fantasy subject:dragons',
    urban: '(subject:"fantasy, urban" OR subject:"urban fantasy")',
    historical: 'subject:"fantasy, historical"',
  },
  thriller: {
    psycho:
      '(subject:"thrillers, psychological" OR subject:"psychological thriller" OR (subject:suspense subject:"psychological fiction"))',
    police: 'subject:"police procedural"',
    whodunit: 'subject:"detective and mystery stories" subject:"private investigators"',
    serial: 'subject:"serial murderers"',
    spy: 'subject:"spy stories"',
    legal: 'subject:"legal stories"',
  },
  romance: {
    contemporary: 'subject:"romance, contemporary"',
    historical: 'subject:"romance, historical"',
    romantasy: 'subject:romance subject:fantasy',
    paranormal: 'subject:"romance, paranormal"',
    suspense: 'subject:"romance, suspense"',
    queer: 'subject:romance (subject:lgbtq OR subject:"gay men" OR subject:lesbians)',
  },
  scifi: {
    space: '(subject:"space opera" OR subject:"science fiction, space opera")',
    dystopia: '(subject:dystopias OR subject:dystopian)',
    aliens: 'subject:"life on other planets"',
    time: 'subject:"time travel"',
    ai: 'subject:"science fiction" subject:"artificial intelligence"',
    apocalypse:
      'subject:"science fiction" (subject:"end of the world" OR subject:"science fiction, apocalyptic")',
    hard: 'subject:"science fiction, hard science fiction"',
  },
  ya: {
    fantasy: 'subject:young_adult_fiction subject:fantasy',
    romance: 'subject:young_adult_fiction subject:romance',
    mystery: 'subject:young_adult_fiction subject:mystery',
    coming: 'subject:young_adult_fiction subject:"coming of age"',
  },
  classics: {
    german: 'subject:classics subject:"german literature"',
    english: 'subject:classics subject:"english literature"',
    american: 'subject:classics subject:"american literature"',
    french: 'subject:classics subject:"french literature"',
    russian: 'subject:classics subject:"russian literature"',
  },
  horror: {
    ghosts: 'subject:horror subject:ghosts',
    vampires: 'subject:horror subject:vampires',
    gothic: '(subject:"gothic fiction" OR (subject:horror subject:gothic))',
    occult: 'subject:horror (subject:demonology OR subject:occult OR subject:witchcraft)',
    short: 'subject:horror subject:"short stories"',
  },
  nonfiction: {
    biography: 'subject:nonfiction subject:biography -subject:fiction',
    history: 'subject:nonfiction subject:history -subject:fiction',
    science:
      '(subject:"popular science" OR subject:"science, popular works" OR (subject:nonfiction subject:physics) OR (subject:nonfiction subject:biology))',
    psychology: 'subject:nonfiction subject:psychology -subject:fiction',
    philosophy: 'subject:nonfiction subject:philosophy -subject:fiction',
    selfhelp: 'subject:"self-help" -subject:fiction',
  },
};

const memory = new Map<string, Promise<unknown>>();

async function olSearchPage(
  q: string,
  limit: number,
  sort = 'readinglog',
  offset = 0
): Promise<{ items: BookSearchResult[]; raw: number }> {
  const params = new URLSearchParams({
    q,
    sort,
    limit: String(limit),
    lang: appLocale,
    fields: FIELDS,
  });
  if (offset) params.set('offset', String(offset));
  const res = await fetch(`${OPEN_LIBRARY}/search.json?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  const seen = new Set<string>();
  const docs = data.docs ?? [];
  const items = docs.map(mapOpenLibraryDoc).filter((r): r is BookSearchResult => {
    if (!r?.cover) return false;
    const key = bookMatchKey(r.title, r.authors);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items, raw: docs.length };
}

const olSearch = async (q: string, limit: number, sort?: string) =>
  (await olSearchPage(q, limit, sort)).items;

/** Hardcover liefert Genre, Untergenre, Zielgruppe und Sortierung serverseitig; Treffer ohne Cover und Dubletten fliegen raus. */
async function hardcoverShelf(
  id: ShelfId,
  { sort = 'popular', theme, audience }: ShelfOptions,
  page: number
): Promise<{ items: BookSearchResult[]; done: boolean }> {
  const out = await hardcoverBrowse({
    shelf: id,
    sort: sort as HardcoverSort,
    theme,
    audience,
    page,
  });
  const seen = new Set<string>();
  const items = out.items.filter((r) => {
    if (!r.cover) return false;
    const key = bookMatchKey(r.title, r.authors);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { items, done: out.done };
}

function cachedSearch<T>(key: string, load: () => Promise<T>): Promise<T> {
  let pending = memory.get(key) as Promise<T> | undefined;
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

const SHELF_CACHE = 'shelf';
const SHELF_TTL = 86_400_000;
const SHELF_CACHE_ENTRIES = 40;

const knownTheme = (id: ShelfId, theme: string | undefined) =>
  theme && SHELF_THEMES[id]?.[theme] ? theme : undefined;

const knownAudience = (id: ShelfId, audience: ShelfAudience | undefined) =>
  audience && AUDIENCE_QUERY[audience] && SHELF_AUDIENCES.includes(id) ? audience : undefined;

const shelfKey = (id: ShelfId, { sort = 'popular', theme, audience, limit = 24 }: ShelfOptions) =>
  `h2:${appLocale}:${id}:${sort}:${knownTheme(id, theme) ?? ''}:${knownAudience(id, audience) ?? ''}:${limit}`;

/** Nur Kartenfelder, damit viele Regale zusammen nur ein paar Dutzend KB belegen. */
const compactResult = (r: BookSearchResult): BookSearchResult => ({
  id: r.id,
  title: r.title,
  authors: r.authors.slice(0, 1),
  cover: r.cover,
  pageCount: r.pageCount,
  publishedYear: r.publishedYear,
  isbn13: r.isbn13,
  olWorkId: r.olWorkId,
  hardcoverId: r.hardcoverId,
  coverFallback: r.coverFallback,
  series: r.series,
  language: r.language,
  source: r.source,
  popularity: r.popularity,
  avgRating: r.avgRating,
  ratingCount: r.ratingCount,
});

function shelfQuery(id: ShelfId, { sort = 'popular', theme, audience }: ShelfOptions) {
  const themeQuery = theme ? SHELF_THEMES[id]?.[theme] : undefined;
  const audienceQuery = audience ? AUDIENCE_QUERY[audience] : '';
  const year = new Date().getFullYear();
  return `${themeQuery ?? SHELF_QUERY[id](year)}${audienceQuery}${SORT_QUERY[sort].filter(year)}${languageFilter()}`;
}

/** Regal fürs Stöbern in der App-Sprache — vorberechnet vom Backend, sonst live bei Open Library. */
export function fetchShelf(id: ShelfId, options: ShelfOptions = {}): Promise<BookSearchResult[]> {
  const { sort = 'popular', limit = 24 } = options;
  const theme = knownTheme(id, options.theme);
  const audience = knownAudience(id, options.audience);
  const query = shelfQuery(id, { sort, theme, audience });
  const key = shelfKey(id, options);
  return cachedSearch(key, async () => {
    const stored = cacheGet<BookSearchResult[]>(SHELF_CACHE, key, SHELF_TTL);
    if (stored) return stored;
    const prebuilt =
      theme || audience
        ? null
        : await loadStaticShelf(sort === 'popular' ? id : `${id}:${sort}`).catch(() => null);
    let list: BookSearchResult[] | null =
      prebuilt && prebuilt.length >= 8 ? prebuilt.slice(0, limit) : null;
    if (!list && hardcoverReady()) {
      const live = await hardcoverShelf(id, { sort, theme, audience }, 1).catch(() => null);
      if (live && live.items.length >= 8) list = live.items.slice(0, limit);
    }
    if (!list) list = await olSearch(query, limit, SORT_QUERY[sort].sort);
    cacheSet(SHELF_CACHE, key, list.map(compactResult), SHELF_CACHE_ENTRIES);
    return list;
  });
}

export const SHELF_PAGE_SIZE = 60;

export interface CatalogOptions {
  mood?: string;
  sort?: ShelfSort;
  audience?: ShelfAudience;
}

/** Eine Seite (25 Bücher, Seiten ab 1) eines Katalog-Genres, optional gefiltert nach Stimmung — nur über Hardcover. */
export function fetchCatalogPage(
  genre: string | undefined,
  options: CatalogOptions,
  page: number
): Promise<{ items: BookSearchResult[]; done: boolean }> {
  const { mood, sort = 'popular', audience } = options;
  const key = `catalog:${appLocale}:${genre ?? ''}:${mood ?? ''}:${sort}:${audience ?? ''}:${page}`;
  return cachedSearch(key, async () => {
    if (!hardcoverReady()) throw new Error('Hardcover pausiert');
    const out = await hardcoverBrowse({ genre, mood, sort, audience, page });
    const seen = new Set<string>();
    const items = out.items.filter((r) => {
      if (!r.cover) return false;
      const dedupe = bookMatchKey(r.title, r.authors);
      if (seen.has(dedupe)) return false;
      seen.add(dedupe);
      return true;
    });
    return { items, done: out.done };
  });
}

/** Folgeseite (ab 1) eines Regals, immer live — der Tagesexport deckt nur den Anfang ab. */
export function fetchShelfPage(
  id: ShelfId,
  options: ShelfOptions,
  page: number
): Promise<{ items: BookSearchResult[]; done: boolean }> {
  const { sort = 'popular' } = options;
  const theme = knownTheme(id, options.theme);
  const audience = knownAudience(id, options.audience);
  const key = `page:${shelfKey(id, { sort, theme, audience, limit: SHELF_PAGE_SIZE })}:${page}`;
  return cachedSearch(key, async () => {
    if (hardcoverReady()) {
      const live = await hardcoverShelf(id, { sort, theme, audience }, page + 1).catch(() => null);
      if (live && (live.items.length || page > 0)) return live;
    }
    const { items, raw } = await olSearchPage(
      shelfQuery(id, { sort, theme, audience }),
      SHELF_PAGE_SIZE,
      SORT_QUERY[sort].sort,
      page * SHELF_PAGE_SIZE
    );
    return { items, done: raw < SHELF_PAGE_SIZE };
  });
}

/** Sofort verfügbares Regal aus dem Tages-Cache — ohne Netzanfrage. */
export function peekShelf(id: ShelfId, options: ShelfOptions = {}): BookSearchResult[] | null {
  return cacheGet<BookSearchResult[]>(SHELF_CACHE, shelfKey(id, options), SHELF_TTL) ?? null;
}

try {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('bookShelf:')) localStorage.removeItem(key);
  }
} catch {
  /* Alt-Cache der ersten Version */
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
    `h2:${appLocale}:${name}`,
    3 * 86_400_000,
    async () => {
      if (hardcoverReady()) {
        const own = await hardcoverAuthorBooks(name).catch(() => []);
        if (own.length >= 3) return own.filter((r) => !!r.cover).slice(0, 24);
      }
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
