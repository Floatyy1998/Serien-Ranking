import { useSyncExternalStore } from 'react';
import { dbGet, dbRef, userPath } from './db/ref';

/**
 * Globaler Spoiler-Modus: 0 = aus, 1 = Bilder ungesehener Folgen blurren,
 * 2 = zusätzlich Titel und Beschreibung verstecken.
 * localStorage ist der synchrone Cache, users/$uid/settings/spoilerLevel
 * die geteilte Quelle (Backend-Crons können sie später mitlesen).
 */
export type SpoilerLevel = 0 | 1 | 2;

export const DEFAULT_SPOILER_LEVEL: SpoilerLevel = 1;
const LS_KEY = 'spoilerLevel';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const isLevel = (v: unknown): v is SpoilerLevel => v === 0 || v === 1 || v === 2;

export const getSpoilerLevel = (): SpoilerLevel => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw !== null) {
      const parsed = Number(raw);
      if (isLevel(parsed)) return parsed;
    }
  } catch {
    // Cache egal
  }
  return DEFAULT_SPOILER_LEVEL;
};

export const setSpoilerLevel = (uid: string | undefined, level: SpoilerLevel): void => {
  try {
    localStorage.setItem(LS_KEY, String(level));
  } catch {
    // Quota egal
  }
  notify();
  if (!uid) return;
  dbRef(userPath(uid, 'settings', 'spoilerLevel'))
    .set(level)
    .catch(() => {});
};

/** Beim Login: Remote-Wert in den lokalen Cache spiegeln. */
export async function syncSpoilerLevel(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const remote = await dbGet<unknown>(userPath(uid, 'settings', 'spoilerLevel'));
    if (isLevel(remote) && remote !== getSpoilerLevel()) {
      try {
        localStorage.setItem(LS_KEY, String(remote));
      } catch {
        return;
      }
      notify();
    }
  } catch {
    // best effort
  }
}

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Reaktiver Zugriff für Render-Pfade. */
export const useSpoilerLevel = (): SpoilerLevel =>
  useSyncExternalStore(subscribe, getSpoilerLevel, () => DEFAULT_SPOILER_LEVEL);
