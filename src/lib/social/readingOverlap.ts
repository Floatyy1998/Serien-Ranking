/** Gemeinsame Manga und Bücher zweier Nutzer — Grundlage des Lese-Teils im Taste Match. */

import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';

export type ReadingKind = 'manga' | 'book';

export interface ReadingEntry {
  kind: ReadingKind;
  id: string;
  title: string;
  cover?: string;
  authors?: string[];
  rating?: number;
  matchKeys: string[];
}

export interface ReadingPair {
  user: ReadingEntry;
  friend: ReadingEntry;
}

export interface ReadingOverlap {
  pairs: ReadingPair[];
  userCount: number;
  friendCount: number;
  score: number;
}

const normalize = (text: string | undefined): string =>
  (text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const positive = (value: number | undefined): number | undefined =>
  typeof value === 'number' && value > 0 ? value : undefined;

export function bookMatchKeys(book: Book): string[] {
  const keys = [`id:${book.id}`];
  if (book.isbn13) keys.push(`isbn:${book.isbn13.replace(/[^0-9X]/gi, '')}`);
  if (book.hardcoverId) keys.push(`hc:${book.hardcoverId}`);
  if (book.olWorkId) keys.push(`ol:${book.olWorkId}`);
  if (book.wikidataId) keys.push(`wd:${book.wikidataId}`);
  if (book.googleId) keys.push(`g:${book.googleId}`);
  const title = normalize(book.title);
  const author = normalize(book.authors?.[0]);
  if (title && author) keys.push(`ta:${title}|${author}`);
  return keys;
}

export function mangaEntries(raw: Record<string, Manga> | null, uid: string): ReadingEntry[] {
  return Object.values(raw || {})
    .filter((m) => m?.anilistId && m.title && !m.hidden)
    .map((m) => ({
      kind: 'manga' as const,
      id: String(m.anilistId),
      title: m.title,
      cover: m.poster || undefined,
      rating: positive(m.rating?.[uid]),
      matchKeys: [`al:${m.anilistId}`],
    }));
}

export function bookEntries(raw: Record<string, Book> | null): ReadingEntry[] {
  return Object.values(raw || {})
    .filter((b) => b?.id && b.title && !b.hidden)
    .map((b) => ({
      kind: 'book' as const,
      id: b.id,
      title: b.title,
      cover: b.cover,
      authors: b.authors,
      rating: positive(b.rating),
      matchKeys: bookMatchKeys(b),
    }));
}

/** Paart jeden Titel höchstens einmal; Score = Anteil gemeinsamer an allen Titeln beider. */
export function readingOverlap(user: ReadingEntry[], friend: ReadingEntry[]): ReadingOverlap {
  const byKey = new Map<string, number>();
  friend.forEach((entry, index) => {
    for (const key of entry.matchKeys) if (!byKey.has(key)) byKey.set(key, index);
  });

  const taken = new Set<number>();
  const pairs: ReadingPair[] = [];
  for (const entry of user) {
    const match = entry.matchKeys
      .map((key) => byKey.get(key))
      .find((index): index is number => index !== undefined && !taken.has(index));
    if (match === undefined) continue;
    taken.add(match);
    pairs.push({ user: entry, friend: friend[match] });
  }

  const union = user.length + friend.length - pairs.length;
  return {
    pairs,
    userCount: user.length,
    friendCount: friend.length,
    score: union > 0 ? Math.round((pairs.length / union) * 100) : 0,
  };
}
