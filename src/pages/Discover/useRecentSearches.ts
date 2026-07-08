/**
 * useRecentSearches - Suchverlauf + beliebte Suchen für die Discover-Suche.
 *
 * Portiert aus der früheren Standalone-Suchseite (`pages/Search`), die zugunsten
 * der in Discover integrierten Suche entfernt wurde. Der Verlauf lebt in
 * `localStorage['recentSearches']` (max. 5 Einträge, dedupliziert) und ist
 * unkritisch — Quota-Fehler werden geschluckt.
 */

import { useCallback, useState } from 'react';

const RECENT_KEY = 'recentSearches';
const MAX_RECENT = 5;

const POPULAR_SEARCHES = [
  'Breaking Bad',
  'The Last of Us',
  'Succession',
  'Oppenheimer',
  'Barbie',
  'Wednesday',
];

export interface UseRecentSearchesResult {
  recentSearches: string[];
  popularSearches: string[];
  /** Speichert einen (getrimmten) Begriff ab Länge 2 an den Anfang des Verlaufs. */
  saveToRecent: (query: string) => void;
  removeRecentSearch: (term: string) => void;
}

export const useRecentSearches = (): UseRecentSearchesResult => {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const recent = localStorage.getItem(RECENT_KEY);
      return recent ? (JSON.parse(recent) as string[]) : [];
    } catch {
      return [];
    }
  });

  const persist = (list: string[]) => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {
      // localStorage-Quota – der Verlauf ist unkritisch, still ignorieren.
    }
  };

  const saveToRecent = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setRecentSearches((prev) => {
      if (prev[0] === trimmed) return prev;
      const updated = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
      persist(updated);
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== term);
      persist(updated);
      return updated;
    });
  }, []);

  return { recentSearches, popularSearches: POPULAR_SEARCHES, saveToRecent, removeRecentSearch };
};
