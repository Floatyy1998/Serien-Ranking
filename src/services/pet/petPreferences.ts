/**
 * Pet-Feature an/aus je Nutzer (`users/$uid/petWidget/enabled`, fehlend = an).
 * Ausgeschaltet heißt: Widget, Reaktionen, Home-Karten und Geschenke pausieren,
 * und die Zeit steht für die Pets still — beim Einschalten werden die
 * Zeitstempel um die Pausendauer verschoben, damit kein Pet verhungert.
 */
import { dbGet, dbRef, dbUpdate, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';

const STORAGE_PREFIX = 'petEnabled:';

type StoredStamp = string | number | null | undefined;

interface StoredPet {
  type?: unknown;
  isAlive?: boolean;
  lastFed?: StoredStamp;
}

export const isPetEnabledValue = (value: unknown): boolean => value !== false;

/** Letzter bekannter Wert, damit das Widget beim Start nicht kurz aufblitzt. */
export function readPetEnabledCached(uid: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + uid) !== 'false';
  } catch {
    return true;
  }
}

function cachePetEnabled(uid: string, enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + uid, enabled ? 'true' : 'false');
  } catch {
    // Quota — der Live-Wert kommt ohnehin aus der RTDB
  }
}

/** Verschiebt einen gespeicherten Zeitstempel um die Pausendauer; Unlesbares bleibt. */
export const shiftStamp = (value: StoredStamp, byMs: number): StoredStamp => {
  if (value === undefined || value === null) return value;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return value;
  return new Date(time + byMs).toISOString();
};

export async function getPetEnabled(uid: string): Promise<boolean> {
  try {
    const enabled = isPetEnabledValue(await dbGet<boolean>(userPath(uid, 'petWidget', 'enabled')));
    cachePetEnabled(uid, enabled);
    return enabled;
  } catch {
    return readPetEnabledCached(uid);
  }
}

export function subscribePetEnabled(uid: string, onChange: (enabled: boolean) => void): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'petWidget', 'enabled')),
    (snap) => {
      const enabled = isPetEnabledValue(snap.val());
      cachePetEnabled(uid, enabled);
      onChange(enabled);
    },
    { label: 'petWidget/enabled' }
  );
}

export async function setPetEnabled(uid: string, enabled: boolean): Promise<void> {
  const base = userPath(uid, 'petWidget');

  if (!enabled) {
    await dbUpdate({ [`${base}/enabled`]: false, [`${base}/pausedAt`]: Date.now() });
    cachePetEnabled(uid, false);
    return;
  }

  const updates: Record<string, unknown> = {
    [`${base}/enabled`]: true,
    [`${base}/pausedAt`]: null,
  };
  const pausedAt = await dbGet<number>(`${base}/pausedAt`);
  if (typeof pausedAt === 'number' && pausedAt > 0) {
    const pauseMs = Math.max(0, Date.now() - pausedAt);
    const nowIso = new Date().toISOString();
    const pets = (await dbGet<Record<string, StoredPet>>(userPath(uid, 'pets'))) || {};
    for (const [petId, pet] of Object.entries(pets)) {
      if (!pet || typeof pet !== 'object' || typeof pet.type !== 'string') continue;
      if (pet.isAlive === false) continue;
      updates[userPath(uid, 'pets', petId, 'lastFed')] = shiftStamp(pet.lastFed, pauseMs) ?? nowIso;
      updates[userPath(uid, 'pets', petId, 'lastUpdated')] = nowIso;
    }
  }
  await dbUpdate(updates);
  cachePetEnabled(uid, true);
}
