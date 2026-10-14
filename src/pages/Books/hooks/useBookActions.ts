import { useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import {
  logBookFinished,
  logReadingActivity,
  type ReadingActivity,
} from '../../../features/badges/minimalActivityLogger';
import { notifyBookEventsChanged } from '../../../hooks/books/useBookEvents';
import { useMangaForBook, useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { triggerPetReaction } from '../../../hooks/pet/usePetReactions';
import { mangaVolumeGuess } from '../../../lib/books/mangaVolume';
import { hapticCelebrate, hapticSuccess } from '../../../lib/interaction/haptics';
import { showToast, showUndoToast } from '../../../lib/interaction/toast';
import {
  addBook,
  removeBook,
  setBookHidden,
  setBookRating,
  setBookStatus,
  setBookWish,
  updateBookFields,
  updateBookProgress,
  type AddBookOptions,
} from '../../../services/books/bookService';
import { resolveMangaVolumes } from '../../../services/books/mangaVolumes';
import { t } from '../../../services/i18n';
import type { Book, BookSearchResult, BookStatus } from '../../../types/Book';
import { useAddManga } from '../../Manga/useAddManga';

const logBook = (uid: string, book: Book, type: ReadingActivity['type'], rating?: number) =>
  void logReadingActivity(uid, {
    type,
    itemId: book.id,
    itemTitle: book.title,
    poster: book.cover,
    author: book.authors?.[0],
    rating,
    bookRef: {
      source: book.source,
      googleId: book.googleId,
      olWorkId: book.olWorkId,
      isbn13: book.isbn13,
    },
  });

const celebrateFinish = (book: Book, uid: string) => {
  void logBookFinished(uid);
  logBook(uid, book, 'book_finished');
  hapticCelebrate();
  showToast(t('„{title}" ausgelesen', { title: book.title }), 2400);
  triggerPetReaction({ tone: 'milestone', emoji: '', message: t('Buch ausgelesen!') });
};

export function useBookActions() {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const ownedFor = useOwnedBooks();
  const mangaFor = useMangaForBook();
  const { allMangaList } = useMangaList();
  const { add: addManga } = useAddManga();

  /** Ein erkannter Manga-Band landet als Manga-Reihe statt als Buch. */
  const addVolumeAsManga = useCallback(
    async (result: BookSearchResult): Promise<boolean> => {
      if (!mangaVolumeGuess(result)) return false;
      const hit = await resolveMangaVolumes([result])
        .then((hits) => hits[result.id])
        .catch(() => undefined);
      if (!hit) return false;
      const title = hit.manga.title.english || hit.manga.title.romaji;
      if (allMangaList.some((m) => m.anilistId === hit.manga.id)) {
        showToast(t('„{title}" steht schon bei deinen Manga', { title }), 2400);
      } else if (await addManga(hit.manga, { byVolume: true })) {
        hapticSuccess();
        showToast(t('„{title}“ ist ein Manga – bei deinen Manga gespeichert', { title }), 2600);
      } else {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
      }
      return true;
    },
    [allMangaList, addManga]
  );

  const add = useCallback(
    async (result: BookSearchResult, status: BookStatus, options?: AddBookOptions) => {
      if (!uid) return null;
      const manga = mangaFor(result);
      if (manga) {
        showToast(t('„{title}" steht schon bei deinen Manga', { title: manga.title }), 2400);
        return null;
      }
      const owned = ownedFor(result);
      if (owned) {
        showToast(t('Schon in deinen Büchern'));
        return owned;
      }
      if (await addVolumeAsManga(result)) return null;
      try {
        const book = await addBook(uid, result, status, options);
        logBook(uid, book, 'book_added');
        hapticSuccess();
        showToast(t('Zu deinen Büchern hinzugefügt'));
        if (status === 'completed') {
          notifyBookEventsChanged();
          void logBookFinished(uid);
        }
        return book;
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
        return null;
      }
    },
    [uid, ownedFor, mangaFor, addVolumeAsManga]
  );

  const saveProgress = useCallback(
    async (book: Book, page: number, pageCount?: number) => {
      if (!uid) return;
      try {
        let current = book;
        if (pageCount && pageCount !== book.pageCount) {
          await updateBookFields(uid, book.id, { pageCount });
          current = { ...book, pageCount };
        }
        const result = await updateBookProgress(uid, current, page);
        notifyBookEventsChanged();
        if (result.finished) {
          celebrateFinish(current, uid);
        } else if (result.pagesRead >= 20) {
          triggerPetReaction({
            tone: 'cheer',
            emoji: '',
            message: t('{n} Seiten, stark!', { n: result.pagesRead }),
          });
        }
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
      }
    },
    [uid]
  );

  const changeStatus = useCallback(
    async (book: Book, status: BookStatus, options?: AddBookOptions) => {
      if (!uid || (status === book.status && !options?.finishedEarlier)) return;
      try {
        await setBookStatus(uid, book, status, options);
        notifyBookEventsChanged();
        if (status === 'completed' && !options?.finishedEarlier) celebrateFinish(book, uid);
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
      }
    },
    [uid]
  );

  const rate = useCallback(
    async (book: Book, rating: number) => {
      if (!uid) return;
      try {
        await setBookRating(uid, book, rating);
        if (rating > 0) logBook(uid, book, 'book_rated', rating);
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
      }
    },
    [uid]
  );

  const updateFields = useCallback(
    async (book: Book, fields: Record<string, unknown>) => {
      if (!uid) return;
      await updateBookFields(uid, book.id, fields).catch(() =>
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
      );
    },
    [uid]
  );

  /** Entfernen mit Rückgängig: erst nach Ablauf wirklich löschen. */
  const toggleWish = useCallback(
    async (book: Book) => {
      if (!uid) return;
      await setBookWish(uid, book.id, !book.wishedAt).catch(() =>
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error')
      );
    },
    [uid]
  );

  const remove = useCallback(
    (book: Book, onRemoved?: () => void) => {
      if (!uid) return;
      void setBookHidden(uid, book.id, true);
      onRemoved?.();
      showUndoToast(t('„{title}" entfernt', { title: book.title }), {
        onUndo: () => void setBookHidden(uid, book.id, book.hidden ?? false),
        onCommit: () => void removeBook(uid, book.id),
      });
    },
    [uid]
  );

  const toggleHidden = useCallback(
    async (book: Book) => {
      if (!uid) return;
      await setBookHidden(uid, book.id, !book.hidden);
      showToast(book.hidden ? t('Wieder eingeblendet') : t('Ausgeblendet'));
    },
    [uid]
  );

  return useMemo(
    () => ({
      add,
      saveProgress,
      changeStatus,
      rate,
      updateFields,
      toggleWish,
      remove,
      toggleHidden,
    }),
    [add, saveProgress, changeStatus, rate, updateFields, toggleWish, remove, toggleHidden]
  );
}
