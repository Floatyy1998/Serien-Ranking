/**
 * Profilbild hochladen und überall nachziehen: Firebase Auth, der eigene
 * Nutzerknoten und der Such-Index. Eine Stelle für alle Aufrufer (Einstellungen
 * und Profil-Hub), damit kein Weg einen der drei Schritte vergisst.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { dbRef, userPath } from './db/ref';
import { syncUserSearchIndex } from './firebase/userSearchIndex';

/** Zugeschnittene Avatare sind klein; alles darüber ist ein Versehen. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type ProfileUser = Pick<firebase.User, 'uid' | 'updateProfile' | 'reload'>;

export const uploadProfileImage = async (user: ProfileUser, image: Blob): Promise<string> => {
  const imageRef = firebase.storage().ref().child(`profile-images/${user.uid}`);

  await imageRef.put(image, { contentType: image.type || 'image/jpeg' });
  const downloadURL: string = await imageRef.getDownloadURL();

  await user.updateProfile({ photoURL: downloadURL });
  await dbRef(userPath(user.uid, 'photoURL')).set(downloadURL);
  // Such-Index spiegeln (best effort, wirft nie)
  void syncUserSearchIndex(user.uid, { photoURL: downloadURL });
  await user.reload();

  return downloadURL;
};
