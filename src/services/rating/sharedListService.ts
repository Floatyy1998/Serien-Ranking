import { dbGet, dbRef, dbUpdate, userPath } from '../db/ref';
import { getUserDisplayData } from '../firebase/userDisplayData';
import {
  expandSharedList,
  type SharedList,
  type SharedListPayload,
} from '../../lib/rating/sharedList';

export const sharedListPath = (id: string): string => `sharedLists/${id}`;

export async function publishSharedList(folderId: string, payload: SharedListPayload) {
  await dbUpdate({
    [sharedListPath(folderId)]: payload,
    [userPath(payload.owner, 'ratingFolders', folderId, 'shared')]: true,
  });
}

export async function updateSharedList(folderId: string, payload: SharedListPayload) {
  await dbRef(sharedListPath(folderId)).set(payload);
}

export async function unpublishSharedList(uid: string, folderId: string) {
  await dbUpdate({
    [sharedListPath(folderId)]: null,
    [userPath(uid, 'ratingFolders', folderId, 'shared')]: null,
  });
}

export async function fetchSharedList(id: string): Promise<SharedList | null> {
  return expandSharedList(id, await dbGet(sharedListPath(id)));
}

export async function resolveOwnerName(user: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}): Promise<string> {
  try {
    return (await getUserDisplayData(user)).username;
  } catch {
    return user.displayName || '';
  }
}

const SIG_KEY = 'sharedListSig:';

export function readSharedListSignature(id: string): string | null {
  try {
    return localStorage.getItem(SIG_KEY + id);
  } catch {
    return null;
  }
}

export function rememberSharedListSignature(id: string, sig: string): void {
  try {
    localStorage.setItem(SIG_KEY + id, sig);
  } catch {
    /* privates Fenster */
  }
}
