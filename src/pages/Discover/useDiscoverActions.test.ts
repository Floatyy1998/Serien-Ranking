// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiscoverActions } from './useDiscoverActions';
import type { DiscoverItem } from './discoverItemHelpers';

// ── mocks ─────────────────────────────────────────────────────────────
const ctx = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: ctx.user }) }));

const trackSeriesAdded = vi.fn<(...a: unknown[]) => void>();
const trackMovieAdded = vi.fn<(...a: unknown[]) => void>();
vi.mock('../../services/firebase/analytics', () => ({
  trackSeriesAdded: (...a: unknown[]) => trackSeriesAdded(...a),
  trackMovieAdded: (...a: unknown[]) => trackMovieAdded(...a),
}));

const logSeriesAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
const logMovieAdded = vi.fn<(...a: unknown[]) => Promise<void>>(async () => {});
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logSeriesAdded: (...a: unknown[]) => logSeriesAdded(...a),
  logMovieAdded: (...a: unknown[]) => logMovieAdded(...a),
}));

const backendFetch = vi.fn<(...a: unknown[]) => Promise<{ ok: boolean }>>();
vi.mock('../../services/backendApi', () => ({
  backendFetch: (...a: unknown[]) => backendFetch(...a),
}));

const item = (o: Partial<DiscoverItem> & { id: number; type: 'series' | 'movie' }): DiscoverItem =>
  ({
    poster_path: '/p.jpg',
    vote_average: 8,
    inList: false,
    title: 'Title',
    name: 'Name',
    ...o,
  }) as DiscoverItem;

function setup() {
  const setResults = vi.fn<React.Dispatch<React.SetStateAction<DiscoverItem[]>>>();
  const setSearchResults = vi.fn<React.Dispatch<React.SetStateAction<DiscoverItem[]>>>();
  const setRecommendations = vi.fn<React.Dispatch<React.SetStateAction<DiscoverItem[]>>>();
  const { result } = renderHook(() =>
    useDiscoverActions(setResults, setSearchResults, setRecommendations)
  );
  return { result, setResults, setSearchResults, setRecommendations };
}

describe('useDiscoverActions', () => {
  beforeEach(() => {
    ctx.user = { uid: 'u1' };
    vi.useFakeTimers();
    vi.stubEnv('VITE_USER', 'flo');
    backendFetch.mockReset().mockResolvedValue({ ok: true });
    trackSeriesAdded.mockReset();
    trackMovieAdded.mockReset();
    logSeriesAdded.mockClear();
    logMovieAdded.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    cleanup();
  });

  it('warns via dialog and skips the backend when no user is signed in', async () => {
    ctx.user = null;
    const { result } = setup();
    await act(async () => {
      await result.current.addToList(item({ id: 1, type: 'series' }));
    });
    expect(result.current.dialog.open).toBe(true);
    expect(result.current.dialog.type).toBe('warning');
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it('adds a series: /add, tracking, logger, snackbar, removal, clears addingItem', async () => {
    const { result, setResults, setSearchResults, setRecommendations } = setup();
    await act(async () => {
      await result.current.addToList(item({ id: 42, type: 'series', name: 'Serie' }));
    });
    expect(backendFetch).toHaveBeenCalledWith('/add', expect.objectContaining({ method: 'POST' }));
    expect(trackSeriesAdded).toHaveBeenCalledWith('42', 'Title', 'discover');
    expect(logSeriesAdded).toHaveBeenCalled();
    expect(result.current.snackbar.open).toBe(true);
    expect(result.current.snackbar.message).toContain('Title');
    // removeFromResults filters all three collections
    expect(setResults).toHaveBeenCalled();
    expect(setSearchResults).toHaveBeenCalled();
    expect(setRecommendations).toHaveBeenCalled();
    expect(result.current.addingItem).toBeNull();
  });

  it('routes movies to /addMovie and the movie logger', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addToList(item({ id: 7, type: 'movie', title: 'Film' }));
    });
    expect(backendFetch).toHaveBeenCalledWith(
      '/addMovie',
      expect.objectContaining({ method: 'POST' })
    );
    expect(trackMovieAdded).toHaveBeenCalledWith('7', 'Film', 'discover');
    expect(logMovieAdded).toHaveBeenCalled();
  });

  it('does not remove or notify when the backend responds not-ok', async () => {
    backendFetch.mockResolvedValue({ ok: false });
    const { result, setResults } = setup();
    await act(async () => {
      await result.current.addToList(item({ id: 5, type: 'series' }));
    });
    expect(setResults).not.toHaveBeenCalled();
    expect(result.current.snackbar.open).toBe(false);
    expect(result.current.addingItem).toBeNull();
  });

  it('swallows backend errors and clears addingItem', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    backendFetch.mockRejectedValue(new Error('network'));
    const { result } = setup();
    await act(async () => {
      await result.current.addToList(item({ id: 9, type: 'series' }));
    });
    expect(result.current.addingItem).toBeNull();
    expect(result.current.snackbar.open).toBe(false);
  });

  it('stops event propagation when invoked from a card click', async () => {
    const { result } = setup();
    const stopPropagation = vi.fn();
    await act(async () => {
      await result.current.addToList(item({ id: 3, type: 'series' }), {
        stopPropagation,
      } as unknown as React.MouseEvent);
    });
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('auto-closes the snackbar after 3 s', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.addToList(item({ id: 11, type: 'series' }));
    });
    expect(result.current.snackbar.open).toBe(true);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.snackbar.open).toBe(false);
  });

  it('removeFromResults filters the matching id from every collection', () => {
    const { result, setResults, setSearchResults, setRecommendations } = setup();
    act(() => result.current.removeFromResults(99));
    const applied = (
      setResults.mock.calls[0][0] as unknown as (p: DiscoverItem[]) => DiscoverItem[]
    )([item({ id: 99, type: 'series' }), item({ id: 1, type: 'series' })]);
    expect(applied.map((r) => r.id)).toEqual([1]);
    expect(setSearchResults).toHaveBeenCalled();
    expect(setRecommendations).toHaveBeenCalled();
  });
});
