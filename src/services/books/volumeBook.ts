import { pickVolumeBook } from '../../lib/books/volumeBook';
import type { BookSearchResult } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { searchBooks } from '../api/booksApi';
import { appLocale } from '../i18n';

/** Sucht Band N einer Manga-Reihe als Buch, unter jedem bekannten Reihentitel. */
export async function findVolumeBook(
  manga: Pick<Manga, 'title' | 'titleEnglish' | 'titleRomaji'>,
  volume: number
): Promise<BookSearchResult | null> {
  const names = [
    ...new Set([manga.title, manga.titleEnglish, manga.titleRomaji].filter(Boolean)),
  ] as string[];
  for (const name of names) {
    const hits = await searchBooks(`${name} ${volume}`).catch(() => []);
    const hit = pickVolumeBook(hits, names, volume, appLocale);
    if (hit) return hit;
  }
  return null;
}
