import { interestsToRecord, normalizeInterestIds } from '../../lib/interests/interests';
import { dbGet, dbRef, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';

export async function fetchInterests(uid: string): Promise<string[]> {
  try {
    return normalizeInterestIds(await dbGet(userPath(uid, 'interests')));
  } catch {
    return [];
  }
}

export async function saveInterests(uid: string, ids: string[]): Promise<void> {
  const record = interestsToRecord(ids);
  await dbRef(userPath(uid, 'interests')).set(Object.keys(record).length ? record : null);
}

export function subscribeInterests(uid: string, onChange: (ids: string[]) => void): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'interests')),
    (snap) => onChange(normalizeInterestIds(snap.val())),
    { label: 'interests' }
  );
}
