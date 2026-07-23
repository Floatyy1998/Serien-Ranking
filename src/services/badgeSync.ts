/**
 * App-Icon-Badge geräteübergreifend synchron halten: Ändert sich die
 * „Heute offen"-Zahl auf diesem Gerät, wird sie nach RTDB gespiegelt und
 * über badgeQueue ein STILLER aps.badge-Push an alle Geräte des Users
 * ausgelöst (Backend-Listener in hello.js). iOS wendet das Badge ohne
 * laufende App an — kein neuer Store-Build nötig.
 */

import { dbGet, dbRef, userPath } from './db/ref';

const DEBOUNCE_MS = 6000;
const MAX_BADGE = 999;

let lastSynced: { uid: string; count: number } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounced (Bulk-Abhaken ändert die Zahl im Sekundentakt): nur der letzte
 * Stand wird geschrieben, und nur wenn er vom RTDB-Spiegel abweicht — App-
 * Starts ohne Änderung erzeugen so keinen Push.
 */
export function syncAppBadgeAcrossDevices(uid: string | undefined, count: number): void {
  if (!uid) return;
  const clamped = Math.max(0, Math.min(MAX_BADGE, Math.round(count)));
  if (lastSynced && lastSynced.uid === uid && lastSynced.count === clamped) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void doSync(uid, clamped);
  }, DEBOUNCE_MS);
}

async function doSync(uid: string, count: number): Promise<void> {
  try {
    const current = await dbGet<number>(userPath(uid, 'appBadge'));
    if (current === count) {
      lastSynced = { uid, count };
      return;
    }
    await dbRef(userPath(uid, 'appBadge')).set(count);
    await dbRef('badgeQueue').push({ uid, count, ts: Date.now() });
    lastSynced = { uid, count };
  } catch {
    /* best-effort — Badge aktualisiert sich spätestens beim nächsten App-Start */
  }
}

/** Nur für Tests: Modul-State zurücksetzen. */
export function _resetBadgeSyncForTests(): void {
  lastSynced = null;
  if (timer) clearTimeout(timer);
  timer = null;
}
