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
