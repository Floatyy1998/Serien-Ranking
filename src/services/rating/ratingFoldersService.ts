import { dbRef, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';
import {
  compactRatingFolder,
  expandRatingFolders,
  type RatingFolder,
} from '../../lib/rating/ratingFolders';

const folderPath = (uid: string, id?: string) =>
  id ? userPath(uid, 'ratingFolders', id) : userPath(uid, 'ratingFolders');

export function subscribeRatingFolders(
  uid: string,
  onChange: (folders: RatingFolder[]) => void
): () => void {
  return subscribeValue(
    dbRef(folderPath(uid)),
    (snap) => onChange(expandRatingFolders(snap.val())),
    { label: 'ratingFolders' }
  );
}

export async function createRatingFolder(
  uid: string,
  name: string,
  items: Iterable<string>
): Promise<string> {
  const ref = dbRef(folderPath(uid)).push();
  await ref.set(compactRatingFolder(name, items, Date.now()));
  return ref.key as string;
}

export async function saveRatingFolder(
  uid: string,
  folder: RatingFolder,
  name: string,
  items: Iterable<string>
): Promise<void> {
  await dbRef(folderPath(uid, folder.id)).set(
    compactRatingFolder(name, items, folder.createdAt || Date.now())
  );
}

export async function deleteRatingFolder(uid: string, id: string): Promise<void> {
  await dbRef(folderPath(uid, id)).remove();
}

export async function restoreRatingFolder(uid: string, folder: RatingFolder): Promise<void> {
  await dbRef(folderPath(uid, folder.id)).set(
    compactRatingFolder(folder.name, folder.items, folder.createdAt)
  );
}

export async function setRatingFolderItem(
  uid: string,
  folderId: string,
  itemKey: string,
  included: boolean
): Promise<void> {
  const ref = dbRef(userPath(uid, 'ratingFolders', folderId, 'items', itemKey));
  await (included ? ref.set(true) : ref.remove());
}
