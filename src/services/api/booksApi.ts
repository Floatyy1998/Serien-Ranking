import type { BookDetails, BookSearchResult } from '../../types/Book';
import { looksLikeIsbn, toIsbn13 } from '../../lib/books/bookIdentity';
import {
  coverAtSize,
  mapDnbRecord,
  mapGoogleDetails,
  mapGoogleVolume,
  mapOpenLibraryDoc,
  stripResult,
  type GoogleVolume,
  type OpenLibraryDoc,
} from '../../lib/books/bookSearchMapping';
import { mergeEditions, orderSeriesVolumes } from '../../lib/books/searchEditions';
import { searchMatch, titlePrefixQuery } from '../../lib/books/searchMatch';
import { cached } from '../books/bookCache';
import { appLocale } from '../i18n';
import { hardcoverDetails, hardcoverIsbn, hardcoverReady, hardcoverSearch } from './hardcoverApi';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const GOOGLE_API = 'https://www.googleapis.com/books/v1';
const OPEN_LIBRARY = 'https://openlibrary.org';
const DNB_SRU = 'https://services.dnb.de/sru/dnb';
const NO_HITS = new Error('no hits');
const OL_FIELDS = [
  'key',
  'title',
  'subtitle',
  'author_name',
  'cover_i',
  'first_publish_year',
  'number_of_pages_median',
  'isbn',
  'language',
  'subject',
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

const googleKey = (): string | undefined => import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || undefined;

/** Ohne Key ist das anonyme Google-Kontingent praktisch immer leer — dann direkt Open Library. */
export const hasGoogleBooks = (): boolean => !!googleKey();

let googleBlockedUntil = 0;

const RETRY_DELAYS = [250, 700];

/** Google Books antwortet auf identische Anfragen zufällig mit 503 — kurz wiederholen statt sofort aufzugeben. */
async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { signal });
    if (res.ok) return (await res.json()) as T;
    if (res.status >= 500 && attempt < RETRY_DELAYS.length && !signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      continue;
    }
    const error = new Error(`HTTP ${res.status}`) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
}

async function searchGoogle(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const key = googleKey();
  if (!key || Date.now() < googleBlockedUntil) throw new Error('google unavailable');
  const q = looksLikeIsbn(query) ? `isbn:${toIsbn13(query) ?? query.replace(/\D/g, '')}` : query;
  const params = new URLSearchParams({
    q,
    maxResults: '24',
    printType: 'books',
    orderBy: 'relevance',
    key,
  });
  try {
    const data = await fetchJson<{ items?: GoogleVolume[] }>(
      `${GOOGLE_API}/volumes?${params.toString()}`,
      signal
    );
    return (data.items ?? []).map(mapGoogleVolume).filter((r): r is BookSearchResult => !!r);
  } catch (err) {
    if ((err as { status?: number }).status === 429) googleBlockedUntil = Date.now() + 10 * 60_000;
    throw err;
  }
}

async function searchOpenLibrary(
  query: string,
  signal?: AbortSignal,
  solrQuery?: string
): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({ limit: '24', fields: OL_FIELDS });
  if (looksLikeIsbn(query)) params.set('isbn', toIsbn13(query) ?? query.replace(/\D/g, ''));
  else params.set('q', solrQuery ?? query);
  params.set('lang', appLocale);
  const data = await fetchJson<{ docs?: OpenLibraryDoc[] }>(
    `${OPEN_LIBRARY}/search.json?${params.toString()}`,
    signal
  );
  return (data.docs ?? []).map(mapOpenLibraryDoc).filter((r): r is BookSearchResult => !!r);
}

async function searchDnb(isbn13: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({
    version: '1.1',
    operation: 'searchRetrieve',
    query: `num=${isbn13}`,
    recordSchema: 'MARC21-xml',
    maximumRecords: '1',
  });
  const res = await fetch(`${DNB_SRU}?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`DNB ${res.status}`);
  const hit = mapDnbRecord(await res.text(), isbn13);
  return hit ? [hit] : [];
}

/**
 * Hardcover kennt die meisten ISBNs samt lokaler Ausgabe; Google und Open Library springen nur ein, wenn es nichts findet
 * (oder pausiert). Die DNB fragt immer mit: sie ist kostenlos und liefert Auflage und Seitenzahl deutscher Ausgaben.
 */
async function searchByIsbn(isbn13: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const settle = (request: Promise<BookSearchResult[]>) =>
    request.catch(() => [] as BookSearchResult[]);
  const [hardcover, dnb] = await Promise.all([
    hardcoverReady()
      ? settle(hardcoverIsbn(isbn13).then((hit) => (hit ? [hit] : [])))
      : Promise.resolve([] as BookSearchResult[]),
    settle(searchDnb(isbn13, signal)),
  ]);
  let primary = hardcover[0];
  if (!primary) {
    const [google, openLibrary] = await Promise.all([
      hasGoogleBooks() ? settle(searchGoogle(isbn13, signal)) : Promise.resolve([]),
      settle(searchOpenLibrary(isbn13, signal)),
    ]);
    primary = google[0] ?? openLibrary[0] ?? dnb[0];
  }
  const national = dnb[0];
  if (!primary || !national || primary === national) return primary ? [primary] : [];
  const weakCover = !primary.cover || /\/b\/isbn\//.test(primary.cover);
  return [
    stripResult({
      ...primary,
      cover: weakCover ? national.cover : primary.cover,
      coverFallback: weakCover ? primary.cover : (primary.coverFallback ?? national.cover),
      authors: primary.authors.length ? primary.authors : national.authors,
      pageCount: primary.pageCount ?? national.pageCount,
      publisher: primary.publisher ?? national.publisher,
      publishedYear: primary.publishedYear ?? national.publishedYear,
      categories: primary.categories ?? national.categories,
      edition: primary.edition ?? national.edition,
      isbn13: primary.isbn13 ?? isbn13,
    }),
  ];
}

/**
 * Treffer mit Cover und Seitenzahl nach oben, Ausgaben desselben Buchs (Sprache, Verlag) als einer.
 * Treffer, in denen die Suchwörter weder im Titel noch beim Autor stehen, fallen weg —
 * außer es bliebe dann gar nichts übrig (Tippfehler, fremde Schreibweise).
 * Bände einer Reihe stehen in Reihenfolge, außer die Suche nennt selbst eine Bandnummer.
 */
export function rankResults(results: BookSearchResult[], query: string): BookSearchResult[] {
  const matched = results.map((r) => ({ r, match: searchMatch(r, query) }));
  const relevant = matched.filter(({ match }) => match.matches);
  const pool = relevant.length ? relevant : matched;
  const unique = mergeEditions(
    pool.map(({ r }) => r),
    appLocale
  );
  const titleHit = (r: BookSearchResult) => {
    const match = searchMatch(r, query);
    return match.inTitle || match.byAuthor;
  };
  const q = query.toLowerCase().trim();
  const score = (r: BookSearchResult) =>
    (r.title.toLowerCase() === q ? 6 : r.title.toLowerCase().startsWith(q) ? 3 : 0) +
    (titleHit(r) ? 3 : 0) +
    (r.cover ? 2 : 0) +
    (r.pageCount ? 1 : 0) +
    (r.authors.length ? 1 : 0) +
    (r.language === appLocale ? 1 : 0) +
    Math.min(5, Math.log10((r.popularity ?? 0) + 1) * 1.4);
  const ranked = unique
    .map((r, index) => ({ r, index, s: score(r) }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .map(({ r }) => r);
  return /\d/.test(query) ? ranked : orderSeriesVolumes(ranked);
}

export async function searchBooks(
  query: string,
  signal?: AbortSignal
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  // e3: Hardcover als erste Quelle (e2: Ausgaben zusammengefasst) — alte Listen im Cache verdrängt das LRU nach und nach.
  const source = hardcoverReady() ? 'h' : hasGoogleBooks() ? 'g' : 'o';
  const key = `e3:${appLocale}:${source}:${trimmed.toLowerCase()}`;
  const results = await cached(
    'search',
    key,
    6 * HOUR,
    async () => {
      const found = await runSearch(trimmed, undefined, { typing: true });
      if (!found.length) throw NO_HITS;
      return found;
    },
    40
  ).catch((err) => {
    if (err === NO_HITS) return [] as BookSearchResult[];
    throw err;
  });
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
  return results.map((r) => (r.authors ? r : { ...r, authors: [] }));
}

/**
 * typing: Suche beim Tippen — Open Library fragt zusätzlich den Titel mit angefangenem letzten Wort ab.
 * hardcover: false für Hintergrund-Abfragen (Verfilmungs-Brücke, Reihenteile) — die schonen das Tageskontingent.
 */
async function runSearch(
  trimmed: string,
  signal?: AbortSignal,
  options: { typing?: boolean; google?: boolean; hardcover?: boolean } = {}
): Promise<BookSearchResult[]> {
  if (looksLikeIsbn(trimmed)) {
    return searchByIsbn(toIsbn13(trimmed) ?? trimmed.replace(/\D/g, ''), signal);
  }
  let primary: BookSearchResult[] = [];
  if (options.hardcover !== false && hardcoverReady()) {
    try {
      primary = await hardcoverSearch(trimmed, signal);
      // Hardcover findet angefangene Wörter („fourth wi") nicht — dann ergänzen die anderen Quellen.
      if (primary.some((r) => searchMatch(r, trimmed).matches))
        return rankResults(primary, trimmed);
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  if (options.google !== false && hasGoogleBooks()) {
    try {
      const google = await searchGoogle(trimmed, signal);
      if (google.length) return rankResults([...primary, ...google], trimmed);
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  const titleQuery = options.typing ? titlePrefixQuery(trimmed) : null;
  const [general, byTitle] = await Promise.all([
    searchOpenLibrary(trimmed, signal),
    titleQuery
      ? searchOpenLibrary(trimmed, signal, titleQuery).catch(() => [] as BookSearchResult[])
      : Promise.resolve([] as BookSearchResult[]),
  ]);
  const generalFits = general.some((r) => searchMatch(r, trimmed).matches);
  return rankResults([...primary, ...(generalFits ? general : [...byTitle, ...general])], trimmed);
}

async function loadDetails(ref: {
  hardcoverId?: number;
  googleId?: string;
  olWorkId?: string;
}): Promise<BookDetails | null> {
  if (ref.hardcoverId && hardcoverReady()) {
    const details = await hardcoverDetails(ref.hardcoverId);
    if (details?.description) return details;
  }
  if (ref.googleId && hasGoogleBooks()) {
    try {
      const volume = await fetchJson<GoogleVolume>(
        `${GOOGLE_API}/volumes/${encodeURIComponent(ref.googleId)}?key=${googleKey()}`
      );
      return mapGoogleDetails(volume);
    } catch {
      /* Open Library versuchen */
    }
  }
  if (ref.olWorkId) {
    const work = await fetchJson<{
      description?: string | { value?: string };
      subjects?: string[];
    }>(`${OPEN_LIBRARY}/works/${encodeURIComponent(ref.olWorkId)}.json`);
    const description =
      typeof work.description === 'string' ? work.description : work.description?.value;
    return {
      description: description
        ?.replace(/\r\n/g, '\n')
        .split(/\n-{3,}|\n\(\[source\]/)[0]
        .trim(),
      categories: work.subjects?.slice(0, 4),
      infoLink: `${OPEN_LIBRARY}/works/${ref.olWorkId}`,
    };
  }
  return null;
}

export function getBookDetails(ref: {
  hardcoverId?: number;
  googleId?: string;
  olWorkId?: string;
}): Promise<BookDetails | null> {
  const key = ref.hardcoverId ? `hc${ref.hardcoverId}` : (ref.googleId ?? ref.olWorkId);
  if (!key) return Promise.resolve(null);
  return cached(
    'details',
    `${appLocale}:${key}`,
    14 * DAY,
    async () => {
      const details = await loadDetails(ref);
      if (!details) throw new Error('no details');
      return details;
    },
    120
  ).catch(() => null);
}

async function lookupBook(title: string, author?: string): Promise<BookSearchResult | null> {
  const last = author?.toLowerCase().split(/\s+/).pop() ?? '';
  const byAuthor = (list: BookSearchResult[]) =>
    last ? list.find((r) => r.authors.some((a) => a.toLowerCase().includes(last))) : list[0];
  const queries = author ? [`${title} ${author}`, title, `${title} ${last}`] : [title];
  for (const [index, query] of queries.entries()) {
    // Ohne Google: das Tageskontingent (1.000) bleibt für Suche und Detailseiten.
    const results = await runSearch(query, undefined, { google: false, hardcover: false }).catch(
      () => [] as BookSearchResult[]
    );
    const hit = byAuthor(results) ?? (index === 0 ? results[0] : undefined);
    if (hit) return hit;
  }
  return null;
}

/** Erster brauchbarer Treffer für Titel + Autor (Verfilmungs-Brücke, „Bücher zu deinen Serien"). Fehlschläge werden nicht gemerkt. */
export function findBook(title: string, author?: string): Promise<BookSearchResult | null> {
  const key = `${appLocale}:${title}|${author ?? ''}`.toLowerCase();
  return cached(
    'find',
    key,
    14 * DAY,
    async () => {
      const hit = await lookupBook(title, author);
      if (!hit) throw new Error('not found');
      return hit;
    },
    120
  ).catch(() => null);
}

const coverProbe = new Map<string, Promise<boolean>>();

/** Lädt ein Bild probeweise — Open Library liefert mit default=false einen 404 statt Platzhalter. */
export function probeImage(url: string, timeoutMs = 5000): Promise<boolean> {
  let pending = coverProbe.get(url);
  if (!pending) {
    pending = new Promise<boolean>((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(false), timeoutMs);
      img.onload = () => {
        clearTimeout(timer);
        resolve(img.naturalWidth > 20 && img.naturalHeight > 20);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      img.src = url;
    });
    coverProbe.set(url, pending);
  }
  return pending;
}

/** Prüft über den schnellen Spiegel, speichert aber die Original-URL. */
export async function resolveCover(result: BookSearchResult): Promise<string | undefined> {
  for (const url of [result.cover, result.coverFallback]) {
    if (!url) continue;
    const quick = coverAtSize(url, 'M');
    if ((quick && quick !== url && (await probeImage(quick))) || (await probeImage(url))) {
      return url;
    }
  }
  return undefined;
}
