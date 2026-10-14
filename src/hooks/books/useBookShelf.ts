import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchShelf,
  fetchShelfPage,
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

const MAX_PAGES = 12;

/** rootMargin wirkt nur am Root — mit dem Viewport als Root schneidet der App-Scrollcontainer den Vorlauf ab. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
  }
  return null;
}

interface MorePages {
  key: string;
  pages: BookSearchResult[][];
  done: boolean;
}

/** Lädt weitere Seiten nach, solange das Element hinter der Liste in Sichtnähe ist. */
export function useShelfMore(
  id: ShelfId,
  options: Pick<ShelfOptions, 'sort' | 'theme'>,
  enabled: boolean
) {
  const key = JSON.stringify({ id, sort: options.sort, theme: options.theme });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [more, setMore] = useState<MorePages>({ key, pages: [], done: false });
  const [pending, setPending] = useState<string | null>(null);
  const current = more.key === key ? more : null;
  const pages = current?.pages;
  const items = useMemo(() => pages?.flat() ?? [], [pages]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => setNear(entries[0].isIntersecting), {
      root: scrollParent(node),
      rootMargin: '0px 0px 900px 0px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const page = (pages?.length ?? 0) + 1;
  const exhausted = !!current?.done || page > MAX_PAGES;

  useEffect(() => {
    if (!enabled || !near || exhausted || pending) return;
    const tag = `${key}#${page}`;
    const { id: shelf, sort, theme } = JSON.parse(key) as ShelfOptions & { id: ShelfId };
    setPending(tag);
    void fetchShelfPage(shelf, { sort, theme }, page)
      .then(
        ({ items, done }) => ({ items, done }),
        () => ({ items: [] as BookSearchResult[], done: true })
      )
      .then(({ items, done }) => {
        setMore((prev) => {
          const base = prev.key === key ? prev : { key, pages: [], done: false };
          return base.pages.length + 1 === page
            ? { key, pages: [...base.pages, items], done }
            : base;
        });
        setPending(null);
      });
  }, [enabled, near, exhausted, pending, key, page]);

  return {
    sentinelRef,
    items,
    loadingMore: !!pending && pending.startsWith(key),
    exhausted,
  };
}
