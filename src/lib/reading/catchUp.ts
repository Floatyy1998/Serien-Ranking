import { PAGES_PER_HOUR, remainingHours, remainingPages } from '../books/bookProgress';
import type { SeriesProgress } from '../books/bookSeries';
import { mangaStand } from '../manga/progress';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';

/** Grobe Lesezeit eines Manga-Kapitels — macht Kapitel und Seiten beim Sortieren vergleichbar. */
export const CHAPTER_MINUTES = 5;
/** Annahme für einen Band ohne bekannte Seitenzahl. */
export const DEFAULT_VOLUME_PAGES = 300;

export type CatchUpSort = 'open' | 'progress' | 'recent';

interface CatchUpBase {
  key: string;
  title: string;
  /** 0–100 */
  progress: number;
  /** Geschätzte offene Lesezeit in Minuten — Maß für „am meisten offen". */
  openMinutes: number;
  /** Letztes Lesen (ms), 0 = nie. */
  lastReadAt: number;
}

export type CatchUpEntry =
  | (CatchUpBase & { kind: 'manga'; manga: Manga; current: number; total: number; open: number })
  | (CatchUpBase & { kind: 'book'; book: Book; pagesLeft: number; hoursLeft: number })
  | (CatchUpBase & { kind: 'series'; series: SeriesProgress });

const ms = (date?: string): number => {
  const v = date ? new Date(date).getTime() : NaN;
  return Number.isFinite(v) ? v : 0;
};

const pagesToMinutes = (pages: number) => (pages / PAGES_PER_HOUR) * 60;

/** Manga mit offenen Kapiteln. */
export function mangaCatchUp(list: Manga[]): CatchUpEntry[] {
  const out: CatchUpEntry[] = [];
  for (const manga of list) {
    if (manga.readStatus !== 'reading') continue;
    const stand = mangaStand(manga);
    if (stand.unit !== 'chapter' || stand.total <= 0 || stand.remaining <= 0) continue;
    out.push({
      kind: 'manga',
      key: `m-${manga.anilistId}`,
      title: manga.title,
      manga,
      current: stand.current,
      total: stand.total,
      open: stand.remaining,
      progress: (stand.current / stand.total) * 100,
      openMinutes: stand.remaining * CHAPTER_MINUTES,
      lastReadAt: ms(manga.lastReadAt),
    });
  }
  return out;
}

/** Bücher, die gerade gelesen werden und noch Seiten offen haben. */
export function bookCatchUp(list: Book[]): CatchUpEntry[] {
  const out: CatchUpEntry[] = [];
  for (const book of list) {
    if (book.status !== 'reading') continue;
    const left = remainingPages(book);
    const hours = remainingHours(book);
    if (left === null || hours === null || left <= 0 || !book.pageCount) continue;
    out.push({
      kind: 'book',
      key: `b-${book.id}`,
      title: book.title,
      book,
      pagesLeft: left,
      hoursLeft: hours,
      progress: Math.min(100, ((book.currentPage || 0) / book.pageCount) * 100),
      openMinutes: pagesToMinutes(left),
      lastReadAt: ms(book.lastReadAt || book.startedAt),
    });
  }
  return out;
}

/** Buchreihen, deren nächster Band schon erschienen ist und noch fehlt. */
export function seriesCatchUp(list: SeriesProgress[]): CatchUpEntry[] {
  return list
    .filter((s) => s.next.state === 'available')
    .map((series) => {
      const pages = series.books.map((b) => b.pageCount || 0).filter((p) => p > 0);
      const avgPages = pages.length
        ? pages.reduce((s, p) => s + p, 0) / pages.length
        : DEFAULT_VOLUME_PAGES;
      const lastReadAt = Math.max(
        0,
        ...series.books.map((b) => ms(b.lastReadAt || b.completedAt || b.startedAt))
      );
      return {
        kind: 'series' as const,
        key: `s-${series.seriesId}`,
        title: series.next.part.title,
        series,
        progress: series.total > 0 ? (series.ownedCount / series.total) * 100 : 0,
        openMinutes: pagesToMinutes(avgPages),
        lastReadAt,
      };
    });
}

export function sortCatchUp(entries: CatchUpEntry[], sort: CatchUpSort): CatchUpEntry[] {
  const byTitle = (a: CatchUpEntry, b: CatchUpEntry) => a.title.localeCompare(b.title);
  const copy = [...entries];
  switch (sort) {
    case 'open':
      return copy.sort((a, b) => b.openMinutes - a.openMinutes || byTitle(a, b));
    case 'progress':
      return copy.sort((a, b) => a.progress - b.progress || byTitle(a, b));
    case 'recent':
      return copy.sort((a, b) => {
        if (!a.lastReadAt && !b.lastReadAt) return byTitle(a, b);
        if (!a.lastReadAt) return 1;
        if (!b.lastReadAt) return -1;
        return a.lastReadAt - b.lastReadAt || byTitle(a, b);
      });
    default:
      return copy;
  }
}

export interface CatchUpTotals {
  titles: number;
  chapters: number;
  pages: number;
  avgProgress: number;
}

export function catchUpTotals(entries: CatchUpEntry[]): CatchUpTotals {
  let chapters = 0;
  let pages = 0;
  let progress = 0;
  for (const e of entries) {
    if (e.kind === 'manga') chapters += e.open;
    if (e.kind === 'book') pages += e.pagesLeft;
    progress += e.progress;
  }
  return {
    titles: entries.length,
    chapters,
    pages,
    avgProgress: entries.length ? progress / entries.length : 0,
  };
}
