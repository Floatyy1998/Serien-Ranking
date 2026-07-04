// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../types/Manga';

const ctx = vi.hoisted(() => ({ mangaList: [] as Manga[] }));

vi.mock('../contexts/MangaListContext', () => ({
  useMangaList: () => ({ mangaList: ctx.mangaList }),
}));

import { useContinueReading } from './useContinueReading';

const manga = (o: Partial<Manga> & { anilistId: number }): Manga =>
  ({
    title: `M${o.anilistId}`,
    poster: '',
    rating: {},
    currentChapter: 0,
    readStatus: 'reading',
    ...o,
  }) as Manga;

const run = (list: Manga[]) => {
  ctx.mangaList = list;
  return renderHook(() => useContinueReading()).result.current;
};

describe('useContinueReading', () => {
  afterEach(() => {
    ctx.mangaList = [];
  });

  it('gibt eine leere Liste bei leerem Input zurück', () => {
    expect(run([])).toEqual([]);
  });

  it('behält nur laufende Manga mit currentChapter > 0', () => {
    const list = [
      manga({ anilistId: 1, readStatus: 'reading', currentChapter: 3 }),
      manga({ anilistId: 2, readStatus: 'planned', currentChapter: 5 }),
      manga({ anilistId: 3, readStatus: 'reading', currentChapter: 0 }),
      manga({ anilistId: 4, readStatus: 'completed', currentChapter: 9 }),
    ];
    const result = run(list);
    expect(result.map((r) => r.anilistId)).toEqual([1]);
  });

  it('berechnet Fortschritt aus effektiver Kapitelzahl (max chapters/latestChapterAvailable)', () => {
    const list = [
      manga({
        anilistId: 10,
        currentChapter: 5,
        chapters: 10,
        latestChapterAvailable: 8,
      }),
    ];
    const [item] = run(list);
    expect(item.totalChapters).toBe(10);
    expect(item.progress).toBe(50);
  });

  it('setzt Fortschritt auf 0 und totalChapters null ohne bekannte Gesamtzahl', () => {
    const list = [manga({ anilistId: 11, currentChapter: 4, chapters: null })];
    const [item] = run(list);
    expect(item.totalChapters).toBeNull();
    expect(item.progress).toBe(0);
  });

  it('deckelt den Fortschritt bei 100 %', () => {
    const list = [manga({ anilistId: 12, currentChapter: 99, chapters: 10 })];
    const [item] = run(list);
    expect(item.progress).toBe(100);
  });

  it('sortiert nach lastReadAt absteigend, Einträge ohne Datum zuletzt', () => {
    const list = [
      manga({ anilistId: 1, currentChapter: 1, lastReadAt: '2026-01-01T00:00:00Z' }),
      manga({ anilistId: 2, currentChapter: 1, lastReadAt: '2026-05-01T00:00:00Z' }),
      manga({ anilistId: 3, currentChapter: 1 }), // kein lastReadAt/addedAt
    ];
    const result = run(list);
    expect(result.map((r) => r.anilistId)).toEqual([2, 1, 3]);
  });

  it('begrenzt auf 10 Einträge', () => {
    const list: Manga[] = [];
    for (let i = 0; i < 13; i++) {
      list.push(manga({ anilistId: i, currentChapter: 1 }));
    }
    expect(run(list)).toHaveLength(10);
  });
});
