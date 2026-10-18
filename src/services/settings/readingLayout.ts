/** Store für die anpassbare Lesen-Seite: localStorage sofort, RTDB synct über Geräte. */

import type { ReadingLayoutListKey } from '../../config/readingSections';
import {
  defaultReadingLayout,
  readingLayoutFromManga,
  sanitizeReadingLayout,
  type ReadingLayout,
  type ReadingLayoutList,
} from '../../lib/layout/readingLayout';
import { dbRef, paths } from '../db/ref';

const CACHE_KEY = 'readingLayout_cache';
const MANGA_CACHE_KEY = 'mangaLayout_cache';

const readCache = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

let current: ReadingLayout = (() => {
  const cached = readCache(CACHE_KEY);
  if (cached) return sanitizeReadingLayout(cached);
  const manga = readCache(MANGA_CACHE_KEY);
  return manga ? readingLayoutFromManga(manga) : defaultReadingLayout();
})();

const listeners = new Set<() => void>();

export const getReadingLayout = (): ReadingLayout => current;

export const subscribeReadingLayout = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const applyLocal = (layout: ReadingLayout) => {
  current = layout;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

const persist = (uid: string | undefined, layout: ReadingLayout) => {
  if (!uid) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    dbRef(paths.readingLayout(uid))
      .set(layout)
      .catch(() => {
        /* Best effort: localStorage hält den Stand, der nächste Write versucht es erneut */
      });
  }, 400);
};

export const setReadingLayoutList = (
  uid: string | undefined,
  key: ReadingLayoutListKey,
  patch: Partial<ReadingLayoutList>
): void => {
  const next = sanitizeReadingLayout({ ...current, [key]: { ...current[key], ...patch } });
  applyLocal(next);
  persist(uid, next);
};

export const toggleReadingLayoutItem = (
  uid: string | undefined,
  key: ReadingLayoutListKey,
  id: string
): void => {
  const hidden = current[key].hidden;
  setReadingLayoutList(uid, key, {
    hidden: hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id],
  });
};

export const resetReadingLayout = (uid: string | undefined): void => {
  const next = defaultReadingLayout();
  applyLocal(next);
  persist(uid, next);
};

let loadedForUid: string | null = null;

/** Lädt das Layout; gibt es noch keins, wird es einmal aus der alten Manga-Übersicht übernommen. */
export const loadReadingLayout = (uid: string): void => {
  if (loadedForUid === uid) return;
  loadedForUid = uid;
  dbRef(paths.readingLayout(uid))
    .once('value')
    .then(async (snap) => {
      const data = snap.val();
      if (data) {
        applyLocal(sanitizeReadingLayout(data));
        return;
      }
      if (readCache(CACHE_KEY)) return;
      const manga = (await dbRef(paths.mangaLayout(uid)).once('value')).val();
      if (manga) applyLocal(readingLayoutFromManga(manga));
    })
    .catch(() => {
      /* ignore */
    });
};
