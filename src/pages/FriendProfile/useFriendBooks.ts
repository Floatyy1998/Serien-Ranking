import { useEffect, useState } from 'react';
import { dbRef, paths } from '../../services/db/ref';
import type { Book } from '../../types/Book';

export interface FriendBooksState {
  list: Book[];
  loading: boolean;
}

/** Bücher eines Freundes (ohne ausgeblendete). Ohne Leserecht bleibt die Liste leer. */
export const useFriendBooks = (friendId: string | undefined): FriendBooksState => {
  const [state, setState] = useState<FriendBooksState>({ list: [], loading: !!friendId });

  useEffect(() => {
    if (!friendId) {
      setState({ list: [], loading: false });
      return;
    }
    let cancelled = false;
    setState({ list: [], loading: true });
    dbRef(paths.books(friendId))
      .once('value')
      .then((snap) => {
        if (cancelled) return;
        const raw = (snap.val() || {}) as Record<string, Book>;
        const list = Object.entries(raw)
          .filter(([, b]) => b?.title && !b.hidden)
          .map(([id, b]) => ({
            ...b,
            id,
            authors: b.authors ?? [],
            currentPage: b.currentPage ?? 0,
          }));
        setState({ list, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ list: [], loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [friendId]);

  return state;
};
