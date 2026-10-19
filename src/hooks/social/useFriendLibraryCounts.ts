import { useEffect, useState } from 'react';
import {
  fetchLibraryCounts,
  type PublishedLibraryCounts,
} from '../../services/social/userTotalsService';

/** Die Zahlen ändern sich höchstens stündlich — ein Tab-Wechsel soll nicht neu laden. */
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { counts: PublishedLibraryCounts | null; ts: number }>();

const fromCache = (uids: string[]): Record<string, PublishedLibraryCounts | null> => {
  const map: Record<string, PublishedLibraryCounts | null> = {};
  for (const uid of uids) {
    const hit = cache.get(uid);
    if (hit) map[uid] = hit.counts;
  }
  return map;
};

export const useFriendLibraryCounts = (
  uids: string[]
): Record<string, PublishedLibraryCounts | null> => {
  const key = uids.join(',');
  const [counts, setCounts] = useState(() => fromCache(uids));

  useEffect(() => {
    const list = key ? key.split(',') : [];
    const now = Date.now();
    const stale = list.filter((uid) => {
      const hit = cache.get(uid);
      return !hit || now - hit.ts > CACHE_TTL_MS;
    });
    setCounts(fromCache(list));
    if (stale.length === 0) return;

    let cancelled = false;
    fetchLibraryCounts(stale)
      .then((map) => {
        const ts = Date.now();
        for (const uid of stale) cache.set(uid, { counts: map[uid] ?? null, ts });
        if (!cancelled) setCounts(fromCache(list));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);

  return counts;
};

/** Für die Dev-Vorschau: Zahlen ohne Datenbank vorbelegen. */
export const primeFriendLibraryCounts = (
  map: Record<string, PublishedLibraryCounts | null>
): void => {
  const ts = Date.now();
  for (const [uid, counts] of Object.entries(map)) cache.set(uid, { counts, ts });
};
