import { describe, expect, it } from 'vitest';
import type { WrappedStats } from '../../types/Wrapped';
import { pickYearHighlights, yearFacts } from './yearHighlights';

const base = (over: Partial<WrappedStats> = {}): WrappedStats =>
  ({
    year: 2026,
    totalEpisodesWatched: 0,
    totalMoviesWatched: 0,
    totalMinutesWatched: 0,
    totalHoursWatched: 0,
    totalDaysEquivalent: 0,
    uniqueSeriesWatched: 0,
    topSeries: [],
    topMovies: [],
    topGenres: [],
    topProviders: [],
    longestStreak: 0,
    manga: null,
    books: null,
    ...over,
  }) as WrappedStats;

const series = (id: number) => ({
  id,
  title: `Serie ${id}`,
  episodesWatched: 10,
  minutesWatched: 1,
});
const movie = (id: number) => ({ id, title: `Film ${id}`, minutesWatched: 100 });
const manga = (ids: number[]) => ({
  totalChapters: 50,
  uniqueManga: ids.length,
  topManga: ids.map((anilistId) => ({ anilistId, title: `Manga ${anilistId}`, chapters: 5 })),
  mostReadMonth: 0,
  mostReadMonthChapters: 0,
});
const books = (ids: string[]) => ({
  booksFinished: ids.length,
  pagesRead: 900,
  topBooks: ids.map((id) => ({ id, title: `Buch ${id}` })),
  mostReadMonth: 0,
  mostReadMonthPages: 0,
});

describe('pickYearHighlights', () => {
  it('zeigt bei reinen Seriennutzern die drei besten Serien', () => {
    const picks = pickYearHighlights(
      base({ topSeries: [series(1), series(2), series(3), series(4)] })
    );
    expect(picks.map((p) => p.title)).toEqual(['Serie 1', 'Serie 2', 'Serie 3']);
  });

  it('füllt für reine Leser die Reihe mit Büchern', () => {
    const picks = pickYearHighlights(base({ books: books(['a', 'b', 'c', 'd']) }));
    expect(picks.map((p) => p.kind)).toEqual(['book', 'book', 'book']);
  });

  it('nimmt von jedem Medium den Spitzenreiter, wenn alle vier vorkommen', () => {
    const picks = pickYearHighlights(
      base({
        topSeries: [series(1), series(2)],
        topMovies: [movie(1)],
        manga: manga([7]),
        books: books(['a']),
      })
    );
    expect(picks.map((p) => p.kind)).toEqual(['series', 'movie', 'manga', 'book']);
  });

  it('füllt reihum auf, wenn zwei Medien nicht für drei Plätze reichen', () => {
    const picks = pickYearHighlights(base({ topMovies: [movie(1), movie(2)], manga: manga([7]) }));
    expect(picks.map((p) => p.title)).toEqual(['Film 1', 'Manga 7', 'Film 2']);
  });

  it('bleibt leer, wenn es nichts gibt', () => {
    expect(pickYearHighlights(base())).toEqual([]);
  });
});

describe('yearFacts', () => {
  it('lässt alles ohne Inhalt weg', () => {
    const facts = yearFacts(base({ books: books(['a', 'b']) }));
    expect(facts).toEqual([
      { key: 'books', value: 2 },
      { key: 'pages', value: 900 },
    ]);
  });

  it('zählt Manga in Bänden, wenn keine Kapitel erfasst sind', () => {
    const facts = yearFacts(
      base({
        totalHoursWatched: 12.4,
        totalEpisodesWatched: 30,
        uniqueSeriesWatched: 4,
        manga: { ...manga([1]), totalChapters: 0, totalVolumes: 6 },
      })
    );
    expect(facts.map((f) => f.key)).toEqual(['hours', 'episodes', 'series', 'mangaVolumes']);
    expect(facts[0].value).toBe(12);
  });
});
