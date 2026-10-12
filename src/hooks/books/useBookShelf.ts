import { useEffect, useRef, useState } from 'react';
import { fetchShelf, peekShelf, type ShelfId } from '../../services/api/bookDiscovery';
import type { BookSearchResult } from '../../types/Book';

/** Lädt ein Stöber-Regal, sobald sein Container in die Nähe des Sichtbereichs kommt; gecachte Regale sofort. */
export function useBookShelf(id: ShelfId, options: { eager?: boolean; limit?: number } = {}) {
  const { eager = false, limit = 24 } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [cached] = useState(() => peekShelf(id, limit));
  const [visible, setVisible] = useState(eager || !!cached);
  const [items, setItems] = useState<BookSearchResult[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);

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
    fetchShelf(id, limit)
      .then((list) => {
        if (!alive) return;
        setItems(list);
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, limit, visible]);

  return { ref, items, loading, error };
}
