import { useEffect, useState } from 'react';
import { findBook } from '../../../services/api/booksApi';
import type { BookSearchResult, BookSeriesPart } from '../../../types/Book';

const MAX_PARTS = 16;
// Jede Suche kostet bis zu drei Hardcover-Abfragen — nie alle Bände auf einmal.
const PARALLEL = 3;

export interface PartLookup {
  part: BookSeriesPart;
  author?: string;
}

/** Echter Treffer je Band (Wikidata kennt nur Titel) — für Cover und den direkten Sprung zur Detailseite. */
export function useSeriesPartBooks(lookups: PartLookup[]): Record<string, BookSearchResult> {
  const [found, setFound] = useState<Record<string, BookSearchResult>>({});

  useEffect(() => {
    let cancelled = false;
    const queue: PartLookup[] = [];
    for (const lookup of lookups.slice(0, MAX_PARTS)) {
      const { part } = lookup;
      if (part.result) {
        const ready = part.result;
        setFound((prev) => (prev[part.wikidataId] ? prev : { ...prev, [part.wikidataId]: ready }));
      } else queue.push(lookup);
    }
    const work = async () => {
      for (let next = queue.shift(); next && !cancelled; next = queue.shift()) {
        const { part, author } = next;
        const result = await findBook(part.title, author);
        if (cancelled || !result) continue;
        const last = author?.toLowerCase().split(/\s+/).pop() ?? '';
        if (last && !result.authors?.some((a) => a.toLowerCase().includes(last))) continue;
        setFound((prev) => ({ ...prev, [part.wikidataId]: result }));
      }
    };
    for (let i = 0; i < PARALLEL; i++) void work();
    return () => {
      cancelled = true;
    };
  }, [lookups]);

  return found;
}
