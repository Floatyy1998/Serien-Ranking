/**
 * Profilbild hochladen und überall nachziehen: Firebase Auth, der eigene
 * Nutzerknoten, der Such-Index und die Kopien in fremden Knoten. Eine Stelle
 * für alle Aufrufer (Einstellungen und Profil-Hub), damit kein Weg einen der
 * Schritte vergisst.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { dbRef, userPath } from './db/ref';
import { syncUserSearchIndex } from './firebase/userSearchIndex';

/** Zugeschnittene Avatare sind klein; alles darüber ist ein Versehen. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type ProfileUser = Pick<firebase.User, 'uid' | 'updateProfile' | 'reload'>;

/**
 * Der Upload überschreibt `profile-images/<uid>` und Storage vergibt dabei ein
 * neues Download-Token — jede alte Kopie der URL liefert danach 403. Deshalb
 * werden die Snapshots in den Freundeslisten und in den Leaderboard-Stats
 * sofort mitgezogen statt erst beim 14-Tage-Sync des FriendsProviders.
 */
const propagatePhotoURL = async (uid: string, downloadURL: string): Promise<void> => {
  try {
    const snapshot = await dbRef(userPath(uid, 'friends')).once('value');
    const friendIds = Object.keys((snapshot.val() as Record<string, unknown> | null) || {});
    await Promise.all(
      friendIds.map((friendId) =>
        dbRef(userPath(friendId, 'friends', uid, 'photoURL'))
          .set(downloadURL)
          .catch(() => {})
      )
    );
  } catch {
    // best effort
  }
  await dbRef(`leaderboardStats/${uid}/photoURL`)
    .set(downloadURL)
    .catch(() => {});
};

export const uploadProfileImage = async (user: ProfileUser, image: Blob): Promise<string> => {
  const imageRef = firebase.storage().ref().child(`profile-images/${user.uid}`);

  await imageRef.put(image, { contentType: image.type || 'image/jpeg' });
  const downloadURL: string = await imageRef.getDownloadURL();

  await user.updateProfile({ photoURL: downloadURL });
  await dbRef(userPath(user.uid, 'photoURL')).set(downloadURL);
  // Such-Index spiegeln (best effort, wirft nie)
  void syncUserSearchIndex(user.uid, { photoURL: downloadURL });
  void propagatePhotoURL(user.uid, downloadURL);
  await user.reload();

  return downloadURL;
};
