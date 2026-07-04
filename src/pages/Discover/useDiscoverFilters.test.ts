// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiscoverFilters } from './useDiscoverFilters';
import { genreIdMapForMovies, genreIdMapForSeries } from '../../config/menuItems';
import type { DiscoverItem } from './discoverItemHelpers';

const navSpy = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navSpy }));

const device = vi.hoisted(() => ({ isDesktop: true }));
vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isDesktop: device.isDesktop, isMobile: !device.isDesktop }),
}));

describe('useDiscoverFilters', () => {
  beforeEach(() => {
    navSpy.mockReset();
    sessionStorage.clear();
    device.isDesktop = true;
  });
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('starts with sensible defaults', () => {
    const { result } = renderHook(() => useDiscoverFilters());
    expect(result.current.activeTab).toBe('series');
    expect(result.current.activeCategory).toBe('trending');
    expect(result.current.selectedGenre).toBeNull();
    expect(result.current.showFilters).toBe(false);
    expect(result.current.showSearch).toBe(false);
    expect(result.current.isRestoring).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.genres).toBe(genreIdMapForSeries);
  });

  it('swaps the genre vocabulary when the tab changes to movies', () => {
    const { result } = renderHook(() => useDiscoverFilters());
    act(() => result.current.setActiveTab('movies'));
    expect(result.current.activeTab).toBe('movies');
    expect(result.current.genres).toBe(genreIdMapForMovies);
  });

  it('updates category, genre and search setters', () => {
    const { result } = renderHook(() => useDiscoverFilters());
    act(() => {
      result.current.setActiveCategory('top_rated');
      result.current.setSelectedGenre(28);
      result.current.setSearchQuery('dune');
      result.current.setShowSearch(true);
    });
    expect(result.current.activeCategory).toBe('top_rated');
    expect(result.current.selectedGenre).toBe(28);
    expect(result.current.searchQuery).toBe('dune');
    expect(result.current.showSearch).toBe(true);
  });

  it('persists filter state and navigates on item click (series)', () => {
    const { result } = renderHook(() => useDiscoverFilters());
    act(() => {
      result.current.setActiveTab('movies');
      result.current.setSelectedGenre(12);
    });
    const seriesItem = { id: 55, type: 'series' } as DiscoverItem;
    act(() => result.current.handleItemClick(seriesItem));

    expect(sessionStorage.getItem('comingFromDetail')).toBe('true');
    const saved = JSON.parse(sessionStorage.getItem('discoverFilters') || '{}');
    expect(saved.activeTab).toBe('movies');
    expect(saved.selectedGenre).toBe(12);
    expect(navSpy).toHaveBeenCalledWith('/series/55');
  });

  it('navigates to the movie route for movie items', () => {
    const { result } = renderHook(() => useDiscoverFilters());
    act(() => result.current.handleItemClick({ id: 77, type: 'movie' } as DiscoverItem));
    expect(navSpy).toHaveBeenCalledWith('/movie/77');
  });

  it('restores saved filter state when coming back from a detail page', () => {
    vi.useFakeTimers();
    sessionStorage.setItem('comingFromDetail', 'true');
    sessionStorage.setItem(
      'discoverFilters',
      JSON.stringify({
        activeTab: 'movies',
        activeCategory: 'popular',
        selectedGenre: 35,
        showFilters: true,
        searchQuery: '',
        showSearch: false,
      })
    );

    const { result } = renderHook(() => useDiscoverFilters());
    const restoreSpy = vi.fn();
    result.current.fetchFromTMDBOnRestoreRef.current = restoreSpy;

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.activeTab).toBe('movies');
    expect(result.current.activeCategory).toBe('popular');
    expect(result.current.selectedGenre).toBe(35);
    expect(result.current.showFilters).toBe(true);
    expect(result.current.isRestoring).toBe(false);
    expect(restoreSpy).toHaveBeenCalled();
    // one-shot keys consumed
    expect(sessionStorage.getItem('comingFromDetail')).toBeNull();
    expect(sessionStorage.getItem('discoverFilters')).toBeNull();
    vi.useRealTimers();
  });

  it('invokes the recommendations restore ref when the saved category is recommendations', () => {
    vi.useFakeTimers();
    sessionStorage.setItem('comingFromDetail', 'true');
    sessionStorage.setItem(
      'discoverFilters',
      JSON.stringify({ activeCategory: 'recommendations', showSearch: false })
    );
    const { result } = renderHook(() => useDiscoverFilters());
    const recSpy = vi.fn();
    const tmdbSpy = vi.fn();
    result.current.fetchRecommendationsOnRestoreRef.current = recSpy;
    result.current.fetchFromTMDBOnRestoreRef.current = tmdbSpy;
    act(() => {
      vi.runAllTimers();
    });
    expect(recSpy).toHaveBeenCalled();
    expect(tmdbSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
