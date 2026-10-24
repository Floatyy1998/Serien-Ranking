// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  countRemainingMarkable,
  noteBulkMarkUsed,
  resetBulkMarkNudge,
  shouldNudgeBulkMark,
} from './bulkMarkNudge';
import type { Series } from '../../types/Series';

const MIN = 60_000;

describe('shouldNudgeBulkMark', () => {
  beforeEach(() => {
    localStorage.clear();
    resetBulkMarkNudge();
  });

  const marks = (seriesId: number, seasonIndex: number, count: number, remaining = 20) =>
    Array.from({ length: count }, (_, i) =>
      shouldNudgeBulkMark(seriesId, seasonIndex, remaining - i, i * MIN)
    );

  it('meldet sich erst beim fünften Einzel-Haken derselben Staffel', () => {
    expect(marks(1, 0, 5)).toEqual([false, false, false, false, true]);
  });

  it('pro Staffel nur einmal je Sitzung', () => {
    expect(marks(1, 0, 7)).toEqual([false, false, false, false, true, false, false]);
  });

  it('Serien- oder Staffelwechsel und lange Pausen setzen die Serie zurück', () => {
    marks(1, 0, 4);
    expect(shouldNudgeBulkMark(1, 1, 10, 4 * MIN)).toBe(false);
    marks(2, 0, 4);
    expect(shouldNudgeBulkMark(2, 0, 10, 20 * MIN)).toBe(false);
  });

  it('kein Tipp, wenn kaum noch Folgen offen sind', () => {
    expect(marks(1, 0, 5, 5)).toEqual([false, false, false, false, false]);
  });

  it('nach einer Sammelaktion nie wieder', () => {
    noteBulkMarkUsed();
    expect(marks(3, 0, 6)).not.toContain(true);
  });
});

describe('countRemainingMarkable', () => {
  it('zählt ungesehene, veröffentlichte Folgen ohne die gerade markierte', () => {
    const season = {
      seasonNumber: 0,
      episodes: [
        { id: 1, watched: true, air_date: '2020-01-01' },
        { id: 2, watched: false, air_date: '2020-01-08' },
        { id: 3, watched: false, air_date: '2020-01-15' },
        { id: 4, watched: false, air_date: '2999-01-01' },
      ],
    } as unknown as Series['seasons'][number];
    expect(countRemainingMarkable(season)).toBe(2);
    expect(countRemainingMarkable(season, 2)).toBe(1);
  });
});
