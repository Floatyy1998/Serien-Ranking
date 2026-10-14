/** Wechsel zwischen Buch und Manga: welche Bücher ein Manga mitnimmt und zurückgibt. */

import type { Book, BookSearchResult } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { mangaUnit } from '../manga/progress';
import { searchResultToBook, stripUndefined } from './bookSearchMapping';
import { splitVolume } from './mangaVolume';

/** Ein gefundener Band, wie er beim Zurückführen als Buch angelegt würde. */
export const volumeSnapshot = (result: BookSearchResult, nowIso: string): Book =>
  stripUndefined(searchResultToBook(result, 'planned', nowIso));

const volumeOf = (book: Book): number | undefined =>
  book.series?.position ?? splitVolume(book.title).volume;

/** Gleiche Ausgabe: gleiche ID oder gleiche ISBN. */
export const sameEdition = (a: Pick<Book, 'id' | 'isbn13'>, b: Pick<Book, 'id' | 'isbn13'>) =>
  a.id === b.id || (!!a.isbn13 && a.isbn13 === b.isbn13);

/** Der gerade angesehene Band zieht beim „Als Buch führen" mit um, als wäre er mitgenommen worden. */
export function withSourceBook(manga: Manga, book: Book): Manga {
  const known = Object.values(manga.fromBooks ?? {}).some((own) => sameEdition(own, book));
  return known ? manga : { ...manga, fromBooks: { ...manga.fromBooks, [book.id]: book } };
}

/** Das mitgenommene Buch mit dem niedrigsten Band — zum Anschauen vor dem Wechsel. */
export function firstSourceBook(manga: Pick<Manga, 'fromBooks'>): Book | null {
  const books = Object.entries(manga.fromBooks ?? {}).map(([id, book]) => ({
    ...book,
    id: book.id || id,
    authors: book.authors ?? [],
  }));
  const rank = (book: Book) => volumeOf(book) ?? Number.MAX_SAFE_INTEGER;
  return books.reduce<Book | null>(
    (first, book) => (!first || rank(book) < rank(first) ? book : first),
    null
  );
}

/** Gespeichertes Buch als Suchtreffer, damit die Buchseite es als Vorschau zeigt. */
export const bookAsSearchResult = (book: Book): BookSearchResult =>
  stripUndefined({
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors ?? [],
    cover: book.cover,
    pageCount: book.pageCount,
    publishedYear: book.publishedYear,
    publisher: book.publisher,
    language: book.language,
    categories: book.categories,
    isbn13: book.isbn13,
    googleId: book.googleId,
    olWorkId: book.olWorkId,
    source: book.source ?? 'google',
  });

/**
 * Bücher, die beim „Als Buch führen" zurückkommen. Bände, die im Manga schon
 * abgehakt waren, gelten als gelesen — ohne Datum, wie „Früher gelesen".
 * Bücher, die noch (oder wieder) in der Sammlung stehen, bleiben unberührt.
 */
export function booksFromManga(manga: Manga, existingIds: Set<string>): Book[] {
  const readUpTo = mangaUnit(manga) === 'volume' ? manga.currentVolume || 0 : 0;
  return Object.entries(manga.fromBooks ?? {})
    .map(([id, book]) => ({ ...book, id: book.id || id, authors: book.authors ?? [] }))
    .filter((book) => !existingIds.has(book.id))
    .map((book) => {
      const volume = volumeOf(book);
      if (book.status === 'completed' || !volume || volume > readUpTo) return book;
      return stripUndefined({
        ...book,
        status: 'completed' as const,
        currentPage: book.pageCount ?? book.currentPage ?? 0,
        startedAt: undefined,
        completedAt: undefined,
        wishedAt: undefined,
      });
    });
}
