// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  folders: [] as { id: string; name: string; createdAt: number; items: Set<string> }[],
  series: [] as unknown[],
  movies: [] as unknown[],
}));

vi.mock('../../../hooks/rating/useRatingFolders', () => ({
  useRatingFolders: () => ({ folders: mocks.folders, loading: false }),
}));
vi.mock('../../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: mocks.series }),
}));
vi.mock('../../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: mocks.movies }),
}));

import { useRewatchListItems } from './useRewatchListItems';

beforeEach(() => {
  mocks.folders = [];
  mocks.series = [
    {
      id: 1,
      title: 'Dark',
      poster: { poster: '/dark.jpg' },
      rating: { Drama: 9 },
      genre: { genres: ['All', 'Drama', 'Mystery', 'Sci-Fi'] },
      first_air_date: '2017-12-01',
    },
    { id: 2, title: 'Severance', poster: { poster: '/sev.jpg' }, rating: {} },
  ];
  mocks.movies = [
    {
      id: 7,
      title: 'Heat',
      poster: { poster: '/heat.jpg' },
      rating: {},
      release_date: '1995-12-15',
    },
  ];
});

describe('useRewatchListItems', () => {
  it('is empty without a rewatch list', () => {
    mocks.folders = [{ id: 'a', name: 'Marvel', createdAt: 1, items: new Set(['s_1']) }];
    expect(renderHook(() => useRewatchListItems()).result.current).toEqual([]);
  });

  it('maps listed series and movies to carousel items, sorted by title', () => {
    mocks.folders = [
      { id: 'rewatch', name: 'Nochmal schauen', createdAt: 0, items: new Set(['m_7', 's_1']) },
    ];
    const items = renderHook(() => useRewatchListItems()).result.current;
    expect(items.map((i) => [i.type, i.id, i.title])).toEqual([
      ['series', 1, 'Dark'],
      ['movie', 7, 'Heat'],
    ]);
    expect(items[0]).toMatchObject({ rating: 9, genres: 'Drama, Mystery', year: '2017' });
    expect(items[0].poster).toContain('/dark.jpg');
    expect(items[1]).toMatchObject({ rating: undefined, year: '1995' });
  });
});
