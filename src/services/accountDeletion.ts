/** Konto-Löschung (Store-Pflicht) — Re-Auth im Client, Löschung serverseitig. */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { beginAccountDeletion, endAccountDeletion } from './accountDeletionState';
import { analyticsService } from './analyticsService';
import { backendFetch } from './backendApi';
import { dbRef, userPath } from './db/ref';
import { reauthenticateSocial } from './firebase/socialAuth';

/**
 * password = null → Social-Only-Konto, Re-Auth läuft über den Google/Apple-Provider.
 *
 * Gelöscht wird ausschließlich im Backend (`POST /account/delete`): der Client
 * darf die Spuren außerhalb von `users/$uid` per Datenbank-Rules gar nicht
 * anfassen — `leaderboardTop` ist `.write:false`, `clientErrors` und
 * `moderationQueue` sind für ihn nicht einmal lesbar, fremde Benachrichtigungen
 * erst recht nicht. Das Backend nimmt die uid nur aus dem verifizierten Token.
 */
export async function deleteAccount(password: string | null): Promise<void> {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error('Kein angemeldeter Nutzer.');

  // Die Re-Auth ist nicht nur Bestätigung: das Backend verlangt ein Token mit
  // frischem auth_time, damit ein abgegriffenes altes Token nichts löschen kann.
  if (password !== null) {
    if (!user.email) throw new Error('Kein angemeldeter Nutzer.');
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(credential);
  } else {
    await reauthenticateSocial(user);
  }
  const uid = user.uid;
  // backendFetch nimmt das gecachte Token — hier erzwingen, damit garantiert
  // das nach der Re-Auth ausgestellte mit frischem auth_time verschickt wird.
  await user.getIdToken(true);

  // Die App läuft während der Löschung weiter. Beides muss VOR dem Aufruf
  // stehen, sonst legen die eigenen Schreiber die Knoten wieder an:
  // selbstheilende value-Listener (readTimes-Baseline) reagieren auf das
  // Entfernen mit ihrem Default, der Analytics-Flush-Timer und der Präsenz-
  // Heartbeat schreiben ohnehin weiter.
  beginAccountDeletion(uid);
  analyticsService.stopForAccountDeletion();
  await cancelPresenceOnDisconnect(uid);

  let response: Response;
  try {
    response = await backendFetch('/account/delete', { method: 'POST' });
  } catch (err) {
    // Abgebrochen — der Nutzer bleibt angemeldet, also die Schreibsperre lösen.
    endAccountDeletion();
    throw err;
  }
  if (!response.ok) {
    endAccountDeletion();
    throw new Error(`Löschung fehlgeschlagen (${response.status})`);
  }

  // Das Backend hat das Auth-Konto zuletzt mitgelöscht — die lokale Sitzung
  // zeigt ins Leere und muss weg, sonst startet die App mit einem toten Nutzer.
  await firebase
    .auth()
    .signOut()
    .catch(() => {});

  try {
    localStorage.removeItem('cachedUser');
    localStorage.removeItem('homeConfig_cache');
    localStorage.removeItem('navConfig_cache');
  } catch {
    /* ignore */
  }
}

/** Sonst schreibt der Verbindungsabbruch nach der Löschung wieder einen Stub. */
async function cancelPresenceOnDisconnect(uid: string): Promise<void> {
  try {
    await dbRef(userPath(uid, 'isOnline')).onDisconnect().cancel();
    await dbRef(userPath(uid, 'lastActive')).onDisconnect().cancel();
  } catch {
    /* best effort */
  }
}
