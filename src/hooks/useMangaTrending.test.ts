// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../types/Manga';
import type { DiscoverCategory } from '../services/anilistService';

const discoverManga =
  vi.fn<
    (
      category: DiscoverCategory,
      page?: number,
      perPage?: number
    ) => Promise<{ results: AniListMangaSearchResult[]; hasNextPage: boolean; total: number }>
  >();

vi.mock('../services/anilistService', () => ({
  discoverManga: (...a: Parameters<typeof discoverManga>) => discoverManga(...a),
}));

import { useMangaTrending, useMangaPopular, useMangaTopRated } from './useMangaTrending';

function mangaResult(overrides: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult {
  return {
    id: 1,
    title: { romaji: 'Naruto Romaji', english: 'Naruto', native: null },
    coverImage: { large: 'large.jpg', medium: 'medium.jpg' },
    bannerImage: null,
    description: null,
    chapters: null,
    volumes: null,
    status: 'FINISHED',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action', 'Adventure', 'Shounen'],
    averageScore: 85,
    startDate: { year: 1999, month: 9, day: 21 },
    isAdult: false,
    ...overrides,
  };
}

function resolveWith(results: AniListMangaSearchResult[]) {
  discoverManga.mockResolvedValue({ results, hasNextPage: false, total: results.length });
}

beforeEach(() => {
  discoverManga.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMangaTrending & siblings', () => {
  it('loads trending manga and maps AniList fields to carousel items', async () => {
    resolveWith([mangaResult()]);
    const { result } = renderHook(() => useMangaTrending());

    await waitFor(() => expect(result.current).toHaveLength(1));
    const item = result.current[0];
    expect(discoverManga).toHaveBeenCalledWith('trending', 1, 15);
    expect(item.id).toBe(1);
    expect(item.title).toBe('Naruto'); // english preferred
    expect(item.poster).toBe('large.jpg');
    expect(item.rating).toBeCloseTo(8.5); // averageScore / 10
    expect(item.year).toBe('1999');
    expect(item.genres).toBe('Action, Adventure'); // first 2
    expect(item.format).toBe('MANGA');
    expect(item.countryOfOrigin).toBe('JP');
  });

  it('falls back to romaji when english title is missing', async () => {
    resolveWith([
      mangaResult({ id: 2, title: { romaji: 'One Piece Romaji', english: null, native: null } }),
    ]);
    const { result } = renderHook(() => useMangaTrending());
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].title).toBe('One Piece Romaji');
  });

  it('leaves rating/year undefined when source fields are absent', async () => {
    resolveWith([
      mangaResult({ id: 3, averageScore: null, startDate: { year: null, month: null, day: null } }),
    ]);
    const { result } = renderHook(() => useMangaTrending());
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].rating).toBeUndefined();
    expect(result.current[0].year).toBeUndefined();
  });

  it('useMangaPopular requests the "popular" category', async () => {
    resolveWith([mangaResult({ id: 4 })]);
    const { result } = renderHook(() => useMangaPopular());
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(discoverManga).toHaveBeenCalledWith('popular', 1, 15);
  });

  it('useMangaTopRated requests the "top_rated" category', async () => {
    resolveWith([mangaResult({ id: 5 })]);
    const { result } = renderHook(() => useMangaTopRated());
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(discoverManga).toHaveBeenCalledWith('top_rated', 1, 15);
  });

  it('keeps an empty list and swallows a rejected discover call', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    discoverManga.mockRejectedValue(new Error('AniList down'));
    const { result } = renderHook(() => useMangaTrending());
    await Promise.resolve();
    await Promise.resolve();
    expect(result.current).toEqual([]);
  });
});
