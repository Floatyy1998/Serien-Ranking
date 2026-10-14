import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { resultKeys } from '../../../lib/books/discoverMix';
import type { BookSearchResult } from '../../../types/Book';

interface DedupeStore {
  order: string[];
  claims: Record<string, string>;
  claim: (key: string, keys: string) => void;
}

const SEP = '\n';

/** Regale einer Seite in Anzeige-Reihenfolge: was weiter oben steht, kommt weiter unten nicht nochmal. */
export const ShelfDedupeContext = createContext<DedupeStore | null>(null);

export function useShelfDedupeStore(order: string[]): DedupeStore {
  const [claims, setClaims] = useState<Record<string, string>>({});
  const claim = useCallback(
    (key: string, keys: string) =>
      setClaims((prev) => (prev[key] === keys ? prev : { ...prev, [key]: keys })),
    []
  );
  return useMemo(() => ({ order, claims, claim }), [order, claims, claim]);
}

/** Schlüssel (siehe resultKeys) der Bücher, die Regale über diesem schon zeigen. */
export function useShelfTaken(key: string | undefined): Set<string> {
  const store = useContext(ShelfDedupeContext);
  const taken = useMemo(() => {
    if (!store || !key) return '';
    return store.order
      .slice(0, Math.max(0, store.order.indexOf(key)))
      .map((k) => store.claims[k] ?? '')
      .filter(Boolean)
      .join(SEP);
  }, [store, key]);
  return useMemo(() => new Set(taken ? taken.split(SEP) : []), [taken]);
}

export function useShelfClaim(key: string | undefined, shown: BookSearchResult[]) {
  const claim = useContext(ShelfDedupeContext)?.claim;
  const keys = shown.flatMap(resultKeys).join(SEP);
  useEffect(() => {
    if (key && claim) claim(key, keys);
  }, [key, claim, keys]);
}
