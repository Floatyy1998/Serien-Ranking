import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

/**
 * userSearchIndex/$uid — leichter Such-Knoten für die Freundes-Suche.
 *
 * Unter den gehärteten Database-Rules ist der users-Root nicht mehr für alle
 * lesbar; die Suche (AddFriendDialog, sendFriendRequestOp) läuft stattdessen
 * über diesen Index. Er wird per Self-Heal beim Login (authProvider), bei
 * Profil-Änderungen (Settings/Register) und per Admin-Backfill (AdminDashboard
 * → Users) gepflegt. Die Rules erlauben exakt diese sechs Felder.
 */

/** Längen-Limits aus database.rules.json (.validate) — längere Werte würden den Write verwerfen. */
const MAX_NAME_LENGTH = 100;
const MAX_PHOTO_URL_LENGTH = 2048;
const MAX_BIO_LENGTH = 500;

export interface UserSearchIndexSource {
  username?: unknown;
  displayName?: unknown;
  photoURL?: unknown;
  bio?: unknown;
}

export interface UserSearchIndexEntry {
  username?: string;
  usernameLower?: string;
  displayName?: string;
  displayNameLower?: string;
  photoURL?: string;
  bio?: string;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/**
 * Baut den userSearchIndex-Eintrag aus (Teil-)Profildaten. Fehlende Felder
 * werden weggelassen (nicht als null geschrieben), Werte werden auf die
 * Rules-Limits gekürzt bzw. verworfen. Gibt null zurück, wenn kein einziges
 * Feld vorhanden ist.
 */
export function buildUserSearchIndexEntry(
  source: UserSearchIndexSource
): UserSearchIndexEntry | null {
  const entry: UserSearchIndexEntry = {};

  const username = asNonEmptyString(source.username);
  if (username) {
    entry.username = username.slice(0, MAX_NAME_LENGTH);
    entry.usernameLower = entry.username.toLowerCase();
  }

  const displayName = asNonEmptyString(source.displayName);
  if (displayName) {
    entry.displayName = displayName.slice(0, MAX_NAME_LENGTH);
    entry.displayNameLower = entry.displayName.toLowerCase();
  }

  const photoURL = asNonEmptyString(source.photoURL);
  // URL kürzen würde sie kaputt machen — überlange URLs lieber weglassen.
  if (photoURL && photoURL.length <= MAX_PHOTO_URL_LENGTH) {
    entry.photoURL = photoURL;
  }

  const bio = asNonEmptyString(source.bio);
  if (bio) {
    entry.bio = bio.slice(0, MAX_BIO_LENGTH);
  }

  return Object.keys(entry).length > 0 ? entry : null;
}

/**
 * Best-effort Spiegelung ins userSearchIndex (Self-Heal). PATCH = Merge,
 * damit partielle Profil-Saves (z. B. nur photoURL) die übrigen Index-Felder
 * nicht löschen. Wirft nie.
 *
 * Bewusst REST statt SDK-update(): Solange die gehärteten Rules noch nicht
 * deployt sind, verweigert die DB den Write — das SDK loggt dabei intern eine
 * nicht abfangbare "FIREBASE WARNING: permission_denied" in die Console.
 * Der REST-Call schlägt dagegen komplett still fehl (non-ok Response).
 */
export async function syncUserSearchIndex(
  uid: string,
  source: UserSearchIndexSource
): Promise<void> {
  try {
    const entry = buildUserSearchIndexEntry(source);
    if (!entry) return;

    // options ist im compat-SDK nur als `Object` typisiert
    const { databaseURL } = firebase.app().options as { databaseURL?: string };
    const token = await firebase.auth().currentUser?.getIdToken();
    if (!databaseURL || !token) return;

    await fetch(
      `${databaseURL}/userSearchIndex/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(token)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }
    );
    // Response-Status bewusst ignoriert: permission_denied (alte Rules) ist
    // erwartet; nach dem Rules-Deploy geht der Write durch.
  } catch {
    // Best-effort: Index-Pflege darf Login/Profil-Save nie blockieren.
  }
}
