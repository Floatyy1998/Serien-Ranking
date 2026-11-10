import { dbGet, dbRef, userPath } from '../db/ref';
import { sharedListPath } from './sharedListService';
import { subscribeValue } from '../db/subscribeValue';
import {
  REWATCH_FOLDER_ID,
  REWATCH_FOLDER_NAME,
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

export async function fetchRatingFolders(uid: string): Promise<RatingFolder[]> {
  return expandRatingFolders(await dbGet(folderPath(uid)));
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
    compactRatingFolder(name, items, folder.createdAt || Date.now(), folder.shared)
  );
}

export async function deleteRatingFolder(uid: string, id: string): Promise<void> {
  await dbRef(folderPath(uid, id)).remove();
  await dbRef(sharedListPath(id))
    .remove()
    .catch(() => {});
}

export async function restoreRatingFolder(uid: string, folder: RatingFolder): Promise<void> {
  await dbRef(folderPath(uid, folder.id)).set(
    compactRatingFolder(folder.name, folder.items, folder.createdAt, folder.shared)
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

/** Mehrere Titel auf einmal in eine Liste legen (die Rewatch-Liste entsteht dabei mit Namen). */
export async function addRatingFolderItems(
  uid: string,
  folderId: string,
  itemKeys: string[]
): Promise<void> {
  if (!itemKeys.length) return;
  const update: Record<string, unknown> = {};
  if (folderId === REWATCH_FOLDER_ID) update.name = REWATCH_FOLDER_NAME;
  for (const key of itemKeys) update[`items/${key}`] = true;
  await dbRef(folderPath(uid, folderId)).update(update);
}

/** Mehrere Titel auf einmal aus einer Liste nehmen. */
export async function removeRatingFolderItems(
  uid: string,
  folderId: string,
  itemKeys: string[]
): Promise<void> {
  if (!itemKeys.length) return;
  const update: Record<string, null> = {};
  for (const key of itemKeys) update[`items/${key}`] = null;
  await dbRef(folderPath(uid, folderId)).update(update);
}

export async function setRewatchListItem(
  uid: string,
  itemKey: string,
  included: boolean
): Promise<void> {
  const base = folderPath(uid, REWATCH_FOLDER_ID);
  if (included) {
    await dbRef(base).update({ name: REWATCH_FOLDER_NAME, [`items/${itemKey}`]: true });
  } else {
    await dbRef(`${base}/items/${itemKey}`).remove();
  }
}

export async function createRewatchFolder(uid: string, items: Iterable<string>): Promise<void> {
  const update: Record<string, unknown> = { name: REWATCH_FOLDER_NAME, createdAt: Date.now() };
  for (const key of items) update[`items/${key}`] = true;
  await dbRef(folderPath(uid, REWATCH_FOLDER_ID)).update(update);
}
