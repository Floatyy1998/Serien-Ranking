/**
 * Endgültige Konto-Löschung (Store-Pflicht: Play-Datensicherheit + Apple 5.1.1).
 * Reihenfolge ist wichtig: erst Re-Auth (Firebase verlangt frisches Login für
 * user.delete()), dann alle RTDB-/Storage-Daten (solange noch Schreibrechte
 * bestehen), zuletzt das Auth-Konto selbst.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { dbGet, dbRef, userPath } from './db/ref';

export async function deleteAccount(password: string): Promise<void> {
  const user = firebase.auth().currentUser;
  if (!user?.email) throw new Error('Kein angemeldeter Nutzer.');

  const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
  await user.reauthenticateWithCredential(credential);
  const uid = user.uid;

  // Presence-onDisconnect abbestellen, sonst schreibt der Verbindungsabbruch
  // nach dem Löschen wieder einen users/$uid-Stub.
  try {
    await dbRef(userPath(uid, 'isOnline')).onDisconnect().cancel();
    await dbRef(userPath(uid, 'lastActive')).onDisconnect().cancel();
  } catch {
    /* best effort */
  }

  // Beidseitige Freundschaften lösen (eigene friends-Node fällt mit users/$uid).
  try {
    const friends = (await dbGet<Record<string, unknown>>(userPath(uid, 'friends'))) || {};
    await Promise.all(
      Object.keys(friends).map((friendUid) =>
        dbRef(`users/${friendUid}/friends/${uid}`)
          .remove()
          .catch(() => {})
      )
    );
  } catch {
    /* best effort */
  }

  // Öffentliche Referenzen
  try {
    const publicId = await dbGet<string>(userPath(uid, 'publicProfileId'));
    if (publicId) await dbRef(`publicProfiles/${publicId}`).remove();
  } catch {
    /* best effort */
  }
  await dbRef(`userSearchIndex/${uid}`)
    .remove()
    .catch(() => {});
  await dbRef(`leaderboardStats/${uid}`)
    .remove()
    .catch(() => {});

  // Profilbild im Storage
  try {
    await firebase.storage().ref(`profile-images/${uid}`).delete();
  } catch {
    /* existiert oft nicht */
  }

  // Alle Nutzerdaten — der eigentliche Kern der Löschung
  await dbRef(`users/${uid}`).remove();

  // Auth-Konto zuletzt (danach sind keine RTDB-Writes mehr möglich)
  await user.delete();

  // Lokale Spuren
  try {
    localStorage.removeItem('cachedUser');
    localStorage.removeItem('homeConfig_cache');
    localStorage.removeItem('navConfig_cache');
  } catch {
    /* ignore */
  }
}
