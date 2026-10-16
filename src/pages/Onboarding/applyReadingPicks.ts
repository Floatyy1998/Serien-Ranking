import { addBook } from '../../services/books/bookService';
import { mapLimit } from '../../utils/mapLimit';
import { addMangaToList } from '../Manga/addMangaToList';
import type { ReadingPick } from './hooks/useReadingPicks';

/** Legt die im Onboarding gewählten Manga und Bücher an; liefert, wie viele gelandet sind. */
export async function applyReadingPicks(
  uid: string,
  picks: ReadingPick[],
  onEach?: () => void
): Promise<number> {
  let landed = 0;
  let nmr = 0;
  await mapLimit(picks, 4, async (pick) => {
    try {
      if (pick.kind === 'book' && pick.book) {
        await addBook(uid, pick.book, pick.status, {
          finishedEarlier: pick.status === 'completed',
        });
        landed++;
      } else if (pick.kind === 'manga' && pick.manga) {
        await addMangaToList(uid, pick.manga, ++nmr, { status: pick.status });
        landed++;
      }
    } catch {
      /* einzelner Titel — der Rest wird trotzdem angelegt */
    }
    onEach?.();
  });
  return landed;
}
