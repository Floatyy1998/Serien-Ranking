import { useEffect, useMemo, useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { isSameBookIdentity } from '../../../lib/books/bookIdentity';
import { dbRef, paths } from '../../../services/db/ref';
import type { Book } from '../../../types/Book';

const MAX_FRIENDS = 40;
const CACHE_MS = 5 * 60 * 1000;

export interface FriendOwnedBook {
  friendUid: string;
  friendName: string;
  book: Book;
}

const cache = new Map<string, { at: number; list: FriendOwnedBook[] }>();

async function loadOwned(friend: {
  uid: string;
  displayName?: string;
  username: string;
}): Promise<FriendOwnedBook[]> {
  try {
    const snap = await dbRef(paths.books(friend.uid)).once('value');
    const raw = (snap.val() || {}) as Record<string, Book>;
    return Object.entries(raw)
      .filter(([, b]) => b?.title && b.ownedAt && !b.hidden)
      .map(([id, b]) => ({
        friendUid: friend.uid,
        friendName: friend.displayName || friend.username,
        book: { ...b, id, authors: b.authors ?? [], currentPage: b.currentPage ?? 0 },
      }));
  } catch {
    return [];
  }
}

/** Alle Bücher, die Freunde physisch besitzen (ein Lesevorgang je Freund, 5 Minuten gecacht). */
export const useFriendsOwnedBooks = (enabled = true): FriendOwnedBook[] => {
  const { friends } = useOptimizedFriends();
  const key = friends
    .slice(0, MAX_FRIENDS)
    .map((f) => f.uid)
    .join(',');
  const [list, setList] = useState<FriendOwnedBook[]>(() => cache.get(key)?.list ?? []);

  useEffect(() => {
    if (!enabled || !key) {
      setList([]);
      return;
    }
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) {
      setList(hit.list);
      return;
    }
    let cancelled = false;
    Promise.all(friends.slice(0, MAX_FRIENDS).map(loadOwned)).then((parts) => {
      const merged = parts.flat();
      cache.set(key, { at: Date.now(), list: merged });
      if (!cancelled) setList(merged);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return list;
};

/** Freunde, die genau dieses Buch besitzen (gleiche ID oder gleicher Titel samt Band/Beteiligten). */
export const useFriendsOwningBook = (
  id: string | undefined,
  title: string | undefined,
  authors: string[] | undefined
): FriendOwnedBook[] => {
  const all = useFriendsOwnedBooks(!!id);
  return useMemo(() => {
    if (!id) return [];
    return all.filter(
      (e) => e.book.id === id || (!!title && isSameBookIdentity({ id, title, authors }, e.book))
    );
  }, [all, id, title, authors]);
};
