/** Konto-Löschung (Store-Pflicht) — Reihenfolge wichtig: Re-Auth, dann RTDB/Storage, zuletzt Auth-Konto. */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';
import { beginAccountDeletion, endAccountDeletion } from './accountDeletionState';
import { analyticsService } from './analyticsService';
import { deleteAllChatsForUser } from './chat/chatService';
import { dbGet, dbRef, userPath } from './db/ref';
import { reauthenticateSocial } from './firebase/socialAuth';

/** password = null → Social-Only-Konto, Re-Auth läuft über den Google/Apple-Provider. */
export async function deleteAccount(password: string | null): Promise<void> {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error('Kein angemeldeter Nutzer.');

  if (password !== null) {
    if (!user.email) throw new Error('Kein angemeldeter Nutzer.');
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(credential);
  } else {
    await reauthenticateSocial(user);
  }
  const uid = user.uid;

  // Die App läuft während der Löschung weiter. Beides muss VOR dem ersten
  // Entfernen stehen, sonst legen die eigenen Schreiber die Knoten wieder an:
  // selbstheilende value-Listener (readTimes-Baseline) reagieren auf das
  // Entfernen mit ihrem Default, der Analytics-Flush-Timer und der Präsenz-
  // Heartbeat schreiben ohnehin weiter.
  beginAccountDeletion(uid);
  analyticsService.stopForAccountDeletion();

  try {
    await purgeUserData(uid);
  } catch (err) {
    // Abgebrochen — der Nutzer bleibt angemeldet, also die Schreibsperre lösen.
    endAccountDeletion();
    throw err;
  }

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

/** Alles außer dem Auth-Konto. Reihenfolge: Fremdreferenzen zuerst, users/$uid zuletzt. */
async function purgeUserData(uid: string): Promise<void> {
  // onDisconnect abbestellen, sonst schreibt der Verbindungsabbruch wieder einen users/$uid-Stub.
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

  // Archiv-Keys sind YYYY-MM — blind über die Spanne löschen statt das komplette Archiv zu lesen.
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

  // Private Chats: kompletter Verlauf beider Seiten (DSGVO Art. 17) — solange
  // die Auth noch lebt, erlauben die Rules dem Teilnehmer die Löschung.
  await deleteAllChatsForUser(uid);

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

  // First-Party-Analytics sind user-bezogen gespeichert — mitlöschen (DSGVO Art. 17).
  await dbRef(`analytics/users/${uid}`)
    .remove()
    .catch(() => {});
  await dbRef(`analytics/global/realtime/activeUsers/${uid}`)
    .remove()
    .catch(() => {});

  // Alle Nutzerdaten — der eigentliche Kern der Löschung
  await dbRef(`users/${uid}`).remove();

  // Nachfassen: die Sperre oben kennt nur die bekannten Schreiber. Kommt der
  // Knoten trotzdem zurück, ist das jetzt noch reparierbar — nach user.delete()
  // sind keine Writes mehr möglich. Writes desselben Clients bleiben in
  // Reihenfolge, das zweite remove gewinnt also gegen ein laufendes Zurück-
  // schreiben.
  const leftover = await dbGet<Record<string, unknown>>(`users/${uid}`);
  if (leftover) {
    console.warn('[deleteAccount] users-Knoten kam zurück:', Object.keys(leftover).join(', '));
    await dbRef(`users/${uid}`).remove();
  }
}
