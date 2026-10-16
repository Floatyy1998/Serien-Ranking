import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCatalogPage, type CatalogOptions } from '../../services/api/bookDiscovery';
import type { BookSearchResult } from '../../types/Book';
import { scrollParent } from './useBookShelf';

const MAX_PAGES = 16;

interface Feed {
  key: string;
  pages: BookSearchResult[][];
  done: boolean;
  error: boolean;
  pending: boolean;
}

const fresh = (key: string, pending: boolean): Feed => ({
  key,
  pages: [],
  done: false,
  error: false,
  pending,
});

/** Katalog-Genre (und/oder Stimmung) als endloses Raster: erste Seite sofort, weitere beim Scrollen. */
export function useCatalogFeed(genre: string | undefined, options: CatalogOptions) {
  const { mood, sort, audience } = options;
  const key = JSON.stringify({ genre, mood, sort, audience });
  const [feed, setFeed] = useState<Feed>(() => fresh(key, false));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const current = feed.key === key ? feed : null;

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

  const pendingNow = current?.pending ?? false;
  const loadedPages = current?.pages.length ?? 0;
  const stopped = !!current && (current.done || current.error || loadedPages >= MAX_PAGES);

  useEffect(() => {
    if (pendingNow || stopped) return;
    const page = loadedPages + 1;
    if (page > 1 && !near) return;
    setFeed((prev) => (prev.key === key ? { ...prev, pending: true } : fresh(key, true)));
    // Kein Aufräumen nötig: Antworten zu einem veralteten Schlüssel verwirft das Zusammenführen unten.
    void fetchCatalogPage(genre, { mood, sort, audience }, page)
      .then(
        ({ items, done }) => ({ items, done, error: false }),
        () => ({ items: [] as BookSearchResult[], done: true, error: page === 1 })
      )
      .then(({ items, done, error }) =>
        setFeed((prev) => {
          if (prev.key !== key) return prev;
          if (prev.pages.length + 1 !== page) return { ...prev, pending: false };
          return { key, pages: [...prev.pages, items], done, error, pending: false };
        })
      );
  }, [key, near, pendingNow, loadedPages, stopped, genre, mood, sort, audience]);

  const pages = current?.pages;
  const items = useMemo(() => pages?.flat() ?? [], [pages]);
  return {
    sentinelRef,
    items,
    loading: !current || (loadedPages === 0 && !current.done),
    loadingMore: pendingNow && items.length > 0,
    error: !!current?.error,
    finished: stopped && !pendingNow,
  };
}
