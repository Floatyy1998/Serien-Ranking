import { describe, expect, it } from 'vitest';
import type { Manga } from '../../types/Manga';
import {
  filterCollection,
  getNewChapterEntries,
  getRatingQueue,
  getRereadPicks,
  getTopGenres,
  getUpNext,
  mangaProgressPercent,
} from './overview';

const NOW = new Date('2026-10-07T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86400000).toISOString();

const make = (over: Partial<Manga>): Manga => ({
  nmr: 1,
  anilistId: Math.floor(Math.random() * 1e6),
  title: 'Titel',
  poster: '',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

describe('getNewChapterEntries', () => {
  it('meldet frische Kapitel, die nach dem letzten Lesen erschienen sind', () => {
    const fresh = make({
      title: 'Frisch',
      currentChapter: 10,
      chapters: null,
      latestChapterAvailable: 12,
      lastReleaseDate: daysAgo(2),
      lastReadAt: daysAgo(5),
    });
    const entries = getNewChapterEntries([fresh], NOW);
    expect(entries).toHaveLength(1);
    expect(entries[0].unread).toBe(2);
  });

  it('ignoriert alte Releases, schon Gelesenes und geplante Manga', () => {
    const old = make({
      currentChapter: 1,
      latestChapterAvailable: 5,
      lastReleaseDate: daysAgo(60),
    });
    const readAfter = make({
      currentChapter: 1,
      latestChapterAvailable: 5,
      lastReleaseDate: daysAgo(3),
      lastReadAt: daysAgo(1),
    });
    const planned = make({
      readStatus: 'planned',
      currentChapter: 1,
      latestChapterAvailable: 5,
      lastReleaseDate: daysAgo(1),
    });
    const caughtUp = make({
      currentChapter: 5,
      latestChapterAvailable: 5,
      lastReleaseDate: daysAgo(1),
    });
    expect(getNewChapterEntries([old, readAfter, planned, caughtUp], NOW)).toEqual([]);
  });

  it('sortiert das jüngste Release nach vorn', () => {
    const a = make({ title: 'A', currentChapter: 1, chapters: 3, lastReleaseDate: daysAgo(9) });
    const b = make({ title: 'B', currentChapter: 1, chapters: 3, lastReleaseDate: daysAgo(1) });
    expect(getNewChapterEntries([a, b], NOW).map((e) => e.manga.title)).toEqual(['B', 'A']);
  });
});

describe('Listen für „Für dich"', () => {
  const uid = 'u1';
  const unrated = make({ title: 'Offen', readStatus: 'completed', completedAt: daysAgo(1) });
  const rated = make({ title: 'Liebling', readStatus: 'completed', rating: { u1: 9 } });
  const planned = make({ title: 'Plan', readStatus: 'planned', addedAt: daysAgo(1) });
  const plannedOld = make({ title: 'Alt', readStatus: 'planned', addedAt: daysAgo(30) });

  it('sammelt unbewertete Abschlüsse', () => {
    expect(getRatingQueue([unrated, rated], uid).map((m) => m.title)).toEqual(['Offen']);
    expect(getRatingQueue([unrated], undefined)).toEqual([]);
  });

  it('schlägt hoch bewertete Abschlüsse zum Wiederlesen vor', () => {
    expect(getRereadPicks([unrated, rated], uid).map((m) => m.title)).toEqual(['Liebling']);
  });

  it('listet Geplantes, neuestes zuerst', () => {
    expect(getUpNext([plannedOld, rated, planned]).map((m) => m.title)).toEqual(['Plan', 'Alt']);
  });
});

describe('getTopGenres', () => {
  it('gewichtet nach Häufigkeit und Bewertung, ohne abgebrochene', () => {
    const list = [
      make({ genres: ['Romance', 'Drama'] }),
      make({ genres: ['Romance'] }),
      make({ genres: ['Romance', 'Action'] }),
      make({ genres: ['Action'], rating: { u1: 4 } }),
      make({ genres: ['Horror', 'Horror'], readStatus: 'dropped' }),
    ];
    expect(getTopGenres(list, 'u1', 2)).toEqual(['Romance', 'Action']);
  });
});

describe('filterCollection', () => {
  const list = [
    make({
      title: 'Solo Leveling',
      titleRomaji: 'Na Honjaman Level Up',
      format: 'MANHWA',
      readStatus: 'completed',
      rating: { u1: 9 },
      currentChapter: 200,
      chapters: 200,
      addedAt: daysAgo(10),
    }),
    make({
      title: 'Berserk',
      format: 'MANGA',
      readStatus: 'reading',
      currentChapter: 10,
      chapters: 100,
      lastReadAt: daysAgo(1),
      addedAt: daysAgo(40),
    }),
    make({ title: 'Akira', format: 'MANGA', readStatus: 'planned', addedAt: daysAgo(2) }),
  ];
  const base = { query: '', status: 'all', format: 'all', sort: 'recent' as const };

  it('sucht über alle Titelvarianten, unabhängig von Schreibweise', () => {
    expect(filterCollection(list, { ...base, query: 'honjaman' }, 'u1')).toHaveLength(1);
    expect(filterCollection(list, { ...base, query: 'SOLO-lev' }, 'u1')).toHaveLength(1);
  });

  it('filtert nach Status und Format', () => {
    expect(filterCollection(list, { ...base, status: 'planned' }, 'u1')[0].title).toBe('Akira');
    expect(filterCollection(list, { ...base, format: 'MANHWA' }, 'u1')).toHaveLength(1);
  });

  it('sortiert nach den gewählten Kriterien', () => {
    const titles = (sort: 'recent' | 'added' | 'title' | 'rating' | 'progress') =>
      filterCollection(list, { ...base, sort }, 'u1').map((m) => m.title);
    expect(titles('title')).toEqual(['Akira', 'Berserk', 'Solo Leveling']);
    expect(titles('recent')[0]).toBe('Berserk');
    expect(titles('added')[0]).toBe('Akira');
    expect(titles('rating')[0]).toBe('Solo Leveling');
    expect(titles('progress')).toEqual(['Solo Leveling', 'Berserk', 'Akira']);
  });

  it('rechnet den Fortschritt gegen das höchste bekannte Kapitel', () => {
    expect(
      mangaProgressPercent(make({ currentChapter: 5, chapters: 2, latestChapterAvailable: 10 }))
    ).toBe(50);
  });
});
