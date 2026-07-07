/**
 * Dünner RTDB-I/O-Wrapper (S1). Kapselt `firebase.database()` + den
 * `serienVersion`-Bump, damit Serien-/Watch-Writes nicht mehr überall den Bump
 * von Hand mitschreiben (und ihn vergessen können).
 *
 * Nutzt intern die compat-SDK (wie der Rest der App). Pfade baut `./paths`.
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { paths } from './paths';

export { paths, userPath } from './paths';

/**
 * Server-Timestamp-Sentinel für RTDB-Writes. Lazy (Funktion, nicht Top-Level-
 * Const), damit der Import von `ref.ts` nicht bricht, wenn ein Consumer-Test
 * Firebase unvollständig mockt — `firebase.database.ServerValue` wird erst zur
 * Aufrufzeit gelesen.
 */
export const serverTimestamp = (): object => firebase.database.ServerValue.TIMESTAMP as object;

/**
 * Atomarer Server-seitiger Increment-Sentinel (`ServerValue.increment`). Lazy,
 * gleiche Begründung wie `serverTimestamp`. Für Zähler wie `replyCount`/`likes`.
 */
export const serverIncrement = (delta: number): object =>
  firebase.database.ServerValue.increment(delta) as object;

/** `firebase.database()` — eine Stelle, falls die Instanziierung mal wechselt. */
export const db = () => firebase.database();

/** Referenz auf einen Pfad (oder die Root, wenn kein Pfad übergeben wird). */
export const dbRef = (path?: string) => (path ? db().ref(path) : db().ref());

/** `once('value')` als Promise auf den rohen Wert. */
export const dbGet = async <T = unknown>(path: string): Promise<T | null> => {
  const snap = await db().ref(path).once('value');
  return (snap.val() as T) ?? null;
};

/** Multi-Path-Update von der DB-Root aus (Keys = volle Pfade). */
export const dbUpdate = (updates: Record<string, unknown>): Promise<void> =>
  db().ref('/').update(updates);

/**
 * Ergänzt eine Multi-Path-Update-Map um den `serienVersion`-Bump und wendet sie
 * atomar an. Für jeden Write, der Serien-/Watch-Daten ändert.
 */
export const updateWithSeriesVersion = (
  uid: string,
  updates: Record<string, unknown>
): Promise<void> => dbUpdate({ ...updates, [paths.serienVersion(uid)]: serverTimestamp() });

/** Setzt nur den `serienVersion`-Bump (wenn kein weiterer Write anfällt). */
export const bumpSeriesVersion = (uid: string): Promise<void> =>
  db().ref(paths.serienVersion(uid)).set(serverTimestamp());
