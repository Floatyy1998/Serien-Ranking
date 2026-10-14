import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchShelf,
  peekShelf,
  type ShelfId,
  type ShelfOptions,
} from '../../services/api/bookDiscovery';
import type { BookSearchResult } from '../../types/Book';

export interface ShelfRequest extends ShelfOptions {
  id: ShelfId;
}

interface Loaded {
  key: string;
  lists: BookSearchResult[][];
  error: boolean;
}

/** Lädt Stöber-Regale, sobald ihr Container in die Nähe des Sichtbereichs kommt; gecachte Regale sofort. */
export function useBookShelves(requests: ShelfRequest[], options: { eager?: boolean } = {}) {
  const key = JSON.stringify(requests);
  const ref = useRef<HTMLElement | null>(null);
  const cachedLists = useMemo(() => {
    const lists = (JSON.parse(key) as ShelfRequest[]).map((r) => peekShelf(r.id, r));
    return lists.every(Boolean) ? (lists as BookSearchResult[][]) : null;
  }, [key]);
  const [visible, setVisible] = useState(!!options.eager || !!cachedLists);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    const parsed = JSON.parse(key) as ShelfRequest[];
    void Promise.allSettled(parsed.map((r) => fetchShelf(r.id, r))).then((settled) => {
      if (!alive) return;
      setLoaded({
        key,
        lists: settled.map((s) => (s.status === 'fulfilled' ? s.value : [])),
        error: settled.every((s) => s.status === 'rejected'),
      });
    });
    return () => {
      alive = false;
    };
  }, [key, visible]);

  const current = loaded?.key === key ? loaded : null;
  return {
    ref,
    lists: current?.lists ?? cachedLists ?? requests.map(() => []),
    loading: !current && !cachedLists,
    error: current?.error ?? false,
  };
}

export function useBookShelf(id: ShelfId, options: ShelfOptions & { eager?: boolean } = {}) {
  const { eager, ...shelf } = options;
  const { ref, lists, loading, error } = useBookShelves([{ id, ...shelf }], { eager });
  return { ref, items: lists[0], loading, error };
}
