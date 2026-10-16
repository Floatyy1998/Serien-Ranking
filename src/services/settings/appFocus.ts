/**
 * Wofür jemand TV-Rank nutzt (`users/$uid/appFocus`): Serien & Filme, Manga & Bücher
 * oder beides. Steuert Onboarding-Schritte, Startseite und Dock-Vorgabe.
 * Fehlt der Wert, gilt „Serien & Filme" — so blieb es für alle Bestandskonten.
 */
import { dbGet, dbRef, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';

export type AppFocus = 'watch' | 'read' | 'both';

export const APP_FOCI: AppFocus[] = ['watch', 'read', 'both'];

const STORAGE_PREFIX = 'appFocus:';

export const parseAppFocus = (value: unknown): AppFocus | null =>
  value === 'watch' || value === 'read' || value === 'both' ? value : null;

/** Letzter bekannter Wert, damit die Startseite beim Start nicht umspringt. */
export function readAppFocusCached(uid: string): AppFocus | null {
  try {
    return parseAppFocus(localStorage.getItem(STORAGE_PREFIX + uid));
  } catch {
    return null;
  }
}

function cacheAppFocus(uid: string, focus: AppFocus | null): void {
  try {
    if (focus) localStorage.setItem(STORAGE_PREFIX + uid, focus);
    else localStorage.removeItem(STORAGE_PREFIX + uid);
  } catch {
    // Quota — der Live-Wert kommt ohnehin aus der RTDB
  }
}

export async function getAppFocus(uid: string): Promise<AppFocus | null> {
  try {
    const focus = parseAppFocus(await dbGet<string>(userPath(uid, 'appFocus')));
    cacheAppFocus(uid, focus);
    return focus;
  } catch {
    return readAppFocusCached(uid);
  }
}

export function subscribeAppFocus(
  uid: string,
  onChange: (focus: AppFocus | null) => void
): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'appFocus')),
    (snap) => {
      const focus = parseAppFocus(snap.val());
      cacheAppFocus(uid, focus);
      onChange(focus);
    },
    { label: 'appFocus' }
  );
}

export async function setAppFocus(uid: string, focus: AppFocus): Promise<void> {
  cacheAppFocus(uid, focus);
  await dbRef(userPath(uid, 'appFocus')).set(focus);
}

/** Startseite und Dock zeigen Lesen zuerst nur beim Schwerpunkt „Manga & Bücher". */
export const readsFirst = (focus: AppFocus | null): boolean => focus === 'read';
