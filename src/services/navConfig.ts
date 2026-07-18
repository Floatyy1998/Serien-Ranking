/** Store für die konfigurierbare Bottom-Nav: localStorage gewinnt sofort (kein Flackern), RTDB synct über Geräte. */

import { DEFAULT_NAV_SLOTS, MAX_NAV_SLOTS, NAV_SLOT_OPTIONS } from '../config/navItems';
import { dbRef, paths } from './db/ref';

const CACHE_KEY = 'navConfig_cache';
const VALID_IDS = new Set(NAV_SLOT_OPTIONS.map((o) => o.id));

const sanitize = (ids: unknown): string[] | null => {
  if (!Array.isArray(ids)) return null;
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !VALID_IDS.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= MAX_NAV_SLOTS) break;
  }
  return out;
};

let currentSlots: string[] = (() => {
  try {
    return sanitize(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')) ?? DEFAULT_NAV_SLOTS;
  } catch {
    return DEFAULT_NAV_SLOTS;
  }
})();

const listeners = new Set<() => void>();

export const getNavSlots = (): string[] => currentSlots;

export const subscribeNavSlots = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const applyLocal = (slots: string[]) => {
  currentSlots = slots;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(slots));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};

export const setNavSlots = (uid: string | undefined, ids: string[]): void => {
  const slots = sanitize(ids) ?? DEFAULT_NAV_SLOTS;
  applyLocal(slots);
  if (uid) {
    try {
      dbRef(paths.navConfig(uid)).set(slots);
    } catch {
      /* ignore */
    }
  }
};

export const resetNavSlots = (uid: string | undefined): void => {
  setNavSlots(uid, DEFAULT_NAV_SLOTS);
};

let loadedForUid: string | null = null;

export const loadNavSlots = (uid: string): void => {
  if (loadedForUid === uid) return;
  loadedForUid = uid;
  dbRef(paths.navConfig(uid))
    .once('value')
    .then((snap) => {
      const slots = sanitize(snap.val());
      if (slots) applyLocal(slots);
    })
    .catch(() => {
      /* ignore */
    });
};
