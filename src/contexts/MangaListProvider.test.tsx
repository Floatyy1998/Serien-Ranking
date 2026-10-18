// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/data/firebaseCache/types';

const cacheResult = vi.hoisted(
  () =>
    ({
      data: {},
      loading: false,
      isSyncing: false,
      error: null,
      isStale: false,
      isOffline: false,
      lastUpdated: 0,
      refetch: vi.fn<() => Promise<void>>(async () => {}),
      clearCache: vi.fn<() => Promise<void>>(async () => {}),
    }) as EnhancedCacheResult<Record<string, unknown>>
);

vi.mock('../hooks/data/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => cacheResult,
}));

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({ set: async () => {}, update: async () => {} }),
    }),
  },
}));

const getMangaDetails = vi.hoisted(() => vi.fn(async (): Promise<unknown> => null));
vi.mock('../services/api/mangaDetails', () => ({ getMangaDetails }));

const updateIfExists = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('../services/db/ref', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  updateIfExists,
}));
const getMangaChaptersBatch = vi.hoisted(() =>
  vi.fn(async (_titles: string[]): Promise<Record<string, unknown>> => ({}))
);
vi.mock('../services/api/mangaUpdatesService', () => ({
  getMangaChaptersBatch,
  mangaChapterKey: (title: string) => title.toLowerCase().trim(),
}));

import { MangaListProvider } from './MangaListProvider';
import { useMangaList } from './MangaListContext';

const Consumer = () => {
  const { mangaList, loading } = useMangaList();
  return <div data-testid="manga">{`${mangaList.length}|${String(loading)}`}</div>;
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  cacheResult.data = {};
});

describe('MangaListProvider', () => {
  it('mounts, exposes the manga context and renders children', () => {
    render(
      <MangaListProvider>
        <Consumer />
      </MangaListProvider>
    );
    expect(screen.getByTestId('manga').textContent).toBe('0|false');
  });

  it('speichert beim täglichen Refresh den Anzeige-Formatschlüssel statt AniLists MANGA', async () => {
    vi.useFakeTimers();
    localStorage.clear();
    cacheResult.data = {
      1: {
        nmr: 1,
        anilistId: 1,
        title: 'Solo',
        poster: 'p.jpg',
        format: 'MANGA',
        countryOfOrigin: 'KR',
        status: 'FINISHED',
        chapters: 10,
        rating: {},
        currentChapter: 0,
        readStatus: 'planned',
      },
    };
    getMangaDetails.mockResolvedValue({
      format: 'MANGA',
      countryOfOrigin: 'KR',
      status: 'FINISHED',
      chapters: 10,
      genres: [],
    });

    render(
      <MangaListProvider>
        <Consumer />
      </MangaListProvider>
    );
    await vi.advanceTimersByTimeAsync(10);

    expect(getMangaDetails).toHaveBeenCalledWith(1);
    expect(updateIfExists).toHaveBeenCalledWith('users/u1/manga/1', { format: 'MANHWA' });
  });

  describe('Kapitel-Refresh über das Backend', () => {
    const releasing = (id: number, title: string) => ({
      nmr: id,
      anilistId: id,
      title,
      poster: 'p.jpg',
      format: 'MANGA',
      status: 'RELEASING',
      chapters: 10,
      rating: {},
      currentChapter: 3,
      readStatus: 'reading',
    });

    const renderProvider = () =>
      render(
        <MangaListProvider>
          <Consumer />
        </MangaListProvider>
      );

    beforeEach(() => {
      sessionStorage.clear();
      localStorage.setItem('mangaAniListRefreshLastRun:u1', String(Date.now()));
      getMangaChaptersBatch.mockClear();
      updateIfExists.mockClear();
    });

    it('holt alle laufenden Manga mit EINER Anfrage und speichert Kapitel + Release-Datum', async () => {
      vi.useFakeTimers();
      cacheResult.data = {
        1: releasing(1, 'Berserk'),
        2: releasing(2, 'Vagabond'),
        3: { ...releasing(3, 'Fertig'), status: 'FINISHED' },
      };
      getMangaChaptersBatch.mockResolvedValueOnce({
        berserk: { c: 120, d: '2026-10-01', at: 1 },
        vagabond: { c: null, d: null, at: 1 },
      });

      renderProvider();
      await vi.advanceTimersByTimeAsync(10);

      expect(getMangaChaptersBatch).toHaveBeenCalledTimes(1);
      expect(getMangaChaptersBatch).toHaveBeenCalledWith(['Berserk', 'Vagabond']);
      expect(updateIfExists).toHaveBeenCalledTimes(1);
      expect(updateIfExists).toHaveBeenCalledWith('users/u1/manga/1', {
        latestChapterAvailable: 120,
        lastReleaseDate: '2026-10-01',
      });
    });

    it('fragt dem Backend unbekannte Titel einmal nach kurzer Zeit erneut ab', async () => {
      vi.useFakeTimers();
      cacheResult.data = { 1: releasing(1, 'Neu') };
      getMangaChaptersBatch.mockResolvedValueOnce({}).mockResolvedValueOnce({
        neu: { c: 7, d: null, at: 1 },
      });

      renderProvider();
      await vi.advanceTimersByTimeAsync(10);
      expect(getMangaChaptersBatch).toHaveBeenCalledTimes(1);
      expect(updateIfExists).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(91_000);
      expect(getMangaChaptersBatch).toHaveBeenCalledTimes(2);
      expect(getMangaChaptersBatch).toHaveBeenLastCalledWith(['Neu']);
      expect(updateIfExists).toHaveBeenCalledWith('users/u1/manga/1', {
        latestChapterAvailable: 7,
      });
    });
  });
});
