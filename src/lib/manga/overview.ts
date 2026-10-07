/** Reine Auswertungen für die Manga-Übersicht (keine I/O). */

import type { Manga } from '../../types/Manga';
import { normalizeTitle } from '../text/searchRelevance';

const DAY_MS = 24 * 60 * 60 * 1000;

const time = (iso: string | undefined): number => {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : 0;
};

export const mangaTotalChapters = (manga: Manga): number =>
  Math.max(manga.chapters || 0, manga.latestChapterAvailable || 0);

export const mangaUnreadChapters = (manga: Manga): number =>
  Math.max(0, mangaTotalChapters(manga) - (manga.currentChapter || 0));

export const mangaProgressPercent = (manga: Manga): number => {
  const total = mangaTotalChapters(manga);
  if (total <= 0) return 0;
  return Math.min(100, Math.round(((manga.currentChapter || 0) / total) * 100));
};

export const userMangaRating = (manga: Manga, uid: string | undefined): number =>
  uid ? manga.rating?.[uid] || 0 : 0;

export interface NewChapterEntry {
  manga: Manga;
  unread: number;
  releasedAt: string;
}

/** Kapitel, die nach dem letzten Lesen erschienen sind — nur aktive Lektüre, nur frische Releases. */
export function getNewChapterEntries(
  list: Manga[],
  now: number,
  windowDays = 30
): NewChapterEntry[] {
  const entries: NewChapterEntry[] = [];
  for (const manga of list) {
    if (manga.readStatus !== 'reading' && manga.readStatus !== 'paused') continue;
    if ((manga.currentChapter || 0) <= 0 || !manga.lastReleaseDate) continue;
    const released = time(manga.lastReleaseDate);
    if (!released || now - released > windowDays * DAY_MS) continue;
    const unread = mangaUnreadChapters(manga);
    if (unread <= 0) continue;
    const lastRead = time(manga.lastReadAt);
    if (lastRead && lastRead >= released) continue;
    entries.push({ manga, unread, releasedAt: manga.lastReleaseDate });
  }
  return entries.sort((a, b) => time(b.releasedAt) - time(a.releasedAt));
}

/** Geplante Manga, zuletzt hinzugefügte zuerst. */
export function getUpNext(list: Manga[]): Manga[] {
  return list
    .filter((m) => m.readStatus === 'planned')
    .sort((a, b) => time(b.addedAt) - time(a.addedAt));
}

/** Abgeschlossene oder abgebrochene Manga ohne eigene Bewertung, jüngste zuerst. */
export function getRatingQueue(list: Manga[], uid: string | undefined): Manga[] {
  if (!uid) return [];
  return list
    .filter(
      (m) =>
        (m.readStatus === 'completed' || m.readStatus === 'dropped') && !userMangaRating(m, uid)
    )
    .sort((a, b) => time(b.completedAt || b.lastReadAt) - time(a.completedAt || a.lastReadAt));
}

/** Hoch bewertete, abgeschlossene Manga, deren Abschluss am längsten her ist. */
export function getRereadPicks(list: Manga[], uid: string | undefined, minRating = 8): Manga[] {
  if (!uid) return [];
  return list
    .filter((m) => m.readStatus === 'completed' && userMangaRating(m, uid) >= minRating)
    .sort((a, b) => time(a.completedAt || a.lastReadAt) - time(b.completedAt || b.lastReadAt));
}

/** Häufigstes Genre der Sammlung; bei Gleichstand gewinnt das mit mehr Bewertungspunkten. */
export function getTopGenres(list: Manga[], uid: string | undefined, limit = 3): string[] {
  const score = new Map<string, number>();
  for (const manga of list) {
    if (manga.readStatus === 'dropped') continue;
    const weight = 1 + userMangaRating(manga, uid) / 10;
    for (const genre of manga.genres || []) {
      const name = genre?.trim();
      if (!name) continue;
      score.set(name, (score.get(name) || 0) + weight);
    }
  }
  return [...score.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([genre]) => genre);
}

export type CollectionSort = 'recent' | 'added' | 'title' | 'rating' | 'progress';

export interface CollectionFilter {
  query: string;
  status: string;
  format: string;
  sort: CollectionSort;
}

const matchesQuery = (manga: Manga, needle: string): boolean =>
  [manga.title, manga.titleEnglish, manga.titleRomaji].some(
    (value) => !!value && normalizeTitle(value).includes(needle)
  );

export function filterCollection(
  list: Manga[],
  filter: CollectionFilter,
  uid: string | undefined
): Manga[] {
  const needle = normalizeTitle(filter.query.trim());
  const filtered = list.filter(
    (m) =>
      (filter.status === 'all' || m.readStatus === filter.status) &&
      (filter.format === 'all' || (m.format || 'MANGA') === filter.format) &&
      (!needle || matchesQuery(m, needle))
  );

  const byTitle = (a: Manga, b: Manga) => a.title.localeCompare(b.title);
  switch (filter.sort) {
    case 'title':
      return filtered.sort(byTitle);
    case 'added':
      return filtered.sort((a, b) => time(b.addedAt) - time(a.addedAt) || byTitle(a, b));
    case 'rating':
      return filtered.sort(
        (a, b) => userMangaRating(b, uid) - userMangaRating(a, uid) || byTitle(a, b)
      );
    case 'progress':
      return filtered.sort(
        (a, b) => mangaProgressPercent(b) - mangaProgressPercent(a) || byTitle(a, b)
      );
    case 'recent':
    default:
      return filtered.sort(
        (a, b) => time(b.lastReadAt || b.addedAt) - time(a.lastReadAt || a.addedAt) || byTitle(a, b)
      );
  }
}
