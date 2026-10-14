// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
vi.mock('../services/api/mangaUpdatesService', () => ({
  getMangaDexInfo: vi.fn(async () => ({ latestChapter: 0 })),
  getMangaDexChapterDates: vi.fn(async () => ({ recentChapters: [] })),
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
});
