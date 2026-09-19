import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { prepareImageForUpload } from '../../lib/image/imageCompress';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * Die Datei-Endung muss zum hochgeladenen Typ passen: der Beitrag speichert
 * nur die URL, und die Anzeige erkennt Bilder an genau dieser Endung.
 */
export async function uploadDiscussionImage(uid: string, file: File): Promise<string> {
  const prepared = await prepareImageForUpload(file);
  const ext = EXTENSIONS[prepared.contentType] || 'jpg';
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storageRef = firebase.storage().ref(`discussions/${uid}/${name}`);
  await storageRef.put(prepared.blob, { contentType: prepared.contentType });
  return storageRef.getDownloadURL();
}
