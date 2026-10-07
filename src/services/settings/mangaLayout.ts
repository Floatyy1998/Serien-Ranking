/** Store für die anpassbare Manga-Übersicht: localStorage sofort, RTDB synct über Geräte. */

import { MANGA_LAYOUT_DEFAULTS, type MangaLayoutListKey } from '../../config/mangaSections';
import { mergeSectionOrder, sanitizeHiddenIds } from '../../lib/layout/sectionOrder';
import { dbRef, paths } from '../db/ref';

export interface MangaLayoutList {
  order: string[];
  hidden: string[];
}

export type MangaLayout = Record<MangaLayoutListKey, MangaLayoutList>;

const CACHE_KEY = 'mangaLayout_cache';
const LIST_KEYS = Object.keys(MANGA_LAYOUT_DEFAULTS) as MangaLayoutListKey[];

export const defaultMangaLayout = (): MangaLayout => ({
  sections: { order: [...MANGA_LAYOUT_DEFAULTS.sections], hidden: [] },
  quick: { order: [...MANGA_LAYOUT_DEFAULTS.quick], hidden: [] },
  forYou: { order: [...MANGA_LAYOUT_DEFAULTS.forYou], hidden: [] },
});

export const sanitizeMangaLayout = (raw: unknown): MangaLayout => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    { order?: unknown; hidden?: unknown } | undefined
  >;
  return Object.fromEntries(
    LIST_KEYS.map((key) => {
      const defaults = MANGA_LAYOUT_DEFAULTS[key];
      return [
        key,
        {
          order: mergeSectionOrder(source[key]?.order, defaults),
          hidden: sanitizeHiddenIds(source[key]?.hidden, defaults),
        },
      ];
    })
  ) as MangaLayout;
};

let current: MangaLayout = (() => {
  try {
    return sanitizeMangaLayout(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'));
  } catch {
    return defaultMangaLayout();
  }
})();

const listeners = new Set<() => void>();

export const getMangaLayout = (): MangaLayout => current;

export const subscribeMangaLayout = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const applyLocal = (layout: MangaLayout) => {
  current = layout;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

const persist = (uid: string | undefined, layout: MangaLayout) => {
  if (!uid) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    dbRef(paths.mangaLayout(uid))
      .set(layout)
      .catch(() => {
        /* Best effort: localStorage hält den Stand, der nächste Write versucht es erneut */
      });
  }, 400);
};

export const setMangaLayoutList = (
  uid: string | undefined,
  key: MangaLayoutListKey,
  patch: Partial<MangaLayoutList>
): void => {
  const next = sanitizeMangaLayout({ ...current, [key]: { ...current[key], ...patch } });
  applyLocal(next);
  persist(uid, next);
};

export const toggleMangaLayoutItem = (
  uid: string | undefined,
  key: MangaLayoutListKey,
  id: string
): void => {
  const hidden = current[key].hidden;
  setMangaLayoutList(uid, key, {
    hidden: hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id],
  });
};

export const resetMangaLayout = (uid: string | undefined): void => {
  const next = defaultMangaLayout();
  applyLocal(next);
  persist(uid, next);
};

let loadedForUid: string | null = null;

export const loadMangaLayout = (uid: string): void => {
  if (loadedForUid === uid) return;
  loadedForUid = uid;
  dbRef(paths.mangaLayout(uid))
    .once('value')
    .then((snap) => {
      const data = snap.val();
      if (data) applyLocal(sanitizeMangaLayout(data));
    })
    .catch(() => {
      /* ignore */
    });
};
