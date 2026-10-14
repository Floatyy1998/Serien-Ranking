import { booksFromManga } from '../../lib/books/mangaBooks';
import { dbRef, dbUpdate, paths } from '../../services/db/ref';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';

/** Buch wandert in einen schon geführten Manga — merken, damit es zurückkann. */
export async function rememberSourceBooks(
  uid: string,
  anilistId: number,
  books: Book[]
): Promise<void> {
  if (books.length === 0) return;
  await dbRef(paths.mangaItem(uid, anilistId)).update(
    Object.fromEntries(books.map((book) => [`fromBooks/${book.id}`, book]))
  );
}

/**
 * „Als Buch führen": Manga raus, seine Bücher zurück, Reihe künftig als Bücher —
 * in einem Schreibvorgang, damit nichts halb umgezogen hängen bleibt.
 */
export async function moveMangaToBooks(
  uid: string,
  manga: Manga,
  existingBookIds: Set<string>
): Promise<Book[]> {
  const books = booksFromManga(manga, existingBookIds);
  const updates: Record<string, unknown> = {
    [paths.mangaItem(uid, manga.anilistId)]: null,
    [`${paths.mangaAsBooks(uid)}/${manga.anilistId}`]: true,
  };
  for (const book of books) updates[paths.bookItem(uid, book.id)] = book;
  await dbUpdate(updates);
  return books;
}
