import { useSyncExternalStore } from 'react';

/** Suchverlauf je Bereich: Serien/Filme/Personen, Bücher und Manga getrennt, nur auf diesem Gerät. */
export type RecentSearchScope = 'media' | 'books' | 'manga';

// Bestehende Schlüssel, damit /search, /books/search und /manga/search denselben Verlauf sehen.
const KEYS: Record<RecentSearchScope, string> = {
  media: 'recentSearches',
  books: 'bookRecentSearches',
  manga: 'mangaRecentSearches',
};

const LIMITS: Record<RecentSearchScope, number> = { media: 6, books: 8, manga: 8 };

const EMPTY: string[] = [];
const cache = new Map<RecentSearchScope, { raw: string | null; list: string[] }>();
const listeners = new Set<() => void>();

const readRaw = (scope: RecentSearchScope): string | null => {
  try {
    return localStorage.getItem(KEYS[scope]);
  } catch {
    return null;
  }
};

const parse = (raw: string | null, max: number): string[] => {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string').slice(0, max)
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

export const getRecentSearches = (scope: RecentSearchScope): string[] => {
  const raw = readRaw(scope);
  const hit = cache.get(scope);
  if (hit && hit.raw === raw) return hit.list;
  const list = parse(raw, LIMITS[scope]);
  cache.set(scope, { raw, list });
  return list;
};

const write = (scope: RecentSearchScope, list: string[]): void => {
  let raw: string | null = JSON.stringify(list);
  try {
    localStorage.setItem(KEYS[scope], raw);
  } catch {
    // Quota: bis zum Neuladen im Speicher behalten
    raw = readRaw(scope);
  }
  cache.set(scope, { raw, list });
  listeners.forEach((l) => l());
};

export const addRecentSearch = (scope: RecentSearchScope, query: string): void => {
  const term = query.trim();
  if (term.length < 2) return;
  const lower = term.toLowerCase();
  const rest = getRecentSearches(scope).filter((s) => s.toLowerCase() !== lower);
  write(scope, [term, ...rest].slice(0, LIMITS[scope]));
};

export const removeRecentSearch = (scope: RecentSearchScope, term: string): void => {
  const list = getRecentSearches(scope);
  const next = list.filter((s) => s !== term);
  if (next.length !== list.length) write(scope, next);
};

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const serverSnapshot = (): string[] => EMPTY;

export const useRecentSearches = (scope: RecentSearchScope): string[] =>
  useSyncExternalStore(subscribe, () => getRecentSearches(scope), serverSnapshot);
