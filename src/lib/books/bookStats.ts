import type { Book } from '../../types/Book';
import { eventPages, pagesByDay, readingStreak, type CompactBookEvent } from './bookEvents';
import { isFinishedInYear } from './bookProgress';

export interface RankedName {
  name: string;
  count: number;
}

export interface BookYearStats {
  year: number;
  booksFinished: number;
  pagesRead: number;
  pagesPerDay: number;
  activeDays: number;
  streak: number;
  longestBook?: { id: string; title: string; pages: number };
  topAuthors: RankedName[];
  topCategories: RankedName[];
  finishedByMonth: number[];
  pagesByMonth: number[];
  avgRating: number | null;
  ratedCount: number;
  finishedBooks: Book[];
}

const rank = (counts: Map<string, number>, limit: number): RankedName[] =>
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

/** Seiten aus Events, wo es welche gibt; sonst zählt ein im Jahr beendetes Buch mit seiner Seitenzahl. */
export function computeBookYearStats(
  books: Book[],
  events: CompactBookEvent[],
  year: number,
  now: number
): BookYearStats {
  const yearEvents = events.filter((e) => new Date(e.ts * 1000).getFullYear() === year);
  const pagesByMonth = new Array(12).fill(0) as number[];
  const pagesPerBook = new Map<string, number>();
  for (const e of yearEvents) {
    const n = eventPages(e);
    if (!n) continue;
    pagesByMonth[new Date(e.ts * 1000).getMonth()] += n;
    pagesPerBook.set(e.s, (pagesPerBook.get(e.s) ?? 0) + n);
  }

  const finishedBooks = books
    .filter((b) => isFinishedInYear(b, year))
    .sort(
      (a, b) =>
        new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime()
    );
  const finishedByMonth = new Array(12).fill(0) as number[];
  for (const b of finishedBooks) {
    const month = new Date(b.completedAt as string).getMonth();
    finishedByMonth[month] += 1;
    if (!pagesPerBook.has(b.id) && b.pageCount) {
      pagesPerBook.set(b.id, b.pageCount);
      pagesByMonth[month] += b.pageCount;
    }
  }
  const pagesRead = [...pagesPerBook.values()].reduce((sum, n) => sum + n, 0);

  const authors = new Map<string, number>();
  const categories = new Map<string, number>();
  let longest: BookYearStats['longestBook'];
  let ratingSum = 0;
  let ratedCount = 0;
  for (const b of finishedBooks) {
    const author = b.authors?.[0];
    if (author) authors.set(author, (authors.get(author) ?? 0) + 1);
    for (const c of b.categories ?? []) categories.set(c, (categories.get(c) ?? 0) + 1);
    if (b.pageCount && (!longest || b.pageCount > longest.pages)) {
      longest = { id: b.id, title: b.title, pages: b.pageCount };
    }
    if (b.rating && b.rating > 0) {
      ratingSum += b.rating;
      ratedCount += 1;
    }
  }

  const isCurrentYear = new Date(now).getFullYear() === year;
  const start = new Date(year, 0, 1).getTime();
  const end = isCurrentYear ? now : new Date(year + 1, 0, 1).getTime();
  const daysElapsed = Math.max(1, Math.ceil((end - start) / 86_400_000));

  return {
    year,
    booksFinished: finishedBooks.length,
    pagesRead,
    pagesPerDay: Math.round((pagesRead / daysElapsed) * 10) / 10,
    activeDays: pagesByDay(yearEvents).size,
    streak: isCurrentYear ? readingStreak(events, now) : 0,
    longestBook: longest,
    topAuthors: rank(authors, 5),
    topCategories: rank(categories, 5),
    finishedByMonth,
    pagesByMonth,
    avgRating: ratedCount ? Math.round((ratingSum / ratedCount) * 10) / 10 : null,
    ratedCount,
    finishedBooks,
  };
}

/** Wie viele Bücher bis heute gelesen sein müssten, um das Jahresziel zu schaffen. */
export function goalPace(goal: number, finished: number, now: number) {
  const date = new Date(now);
  const start = new Date(date.getFullYear(), 0, 1).getTime();
  const end = new Date(date.getFullYear() + 1, 0, 1).getTime();
  const expected = Math.floor((goal * (now - start)) / (end - start));
  return {
    expected,
    diff: finished - expected,
    percent: goal > 0 ? Math.min(100, Math.round((finished / goal) * 100)) : 0,
    done: goal > 0 && finished >= goal,
  };
}
