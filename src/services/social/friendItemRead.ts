import { dbGet, userPath } from '../db/ref';

type FriendItem = Record<string, unknown> | null;

const TTL = 60_000;
const cache = new Map<string, { at: number; value: Promise<FriendItem> }>();

/** Punkt-Lesen eines Titels aus der Sammlung eines Freundes; kurz gemerkt, weil mehrere Bausteine derselben Seite danach fragen. */
export function readFriendItem(
  uid: string,
  kind: 'series' | 'movies',
  id: string | number
): Promise<FriendItem> {
  const key = `${uid}/${kind}/${id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const value = dbGet<Record<string, unknown>>(userPath(uid, kind, id)).then(
    (item) => item ?? null,
    (error) => {
      cache.delete(key);
      throw error;
    }
  );
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function clearFriendItemCache(): void {
  cache.clear();
}
