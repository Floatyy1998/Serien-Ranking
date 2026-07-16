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

  // Freundschaftsanfragen in beide Richtungen (enthalten Usernamen + E-Mail)
  try {
    const removeRequests = async (field: 'fromUserId' | 'toUserId') => {
      const snap = await dbRef('friendRequests').orderByChild(field).equalTo(uid).once('value');
      const requests = (snap.val() as Record<string, unknown>) || {};
      await Promise.all(
        Object.keys(requests).map((id) =>
          dbRef(`friendRequests/${id}`)
            .remove()
            .catch(() => {})
        )
      );
    };
    await removeRequests('fromUserId');
    await removeRequests('toUserId');
  } catch {
    /* best effort */
  }

  // Monats-Archive der Rangliste: Keys sind YYYY-MM — blind über die mögliche
  // Spanne löschen (remove auf nicht existente Pfade ist ein No-op) statt das
  // komplette Archiv aller Nutzer zu lesen.
  try {
    const now = new Date();
    const months: string[] = [];
    for (let year = 2024; year <= now.getFullYear(); year++) {
      const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12;
      for (let month = 1; month <= lastMonth; month++) {
        months.push(`${year}-${String(month).padStart(2, '0')}`);
      }
    }
    await Promise.all(
      months.map((m) =>
        dbRef(`leaderboardArchive/${m}/${uid}`)
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

  // First-Party-Analytics: Events/Zähler sind user-bezogen gespeichert und
  // gehören mitgelöscht (DSGVO Art. 17).
  await dbRef(`analytics/users/${uid}`)
    .remove()
    .catch(() => {});
  await dbRef(`analytics/global/realtime/activeUsers/${uid}`)
    .remove()
    .catch(() => {});

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
