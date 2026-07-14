// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../../types/Manga';

// firebase compat
const fb = vi.hoisted(() => {
  const updateMock = vi.fn((_u?: Record<string, unknown>) => Promise.resolve());
  const refMock = vi.fn((_p?: string) => ({ update: updateMock }));
  const database = () => ({ ref: refMock });
  return { updateMock, refMock, database };
});
vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));

// services
const svc = vi.hoisted(() => ({
  getMangaById: vi.fn(async () => null as unknown),
  getMangaDexInfo: vi.fn(async () => null as unknown),
  getMangaDexChapterDates: vi.fn(async () => null as unknown),
}));
vi.mock('../../../services/anilistService', () => ({ getMangaById: svc.getMangaById }));
vi.mock('../../../services/mangaUpdatesService', () => ({
  getMangaDexInfo: svc.getMangaDexInfo,
  getMangaDexChapterDates: svc.getMangaDexChapterDates,
}));

import { useMangaLiveData } from './useMangaLiveData';

type HookUser = Parameters<typeof useMangaLiveData>[0]['user'];
const user = { uid: 'u1' } as unknown as HookUser;

const makeManga = (o: Partial<Manga> = {}): Manga =>
  ({
    anilistId: 42,
    title: 'Berserk',
    status: 'FINISHED',
    ...o,
  }) as unknown as Manga;

beforeEach(() => {
  vi.clearAllMocks();
  svc.getMangaById.mockResolvedValue({ id: 42, title: { romaji: 'Berserk' } });
  svc.getMangaDexInfo.mockResolvedValue(null);
  svc.getMangaDexChapterDates.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
});

describe('useMangaLiveData', () => {
  it('loads AniList detail data by id', async () => {
    const { result } = renderHook(() =>
      useMangaLiveData({ user, anilistId: 42, manga: makeManga() })
    );
    await waitFor(() => expect(result.current.anilistData).not.toBeNull());
    expect(svc.getMangaById).toHaveBeenCalledWith(42);
  });

  it('does not fetch MangaDex live data for a finished title', async () => {
    renderHook(() =>
      useMangaLiveData({ user, anilistId: 42, manga: makeManga({ status: 'FINISHED' }) })
    );
    await Promise.resolve();
    expect(svc.getMangaDexInfo).not.toHaveBeenCalled();
    expect(svc.getMangaDexChapterDates).not.toHaveBeenCalled();
  });

  it('fetches MangaDex live data for RELEASING titles', async () => {
    svc.getMangaDexInfo.mockResolvedValue({ latestChapter: 7 });
    svc.getMangaDexChapterDates.mockResolvedValue({ recentChapters: [] });
    const { result } = renderHook(() =>
      useMangaLiveData({ user, anilistId: 42, manga: makeManga({ status: 'RELEASING' }) })
    );
    await waitFor(() => expect(result.current.mangadexInfo).not.toBeNull());
    expect(svc.getMangaDexInfo).toHaveBeenCalledWith('Berserk');
    expect(svc.getMangaDexChapterDates).toHaveBeenCalledWith('Berserk');
  });

  it('persists a newer latestChapterAvailable + lastReleaseDate back to Firebase', async () => {
    svc.getMangaDexInfo.mockResolvedValue({ latestChapter: 10 });
    svc.getMangaDexChapterDates.mockResolvedValue({
      recentChapters: [{ chapter: 10, publishedAt: '2026-02-01' }],
    });
    renderHook(() =>
      useMangaLiveData({
        user,
        anilistId: 42,
        manga: makeManga({
          status: 'RELEASING',
          latestChapterAvailable: 5,
          lastReleaseDate: '2025-01-01',
        }),
      })
    );

    await waitFor(() => expect(fb.updateMock).toHaveBeenCalled());
    const updates = fb.updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(updates.latestChapterAvailable).toBe(10);
    expect(updates.lastReleaseDate).toBe('2026-02-01');
    const paths = fb.refMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain('users/u1/manga/42');
  });

  it('does not persist when the live chapter is not newer than the stored value', async () => {
    svc.getMangaDexInfo.mockResolvedValue({ latestChapter: 3 });
    svc.getMangaDexChapterDates.mockResolvedValue({ recentChapters: [] });
    renderHook(() =>
      useMangaLiveData({
        user,
        anilistId: 42,
        manga: makeManga({
          status: 'RELEASING',
          latestChapterAvailable: 10,
          lastReleaseDate: '2026-01-01',
        }),
      })
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(fb.updateMock).not.toHaveBeenCalled();
  });

  it('skips AniList + live fetches when there is no anilistId', async () => {
    renderHook(() => useMangaLiveData({ user, anilistId: 0, manga: makeManga() }));
    await Promise.resolve();
    expect(svc.getMangaById).not.toHaveBeenCalled();
  });
});
