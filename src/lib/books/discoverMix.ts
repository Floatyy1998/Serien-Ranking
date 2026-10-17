import type { BookSearchResult } from '../../types/Book';
import { bookMatchKey } from './bookIdentity';

const authorKey = (r: BookSearchResult) =>
  (r.authors?.[0] ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '') ||
  `title:${r.title.toLowerCase()}`;

/** Höchstens `max` Bücher je Autor — die meistgelesenen (meist Band 1) auf den ersten Plätzen des Autors. */
export function capPerAuthor(list: BookSearchResult[], max: number): BookSearchResult[] {
  const groups = new Map<string, BookSearchResult[]>();
  for (const r of list) {
    const key = authorKey(r);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const picks = new Map<string, BookSearchResult[]>();
  for (const [key, items] of groups) {
    picks.set(
      key,
      items
        .map((r, i) => ({ r, i }))
        .sort((a, b) => (b.r.popularity ?? 0) - (a.r.popularity ?? 0) || a.i - b.i)
        .slice(0, max)
        .map(({ r }) => r)
    );
  }
  const used = new Map<string, number>();
  const out: BookSearchResult[] = [];
  for (const r of list) {
    const key = authorKey(r);
    const n = used.get(key) ?? 0;
    const pick = picks.get(key)?.[n];
    if (!pick) continue;
    used.set(key, n + 1);
    out.push(pick);
  }
  return out;
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministisch gemischt: gleicher Seed (z. B. Tag + Regal) → gleiche Reihenfolge. */
export function seededShuffle<T>(list: T[], seed: string): T[] {
  let state = hashSeed(seed);
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const BOX_SET = /\b\d+\s*[-–]\s*\d+\b|box ?set|schuber/i;
/** Band 2+ einer Reihe („Book 2“, „Scythe 2 - …“) — als Einstieg ungeeignet, den nächsten Band zeigt „Nächster Band“. */
const LATER_VOLUME =
  /\b(?:book|band|bd\.|teil|vol\.?|volume|tome|livro|libro)\s*0*(?:[2-9]|\d{2,})\b|\s0*[2-9]\s*[-–:]\s|\s0*(?:[2-9]|1\d)$/i;

/** ID und Titel + Autor — Open Library führt manche Bücher als mehrere Werke. */
export const resultKeys = (r: BookSearchResult) => [r.id, bookMatchKey(r.title, r.authors)];

const uniqueResults = (list: BookSearchResult[]) => {
  const seen = new Set<string>();
  return list.filter((r) => {
    if (BOX_SET.test(r.title) || LATER_VOLUME.test(r.title)) return false;
    const keys = resultKeys(r);
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
};

interface ShelfFilter {
  isOwned: (r: BookSearchResult) => boolean;
  perAuthor: number;
}

/** Sortiertes Regal ohne eigene Bücher und mit Autoren-Deckel; hidden zählt die ausgeblendeten eigenen. */
export function curateShelf(list: BookSearchResult[], { isOwned, perAuthor }: ShelfFilter) {
  const unique = uniqueResults(list);
  const fresh = unique.filter((r) => !isOwned(r));
  return { items: capPerAuthor(fresh, perAuthor), hidden: unique.length - fresh.length };
}

/** Mehrere Regale reihum gemischt, jeden Tag anders, ohne eigene Bücher und mit Autoren-Deckel. */
export function mixShelves(
  lists: BookSearchResult[][],
  { seed, size, ...filter }: ShelfFilter & { seed: string; size: number }
): BookSearchResult[] {
  const shuffled = lists.map((list, i) => seededShuffle(list, `${seed}:${i}`));
  const merged: BookSearchResult[] = [];
  const longest = Math.max(0, ...shuffled.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of shuffled) if (list[i]) merged.push(list[i]);
  }
  return curateShelf(merged, filter).items.slice(0, size);
}

export const daySeed = (now: Date = new Date()) =>
  `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
