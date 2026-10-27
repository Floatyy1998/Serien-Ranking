/**
 * Nachfrage beim Hinzufügen eines Buchs (`users/$uid/bookAddPrompt`): true = Lesestand wählen,
 * sonst landet das Buch wie eine Serie erst einmal auf der Leseliste. Fehlt der Wert, wird nicht gefragt.
 */
import { dbRef, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';

const STORAGE_PREFIX = 'bookAddPrompt:';

const parse = (value: unknown): boolean | null =>
  value === true || value === '1' ? true : value === false || value === '0' ? false : null;

/** Letzter bekannter Wert, damit der Hinzufügen-Weg beim Start nicht umspringt. */
export function readBookAddPromptCached(uid: string): boolean | null {
  try {
    return parse(localStorage.getItem(STORAGE_PREFIX + uid));
  } catch {
    return null;
  }
}

function cacheBookAddPrompt(uid: string, ask: boolean | null): void {
  try {
    if (ask === null) localStorage.removeItem(STORAGE_PREFIX + uid);
    else localStorage.setItem(STORAGE_PREFIX + uid, ask ? '1' : '0');
  } catch {
    // Quota — der Live-Wert kommt ohnehin aus der RTDB
  }
}

export function subscribeBookAddPrompt(
  uid: string,
  onChange: (ask: boolean | null) => void
): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'bookAddPrompt')),
    (snap) => {
      const ask = parse(snap.val());
      cacheBookAddPrompt(uid, ask);
      onChange(ask);
    },
    { label: 'bookAddPrompt' }
  );
}

export async function setBookAddPrompt(uid: string, ask: boolean): Promise<void> {
  cacheBookAddPrompt(uid, ask);
  await dbRef(userPath(uid, 'bookAddPrompt')).set(ask);
}
