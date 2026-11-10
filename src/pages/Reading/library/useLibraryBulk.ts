import { useCallback, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { notifyBookEventsChanged } from '../../../hooks/books/useBookEvents';
import { hapticSuccess } from '../../../lib/interaction/haptics';
import { showToast, showUndoToast } from '../../../lib/interaction/toast';
import type { LibraryItem } from '../../../lib/reading/library';
import {
  setBookStatus,
  setBooksStatus,
  updateBooksBulk,
} from '../../../services/books/bookService';
import { t } from '../../../services/i18n';
import { setMangaHidden, setMangaOwned, setMangaStatus } from '../../../services/manga/mangaBulk';
import type { Book, BookStatus } from '../../../types/Book';
import type { Manga } from '../../../types/Manga';

const split = (items: LibraryItem[]) => ({
  books: items.map((i) => i.book).filter((b): b is Book => !!b),
  manga: items.map((i) => i.manga).filter((m): m is Manga => !!m),
});

/** Sammelaktionen der Bibliothek für Bücher und Manga. */
export function useLibraryBulk() {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (work: (uid: string) => Promise<void>, done: string) => {
      if (!uid) return false;
      setBusy(true);
      try {
        await work(uid);
        hapticSuccess();
        showToast(done, 2200);
        return true;
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [uid]
  );

  /** `earlier`: beendet ohne Datum („früher gelesen"), sonst zählt der Abschluss heute. */
  const setStatus = useCallback(
    (items: LibraryItem[], status: BookStatus, earlier = false) => {
      const { books, manga } = split(items);
      const message =
        status === 'completed'
          ? t('{n} Titel als gelesen markiert', { n: items.length })
          : t('{n} Titel geändert', { n: items.length });
      return run(async (id) => {
        const finishToday = status === 'completed' && !earlier;
        const todo = books.filter(
          (b) => b.status !== status || (status === 'completed' && earlier)
        );
        if (finishToday) {
          for (const book of todo) await setBookStatus(id, book, status);
        } else {
          await setBooksStatus(id, todo, status, { finishedEarlier: earlier });
        }
        await setMangaStatus(id, manga, status, earlier);
        notifyBookEventsChanged();
      }, message);
    },
    [run]
  );

  const setOwned = useCallback(
    (items: LibraryItem[], owned: boolean) => {
      const { books, manga } = split(items);
      const now = new Date().toISOString();
      return run(
        async (id) => {
          await updateBooksBulk(
            id,
            books
              .filter((b) => !!b.ownedAt !== owned)
              .map((b) => ({ id: b.id, fields: { ownedAt: owned ? now : null } }))
          );
          await setMangaOwned(
            id,
            manga.filter((m) => !!m.ownedAt !== owned),
            owned
          );
        },
        owned
          ? t('{n} Titel als Besitz markiert', { n: items.length })
          : t('{n} Titel nicht mehr im Besitz', { n: items.length })
      );
    },
    [run]
  );

  const write = useCallback(async (id: string, items: LibraryItem[], hidden: boolean) => {
    const { books, manga } = split(items);
    await updateBooksBulk(
      id,
      books.map((b) => ({ id: b.id, fields: { hidden: hidden || null } }))
    );
    await setMangaHidden(id, manga, hidden);
  }, []);

  const setHidden = useCallback(
    async (items: LibraryItem[], hidden: boolean) => {
      if (!uid) return false;
      setBusy(true);
      try {
        await write(uid, items, hidden);
        hapticSuccess();
        showUndoToast(
          hidden
            ? t('{n} Titel ausgeblendet', { n: items.length })
            : t('{n} Titel eingeblendet', { n: items.length }),
          () => void write(uid, items, !hidden).catch(() => {})
        );
        return true;
      } catch {
        showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [uid, write]
  );

  return { busy, setStatus, setOwned, setHidden };
}
