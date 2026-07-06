// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EnhancedCacheResult } from '../hooks/firebaseCache/types';

const cacheResult = vi.hoisted(
  () =>
    ({
      data: {},
      loading: false,
      error: null,
      isStale: false,
      isOffline: false,
      lastUpdated: 0,
      refetch: vi.fn<() => Promise<void>>(async () => {}),
      clearCache: vi.fn<() => Promise<void>>(async () => {}),
    }) as EnhancedCacheResult<Record<string, unknown>>
);

vi.mock('../hooks/useEnhancedFirebaseCache', () => ({
  useEnhancedFirebaseCache: () => cacheResult,
}));

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({ set: async () => {}, update: async () => {} }),
    }),
  },
}));

vi.mock('../services/anilistService', () => ({
  getMangaById: vi.fn(async () => null),
}));
vi.mock('../services/mangaUpdatesService', () => ({
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
});
