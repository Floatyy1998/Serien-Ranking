import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { dbGet, paths } from '../../services/db/ref';
import {
  compareFriendMovieStatus,
  friendMovieStatus,
  type FriendMovieRef,
  type FriendMovieStatus,
} from '../../lib/social/friendMovieStatus';

export interface FriendMovieEntry extends FriendMovieStatus {
  uid: string;
  displayName: string;
  photoURL?: string;
}

/** Liest pro Freund nur den einen Film-Eintrag (Punkt-Read) und liefert, wer ihn hat und wie weit. */
export function useFriendsMovieStatus(movieId: number | undefined): {
  loading: boolean;
  entries: FriendMovieEntry[];
} {
  const { friends } = useOptimizedFriends();
  const [byUid, setByUid] = useState<Record<string, FriendMovieStatus | null> | null>(null);

  useEffect(() => {
    if (!movieId || friends.length === 0) {
      setByUid({});
      return;
    }
    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        friends.map(async (friend) => {
          try {
            const ref = await dbGet<FriendMovieRef>(paths.movieItem(friend.uid, movieId));
            return [friend.uid, friendMovieStatus(ref)] as const;
          } catch (err) {
            console.error(`[FriendsMovieStatus] read failed for ${friend.uid}`, err);
            return [friend.uid, null] as const;
          }
        })
      );
      if (!cancelled) setByUid(Object.fromEntries(results));
    })();

    return () => {
      cancelled = true;
    };
  }, [friends, movieId]);

  const entries = useMemo<FriendMovieEntry[]>(() => {
    if (!byUid) return [];
    const list: FriendMovieEntry[] = [];
    for (const friend of friends) {
      const status = byUid[friend.uid];
      if (!status) continue;
      list.push({
        ...status,
        uid: friend.uid,
        displayName: friend.displayName || friend.username || 'Friend',
        photoURL: friend.photoURL,
      });
    }
    return list.sort(compareFriendMovieStatus);
  }, [friends, byUid]);

  return { loading: byUid === null, entries };
}
