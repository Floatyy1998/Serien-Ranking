import { looksLikeIsbn, toIsbn13 } from '../../lib/books/bookIdentity';
import { stripUndefined } from '../../lib/books/bookSearchMapping';
import { searchMatch } from '../../lib/books/searchMatch';
import type { Book, BookSearchResult } from '../../types/Book';
import { appLocale } from '../i18n';
import { createCatalogClient, type CatalogDescription, type CatalogIndex } from './catalogClient';

/**
 * Bücher-Katalog auf dem eigenen Server (Gegenstück zum Serien-/Film-Katalog): jedes Buch, das irgendwer
 * hinzugefügt hat, liegt dauerhaft als catalog/books/items/<id>.json samt Cover bei uns. index.json ist die
 * kompakte Liste für Suche und ISBN-Treffer, /books/version der Cache-Bust (die Dateien sind immutable).
 */
const MAX_HITS = 8;

/** Zeile aus index.json: t Titel, a Autoren, y Jahr, i ISBN-13, h Hardcover-ID, c 1 = Cover liegt bei uns, v Stand. */
export interface BookCatalogEntry {
  id: string;
  t: string;
  a?: string[];
  y?: number;
  i?: string;
  h?: number;
  c?: 1;
  l?: string;
  v: number;
}

export type BookCatalogIndex = CatalogIndex<BookCatalogEntry>;

interface CatalogItem extends Omit<BookSearchResult, 'authors' | 'source'> {
  authors?: string[];
  source?: BookSearchResult['source'];
  wikidataId?: string;
  v?: number;
  coverSrc?: string[];
  adds?: number;
  addedAt?: string;
  lang?: string;
  /** Klappentext je Sprache — einmal übersetzt, dann für alle da. */
  descriptions?: Record<string, string>;
}

/** Was beim Hinzufügen an den Katalog geht — ohne Bewertungen und Beliebtheit (Community-Daten bleiben bei der Quelle). */
export type CatalogCandidate = Partial<Book & BookSearchResult> & { id: string; title: string };

export type { CatalogDescription };

const client = createCatalogClient<BookCatalogEntry, CatalogItem>({
  dir: 'books',
  versionPath: '/books/version',
  addPath: '/books/add',
  describePath: '/books/describe',
  payloadKey: 'book',
  cacheNs: 'catdesc',
});

export const bookCatalogVersion = client.version;
export const loadBookCatalogIndex = client.index;
export const describeFromCatalog = client.describe;

function toResult(item: CatalogItem): BookSearchResult {
  const { v, coverSrc, adds, addedAt, lang, descriptions, ...rest } = item;
  void v;
  void coverSrc;
  void adds;
  void addedAt;
  void lang;
  void descriptions;
  return stripUndefined({
    ...rest,
    authors: item.authors ?? [],
    source:
      item.source ??
      (item.hardcoverId
        ? 'hardcover'
        : item.googleId
          ? 'google'
          : item.olWorkId
            ? 'openlibrary'
            : 'dnb'),
  });
}

const mapped = new Map<string, Promise<BookSearchResult | null>>();

/** Voller Katalog-Eintrag; `v` aus dem Index macht die URL eindeutig, sonst gilt der Katalogstand. */
export function loadBookCatalogItem(id: string, v?: number): Promise<BookSearchResult | null> {
  const key = `${id}@${v ?? ''}`;
  let pending = mapped.get(key);
  if (!pending) {
    pending = client
      .item(id, v)
      .then((item) => (item && item.title ? toResult({ ...item, id }) : null));
    mapped.set(key, pending);
  }
  return pending;
}

/** Treffer aus unserem Katalog: per ISBN exakt, sonst Titel/Autor wie bei der Suche; liefert die vollen Einträge. */
export async function searchBookCatalog(
  query: string,
  limit = MAX_HITS
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { items: entries } = await loadBookCatalogIndex();
  const isbn = looksLikeIsbn(trimmed) ? toIsbn13(trimmed) : undefined;
  const hits = isbn
    ? entries.filter((e) => e.i === isbn)
    : entries.filter((e) => searchMatch({ title: e.t, authors: e.a }, trimmed).matches);
  const loaded = await Promise.all(hits.slice(0, limit).map((e) => loadBookCatalogItem(e.id, e.v)));
  return loaded.filter((r): r is BookSearchResult => !!r);
}

/** Hinzugefügte Bücher wandern in den gemeinsamen Katalog (wie Serien über /add) — best effort, ohne Rückmeldung. */
export function keepInCatalog(book: CatalogCandidate): void {
  client.keep(
    stripUndefined({
      id: book.id,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      cover: book.cover,
      coverFallback: book.coverFallback,
      pageCount: book.pageCount,
      publishedYear: book.publishedYear,
      publisher: book.publisher,
      edition: book.edition,
      language: book.language,
      categories: book.categories,
      isbn13: book.isbn13,
      googleId: book.googleId,
      olWorkId: book.olWorkId,
      hardcoverId: book.hardcoverId,
      wikidataId: book.wikidataId,
      description: book.description,
      series: book.series,
      source: book.source,
    }),
    appLocale
  );
}
