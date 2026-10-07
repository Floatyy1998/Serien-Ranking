import { useEffect, useState } from 'react';
import { dbRef, paths } from '../../services/db/ref';
import type { Manga } from '../../types/Manga';

export interface FriendMangaState {
  list: Manga[];
  loading: boolean;
}

/** Manga-Sammlung eines Freundes (ohne versteckte). Ohne Leserecht bleibt die Liste leer. */
export const useFriendManga = (friendId: string | undefined): FriendMangaState => {
  const [state, setState] = useState<FriendMangaState>({ list: [], loading: !!friendId });

  useEffect(() => {
    if (!friendId) {
      setState({ list: [], loading: false });
      return;
    }
    let cancelled = false;
    setState({ list: [], loading: true });
    dbRef(paths.manga(friendId))
      .once('value')
      .then((snap) => {
        if (cancelled) return;
        const raw = (snap.val() || {}) as Record<string, Manga>;
        const list = Object.values(raw).filter((m) => m?.anilistId && m.title && !m.hidden);
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
