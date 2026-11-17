import { booksFromManga, ownedVolumesOfBooks } from '../../lib/books/mangaBooks';
import { addOwnedVolumesFields } from '../../lib/manga/ownedVolumes';
import { dbRef, dbUpdate, paths } from '../../services/db/ref';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';

/** Buch wandert in einen schon geführten Manga; liefert die dabei gesetzten Besitz-Felder fürs Rückgängig. */
export async function rememberSourceBooks(
  uid: string,
  anilistId: number,
  books: Book[],
  manga?: Manga
): Promise<string[]> {
  if (books.length === 0) return [];
  const owned = manga ? addOwnedVolumesFields(manga, ownedVolumesOfBooks(books)) : {};
  await dbRef(paths.mangaItem(uid, anilistId)).update({
    ...Object.fromEntries(books.map((book) => [`fromBooks/${book.id}`, book])),
    ...owned,
  });
  return Object.keys(owned);
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

/** Rückgängig für „Als Buch führen": Manga exakt zurück, zurückgeholte Bücher wieder weg. */
export async function restoreMangaFromBooks(
  uid: string,
  manga: Manga,
  books: Book[]
): Promise<void> {
  const updates: Record<string, unknown> = {
    [paths.mangaItem(uid, manga.anilistId)]: JSON.parse(JSON.stringify(manga)),
    [`${paths.mangaAsBooks(uid)}/${manga.anilistId}`]: null,
  };
  for (const book of books) updates[paths.bookItem(uid, book.id)] = null;
  await dbUpdate(updates);
}

/** Rückgängig für „Als Manga führen": Buch wieder sichtbar, der Manga-Anteil zurückgenommen. */
export async function restoreBookFromManga(
  uid: string,
  book: Book,
  anilistId: number,
  options: { mangaWasNew: boolean; seriesAsBooks: boolean; ownedFields?: string[] }
): Promise<void> {
  const mangaItem = paths.mangaItem(uid, anilistId);
  const updates: Record<string, unknown> = {
    [`${paths.bookItem(uid, book.id)}/hidden`]: book.hidden || null,
    [options.mangaWasNew ? mangaItem : `${mangaItem}/fromBooks/${book.id}`]: null,
  };
  if (!options.mangaWasNew) {
    for (const field of options.ownedFields ?? []) updates[`${mangaItem}/${field}`] = null;
  }
  if (options.mangaWasNew && options.seriesAsBooks) {
    updates[`${paths.mangaAsBooks(uid)}/${anilistId}`] = true;
  }
  await dbUpdate(updates);
}
