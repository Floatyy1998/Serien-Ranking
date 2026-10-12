import type { BookDetails, BookSearchResult } from '../../types/Book';
import { bookMatchKey, looksLikeIsbn, toIsbn13 } from '../../lib/books/bookIdentity';
import {
  coverAtSize,
  mapGoogleDetails,
  mapGoogleVolume,
  mapOpenLibraryDoc,
  type GoogleVolume,
  type OpenLibraryDoc,
} from '../../lib/books/bookSearchMapping';
import { cached } from '../books/bookCache';
import { appLocale } from '../i18n';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const GOOGLE_API = 'https://www.googleapis.com/books/v1';
const OPEN_LIBRARY = 'https://openlibrary.org';
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

async function searchOpenLibrary(query: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  const params = new URLSearchParams({ limit: '24', fields: OL_FIELDS });
  if (looksLikeIsbn(query)) params.set('isbn', toIsbn13(query) ?? query.replace(/\D/g, ''));
  else params.set('q', query);
  params.set('lang', appLocale);
  const data = await fetchJson<{ docs?: OpenLibraryDoc[] }>(
    `${OPEN_LIBRARY}/search.json?${params.toString()}`,
    signal
  );
  return (data.docs ?? []).map(mapOpenLibraryDoc).filter((r): r is BookSearchResult => !!r);
}

/** Treffer mit Cover und Seitenzahl nach oben, Dubletten (gleicher Titel + Autor) raus. */
export function rankResults(results: BookSearchResult[], query: string): BookSearchResult[] {
  const q = query.toLowerCase().trim();
  const richness = (r: BookSearchResult) =>
    (r.description ? 3 : 0) + (r.pageCount ? 2 : 0) + (r.cover ? 1 : 0) + (r.isbn13 ? 1 : 0);
  const byKey = new Map<string, number>();
  const unique: BookSearchResult[] = [];
  for (const r of results) {
    const key = bookMatchKey(r.title, r.authors);
    const at = byKey.get(key);
    if (at === undefined) {
      byKey.set(key, unique.length);
      unique.push(r);
    } else if (richness(r) > richness(unique[at])) {
      unique[at] = r;
    }
  }
  const score = (r: BookSearchResult) =>
    (r.title.toLowerCase() === q ? 6 : r.title.toLowerCase().startsWith(q) ? 3 : 0) +
    (r.cover ? 2 : 0) +
    (r.pageCount ? 1 : 0) +
    (r.authors.length ? 1 : 0) +
    (r.language === appLocale ? 1 : 0) +
    Math.min(5, Math.log10((r.popularity ?? 0) + 1) * 1.4);
  return unique
    .map((r, index) => ({ r, index, s: score(r) }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .map(({ r }) => r);
}

export async function searchBooks(
  query: string,
  signal?: AbortSignal
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const key = `${appLocale}:${hasGoogleBooks() ? 'g' : 'o'}:${trimmed.toLowerCase()}`;
  const results = await cached('search', key, 6 * HOUR, () => runSearch(trimmed), 40);
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
  return results;
}

async function runSearch(trimmed: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  if (hasGoogleBooks()) {
    try {
      const google = await searchGoogle(trimmed, signal);
      if (google.length) return rankResults(google, trimmed);
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    }
  }
  return rankResults(await searchOpenLibrary(trimmed, signal), trimmed);
}

async function loadDetails(ref: {
  googleId?: string;
  olWorkId?: string;
}): Promise<BookDetails | null> {
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
  googleId?: string;
  olWorkId?: string;
}): Promise<BookDetails | null> {
  const key = ref.googleId ?? ref.olWorkId;
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
    const results = await runSearch(query).catch(() => [] as BookSearchResult[]);
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
