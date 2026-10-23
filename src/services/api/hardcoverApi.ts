import {
  dnbCoverUrl,
  openLibraryCoverByIsbn,
  stripUndefined,
} from '../../lib/books/bookSearchMapping';
import type {
  BookDetails,
  BookSearchResult,
  BookSeriesInfo,
  BookSeriesPart,
} from '../../types/Book';
import { cacheGet, cacheSet, cached } from '../books/bookCache';
import { appLocale } from '../i18n';
import { backendFetch, hasBackendSession } from './backendApi';

const DAY = 86_400_000;
const TIMEOUT_MS = 20_000;

/** Antwort des Backend-Proxys (/hc/*) — Hardcover-Token und Kontingent bleiben auf dem Server. */
export interface HcItem {
  id: string;
  hardcoverId: number;
  title: string;
  subtitle?: string;
  authors?: string[];
  cover?: string;
  coverFallback?: string;
  pageCount?: number;
  publishedYear?: number;
  publisher?: string;
  language?: string;
  categories?: string[];
  isbn13?: string;
  description?: string;
  popularity?: number;
  avgRating?: number;
  ratingCount?: number;
  series?: { name: string; position?: number; hardcoverId?: number };
}

export class HardcoverError extends Error {
  constructor(
    readonly code: string,
    message?: string,
    readonly status?: number
  ) {
    super(message ?? code);
  }
}

let pausedUntil = 0;
const pause = (ms: number) => {
  pausedUntil = Math.max(pausedUntil, Date.now() + ms);
};

/** Falsch, solange Hardcover nicht erreichbar oder das Tageskontingent leer ist — dann greifen Google/Open Library. */
export const hardcoverReady = (): boolean => Date.now() >= pausedUntil;

/** Diese Routen gibt der Proxy auch Gästen frei (Onboarding vor der Registrierung), alle anderen verlangen Login. */
const GUEST_PATHS = new Set(['/hc/search', '/hc/isbn', '/hc/browse']);

let failureCount = 0;
/** Zählt endgültig gescheiterte Abfragen — ein „nicht gefunden" zählt nur, wenn Hardcover dabei auch geantwortet hat. */
export const hardcoverFailureCount = (): number => failureCount;

/** Harte Fehler (Kontingent, Konfiguration) pausieren sofort; weiche (busy, upstream, network) erst, wenn sie sich häufen. */
const HARD_PAUSE_BY_CODE: Record<string, number> = {
  budget: 15 * 60_000,
  cap: 15 * 60_000,
  config: 30 * 60_000,
};
const SOFT_PAUSE_BY_CODE: Record<string, number> = {
  busy: 20_000,
  upstream: 60_000,
  network: 30_000,
};
const KNOWN_CODES = new Set([
  ...Object.keys(HARD_PAUSE_BY_CODE),
  ...Object.keys(SOFT_PAUSE_BY_CODE),
]);
const SOFT_FAILURES_BEFORE_PAUSE = 3;
const SOFT_WINDOW_MS = 60_000;
const RETRY_DELAY_MS = 1200;
let softFailures: number[] = [];

/** Einzelne Ausreißer (Warteschlange beim Server, Funkloch) sollen nicht gleich alle Hardcover-Daten für Minuten abschalten. */
function noteSoftFailure(code: string) {
  const now = Date.now();
  softFailures = [...softFailures.filter((at) => now - at < SOFT_WINDOW_MS), now];
  if (softFailures.length >= SOFT_FAILURES_BEFORE_PAUSE) {
    pause(SOFT_PAUSE_BY_CODE[code] ?? 30_000);
    softFailures = [];
  }
}

async function attempt<T>(
  path: string,
  body: Record<string, unknown>,
  signal: AbortSignal | undefined,
  background: boolean,
  firstTry: boolean
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  try {
    // Hintergrund-Abfragen weist der Server bei Andrang absichtlich ab (503/429) — das ist kein Befund.
    // Ein 503 beim ersten Versuch auch nicht: post() wiederholt ihn, gemeldet wird erst das endgültige Scheitern.
    const res = await backendFetch(
      path,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: appLocale, ...(background ? { bg: true } : {}), ...body }),
        signal: controller.signal,
      },
      background ? { quietStatuses: [429, 503] } : firstTry ? { quietStatuses: [503] } : undefined
    );
    if (!res.ok) {
      const code = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
      // Nur bekannte Codes zählen; ein 429 anderer Herkunft (allgemeine Bremse) ist nur kurz „busy“, nie eine Stundenpause.
      const known =
        code && KNOWN_CODES.has(code)
          ? code
          : res.status === 429
            ? 'busy'
            : res.status === 404 || res.status === 401
              ? 'config'
              : 'upstream';
      throw new HardcoverError(known, `HTTP ${res.status}`, res.status);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof HardcoverError) throw err;
    if (signal?.aborted) throw err;
    throw new HardcoverError('network', (err as Error).message);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

async function post<T>(
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
  background = false
): Promise<T> {
  if (!hardcoverReady()) throw new HardcoverError('paused');
  if (!GUEST_PATHS.has(path) && !hasBackendSession()) throw new HardcoverError('guest');
  let last: HardcoverError | null = null;
  for (let round = 0; round < 2; round++) {
    try {
      return await attempt<T>(path, body, signal, background, round === 0);
    } catch (err) {
      if (!(err instanceof HardcoverError)) throw err;
      last = err;
      const hard = HARD_PAUSE_BY_CODE[err.code];
      if (hard) {
        pause(hard);
        failureCount++;
        throw err;
      }
      // Weiche Fehler einmal nach kurzer Pause wiederholen — meist war nur die Warteschlange beim Server voll.
      // Ein 429 der Ratenbremse würde durch die Wiederholung nur doppelt zählen.
      if (err.status === 429 || signal?.aborted) break;
      if (round === 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  // Hintergrund-Abfragen, die der Server abweist, dürfen die Suche im Vordergrund nicht pausieren.
  if (last && !(background && last.code === 'busy')) noteSoftFailure(last.code);
  failureCount++;
  throw last as HardcoverError;
}

/** Reihen aus Hardcover tragen den Schlüssel `hc:<Name>` im Feld der Wikidata-ID — so laufen sie durch die vorhandene Reihenlogik. */
export const hardcoverSeriesKey = (name: string): string => `hc:${name}`;
export const isHardcoverSeriesKey = (key: string | undefined): key is string =>
  !!key && key.startsWith('hc:');

function mapSeries(series: HcItem['series']): BookSeriesInfo | undefined {
  if (!series?.name) return undefined;
  return stripUndefined({
    name: series.name,
    position: series.position,
    wikidataId: hardcoverSeriesKey(series.name),
    hardcoverId: series.hardcoverId,
  });
}

/** Cover des Treffers; fehlt eines, kommt es über die ISBN (DNB für Deutsch, sonst Open Library). */
function coverChain(item: HcItem): Pick<BookSearchResult, 'cover' | 'coverFallback'> {
  const byIsbn = item.isbn13
    ? item.language === 'de'
      ? dnbCoverUrl(item.isbn13)
      : openLibraryCoverByIsbn(item.isbn13)
    : undefined;
  if (item.cover) return { cover: item.cover, coverFallback: item.coverFallback ?? byIsbn };
  if (item.coverFallback) {
    return byIsbn
      ? { cover: byIsbn, coverFallback: item.coverFallback }
      : { cover: item.coverFallback };
  }
  return { cover: byIsbn };
}

export function mapHardcoverItem(item: HcItem): BookSearchResult {
  return stripUndefined({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    authors: item.authors ?? [],
    ...coverChain(item),
    pageCount: item.pageCount,
    publishedYear: item.publishedYear,
    publisher: item.publisher,
    language: item.language,
    categories: item.categories,
    isbn13: item.isbn13,
    hardcoverId: item.hardcoverId,
    description: item.description,
    series: mapSeries(item.series),
    source: 'hardcover' as const,
    popularity: item.popularity,
    avgRating: item.avgRating,
    ratingCount: item.ratingCount,
  });
}

const mapList = (list: HcItem[] | undefined): BookSearchResult[] =>
  (list ?? []).map(mapHardcoverItem);

export async function hardcoverSearch(
  query: string,
  signal?: AbortSignal,
  background = false
): Promise<BookSearchResult[]> {
  const data = await post<{ results?: HcItem[] }>('/hc/search', { q: query }, signal, background);
  return mapList(data.results);
}

export async function hardcoverIsbn(isbn13: string): Promise<BookSearchResult | null> {
  const data = await post<{ result?: HcItem | null }>('/hc/isbn', { isbn: isbn13 });
  return data.result ? mapHardcoverItem(data.result) : null;
}

interface HcExtras {
  moods?: string[];
  pace?: string[];
  warnings?: string[];
}

export async function hardcoverBook(
  id: number
): Promise<{ result: BookSearchResult; extras: HcExtras } | null> {
  const data = await post<{ result?: HcItem | null; extras?: HcExtras }>('/hc/book', { id });
  return data.result ? { result: mapHardcoverItem(data.result), extras: data.extras ?? {} } : null;
}

export function hardcoverDetails(id: number): Promise<BookDetails | null> {
  return cached<BookDetails | null>(
    'hcdetails',
    `${appLocale}:${id}:2`,
    14 * DAY,
    async () => {
      const hit = await hardcoverBook(id);
      if (!hit) throw new Error('no details');
      const { result, extras } = hit;
      return stripUndefined({
        description: result.description,
        categories: result.categories,
        pageCount: result.pageCount,
        publisher: result.publisher,
        moods: extras.moods,
        pace: extras.pace,
        warnings: extras.warnings,
      });
    },
    120
  ).catch(() => null);
}

/**
 * Klappentext in der App-Sprache vom Server: er übersetzt jedes Buch höchstens einmal pro Sprache und merkt es sich für alle.
 * `capped` heißt: Tageslimit erreicht — dann bewusst keine weitere KI-Anfrage, sondern Original zeigen.
 */
const describing = new Map<string, Promise<{ text: string | null; capped: boolean }>>();

export function hardcoverDescription(
  id: number
): Promise<{ text: string | null; capped: boolean }> {
  const key = `${appLocale}:${id}`;
  const known = cacheGet<string>('hcdesc', key, 30 * DAY);
  if (known) return Promise.resolve({ text: known, capped: false });
  let pending = describing.get(key);
  if (!pending) {
    pending = loadDescription(id)
      .then((result) => {
        if (result.text) cacheSet('hcdesc', key, result.text, 60);
        return result;
      })
      .finally(() => describing.delete(key));
    describing.set(key, pending);
  }
  return pending;
}

async function loadDescription(id: number): Promise<{ text: string | null; capped: boolean }> {
  try {
    const res = await backendFetch('/hc/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, lang: appLocale }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { text: null, capped: false };
    const data = (await res.json()) as { text?: string | null; reason?: string };
    const text = typeof data.text === 'string' && data.text.trim() ? data.text : null;
    return { text, capped: data.reason === 'cap' };
  } catch {
    return { text: null, capped: false };
  }
}

/** Ähnliche Bücher laut Hardcover (eine Abfrage, Server merkt sie sich 14 Tage). */
export function hardcoverSimilar(id: number): Promise<BookSearchResult[]> {
  return cached<BookSearchResult[]>(
    'hcsimilar',
    `${appLocale}:${id}`,
    14 * DAY,
    async () => {
      const data = await post<{ results?: HcItem[] }>('/hc/similar', { id });
      const list = mapList(data.results);
      if (!list.length) throw new Error('none');
      return list;
    },
    40
  ).catch(() => []);
}

export async function hardcoverAuthorBooks(name: string): Promise<BookSearchResult[]> {
  const data = await post<{ results?: HcItem[] }>('/hc/author', { name });
  return mapList(data.results);
}

export type HardcoverSort = 'popular' | 'top' | 'gems' | 'recent';

export interface HardcoverBrowse {
  /** Regal-Schlüssel (fantasy, thriller, …) ODER Katalog-Genre — eines von beiden. */
  shelf?: string;
  genre?: string;
  mood?: string;
  sort?: HardcoverSort;
  theme?: string;
  audience?: 'adult' | 'young';
  /** Hardcover liefert 25 Treffer je Seite, gezählt ab 1. */
  page?: number;
}

export async function hardcoverBrowse(
  options: HardcoverBrowse
): Promise<{ items: BookSearchResult[]; done: boolean }> {
  const data = await post<{ results?: HcItem[]; done?: boolean }>('/hc/browse', { ...options });
  return { items: mapList(data.results), done: !!data.done };
}

/** Bände der Reihe als Teile für die Reihenansicht — Zwischenbände (Band 1,5) bleiben außen vor. */
export function seriesPartsFrom(books: BookSearchResult[], now = new Date()): BookSeriesPart[] {
  const year = now.getFullYear();
  const parts: BookSeriesPart[] = [];
  for (const book of books) {
    const position = book.series?.position;
    if (!position || !Number.isInteger(position) || position <= 0) continue;
    parts.push(
      stripUndefined({
        wikidataId: book.id,
        title: book.title,
        position,
        publishedDate:
          book.publishedYear && book.publishedYear > year
            ? `${book.publishedYear}-01-01`
            : undefined,
        result: book,
      })
    );
  }
  return parts.sort((a, b) => a.position - b.position);
}

export function hardcoverSeriesParts(name: string): Promise<BookSeriesPart[]> {
  return cached<BookSeriesPart[]>(
    'hcseries',
    `${appLocale}:${name.toLowerCase()}`,
    7 * DAY,
    async () => {
      const data = await post<{ results?: HcItem[] }>('/hc/series', { name });
      const parts = seriesPartsFrom(mapList(data.results));
      if (!parts.length) throw new Error('no series');
      return parts;
    },
    40
  ).catch(() => []);
}
