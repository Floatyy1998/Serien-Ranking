import { useEffect, useState } from 'react';
import { findBook } from '../../../services/api/booksApi';
import type { BookSearchResult, BookSeriesPart } from '../../../types/Book';

const MAX_PARTS = 16;

export interface PartLookup {
  part: BookSeriesPart;
  author?: string;
}

/** Echter Treffer je Band (Wikidata kennt nur Titel) — für Cover und den direkten Sprung zur Detailseite. */
export function useSeriesPartBooks(lookups: PartLookup[]): Record<string, BookSearchResult> {
  const [found, setFound] = useState<Record<string, BookSearchResult>>({});

  useEffect(() => {
    let cancelled = false;
    for (const { part, author } of lookups.slice(0, MAX_PARTS)) {
      if (part.result) {
        const ready = part.result;
        setFound((prev) => (prev[part.wikidataId] ? prev : { ...prev, [part.wikidataId]: ready }));
        continue;
      }
      const last = author?.toLowerCase().split(/\s+/).pop() ?? '';
      void findBook(part.title, author).then((result) => {
        if (cancelled || !result) return;
        if (last && !result.authors?.some((a) => a.toLowerCase().includes(last))) return;
        setFound((prev) => ({ ...prev, [part.wikidataId]: result }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [lookups]);

  return found;
}
