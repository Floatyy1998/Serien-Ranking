import { describe, expect, it } from 'vitest';
import { chartFilters, chartMedia, interleaveStable, roundRobin } from './discoverCharts';

describe('discoverCharts', () => {
  it('nimmt Ranglisten reihum', () => {
    expect(roundRobin([['a1', 'a2', 'a3'], ['b1'], []])).toEqual(['a1', 'b1', 'a2', 'a3']);
    expect(roundRobin([])).toEqual([]);
  });

  it('mischt abwechselnd und hängt Reste erst an, wenn die andere Liste fertig ist', () => {
    expect(interleaveStable([1, 2, 3], ['x'], false, false)).toEqual([1, 'x']);
    expect(interleaveStable([1, 2, 3], ['x'], false, true)).toEqual([1, 'x', 2, 3]);
    expect(interleaveStable([1], ['x', 'y'], true, false)).toEqual([1, 'x', 'y']);
    expect(interleaveStable([], ['x', 'y'], true, false)).toEqual(['x', 'y']);
  });

  it('zeigt im Filter nur passende Medien', () => {
    const both = { books: true, manga: true };
    expect(chartMedia('all', both, false)).toEqual({ books: true, manga: true });
    expect(chartMedia('books', both, false)).toEqual({ books: true, manga: false });
    expect(chartMedia('KR', both, false)).toEqual({ books: false, manga: true });
    expect(chartMedia('all', both, true)).toEqual({ books: false, manga: true });
    expect(chartMedia('all', { books: true, manga: false }, false)).toEqual({
      books: true,
      manga: false,
    });
  });

  it('bietet Filter nur, wo es etwas zu wählen gibt', () => {
    expect(chartFilters({ books: true, manga: false }, false)).toEqual([]);
    expect(chartFilters({ books: false, manga: true }, false)).toEqual(['all', 'JP', 'KR', 'CN']);
    expect(chartFilters({ books: true, manga: true }, false)).toEqual([
      'all',
      'books',
      'JP',
      'KR',
      'CN',
    ]);
    expect(chartFilters({ books: true, manga: true }, true)).toEqual(['all', 'JP', 'KR', 'CN']);
  });
});
