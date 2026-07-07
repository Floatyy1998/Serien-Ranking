import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// backendFetch (MangaUpdates-Proxy) mocken.
const backendFetchMock = vi.hoisted(() => vi.fn());
vi.mock('../services/backendApi', () => ({ backendFetch: backendFetchMock }));

// Frisches Modul je Test → In-Memory-Caches leer.
async function load() {
  return import('./mangaUpdatesService');
}

function res(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body };
}

beforeEach(() => {
  vi.resetModules();
  backendFetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
describe('getMangaDexInfo', () => {
  it('mappt Suchergebnis auf MangaDexInfo (completed → status)', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({ seriesId: 12345, latestChapter: 200, completed: true })
    );
    const { getMangaDexInfo } = await load();

    const info = await getMangaDexInfo('Berserk');

    expect(info).toEqual({
      mangadexId: '12345',
      latestChapter: 200,
      totalChapters: 200,
      status: 'completed',
    });
    expect(backendFetchMock).toHaveBeenCalledWith(
      '/mangaupdates/search',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('nicht completed → ongoing; totalChapters fällt bei fehlendem latestChapter auf 0', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({ seriesId: 1, latestChapter: 0, completed: false })
    );
    const { getMangaDexInfo } = await load();
    const info = await getMangaDexInfo('Ongoing');
    expect(info.status).toBe('ongoing');
    expect(info.totalChapters).toBe(0);
  });

  it('Response non-ok → nullResult', async () => {
    backendFetchMock.mockResolvedValueOnce(res({}, false));
    const { getMangaDexInfo } = await load();
    expect(await getMangaDexInfo('X')).toEqual({
      mangadexId: null,
      latestChapter: null,
      totalChapters: 0,
      status: null,
    });
  });

  it('kein seriesId → nullResult', async () => {
    backendFetchMock.mockResolvedValueOnce(res({ latestChapter: 5 }));
    const { getMangaDexInfo } = await load();
    expect((await getMangaDexInfo('X')).mangadexId).toBeNull();
  });

  it('backendFetch wirft → nullResult', async () => {
    backendFetchMock.mockRejectedValueOnce(new Error('down'));
    const { getMangaDexInfo } = await load();
    expect((await getMangaDexInfo('X')).mangadexId).toBeNull();
  });

  it('cached: zweiter Aufruf mit gleichem Titel → nur ein backendFetch', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({ seriesId: 1, latestChapter: 10, completed: false })
    );
    const { getMangaDexInfo } = await load();
    await getMangaDexInfo('Naruto');
    await getMangaDexInfo('  NARUTO '); // Key wird lowercased + getrimmt
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
describe('getMangaDexChapterDates', () => {
  it('mappt Releases, filtert Renumbering-Anomalien und schätzt nächstes Datum', async () => {
    // neueste zuerst (wie API): 100 (02-10), 2 (Comeback-Anomalie), 99 (02-03).
    // Chronologisch (alt→neu) gelesen fällt Chapter 2 raus, weil < bisheriges Max.
    backendFetchMock.mockResolvedValueOnce(
      res({
        seriesId: 777,
        releases: [
          { chapter: 100, date: '2026-02-10' },
          { chapter: 2, date: '2026-02-08' },
          { chapter: 99, date: '2026-02-03' },
        ],
      })
    );
    const { getMangaDexChapterDates } = await load();

    const info = await getMangaDexChapterDates('Vagabond');

    // Anomalie (chapter 2 nach 100/99) rausgefiltert
    expect(info.recentChapters.map((c) => c.chapter)).toEqual([100, 99]);
    expect(info.mangadexId).toBe('777');
    // Gap 100↔99 = 7 Tage
    expect(info.avgDaysBetweenReleases).toBe(7);
    // 2026-02-10 + 7 Tage
    expect(info.estimatedNextDate).toBe('2026-02-17');
  });

  it('weniger als 2 gültige Chapter → keine Schätzung', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({ seriesId: 1, releases: [{ chapter: 5, date: '2026-01-01' }] })
    );
    const { getMangaDexChapterDates } = await load();
    const info = await getMangaDexChapterDates('Solo');
    expect(info.recentChapters).toHaveLength(1);
    expect(info.avgDaysBetweenReleases).toBeNull();
    expect(info.estimatedNextDate).toBeNull();
  });

  it('Gaps außerhalb (0,60)-Fenster werden ignoriert → avg null', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({
        releases: [
          { chapter: 20, date: '2026-06-01' },
          { chapter: 19, date: '2026-01-01' }, // >60 Tage Abstand
        ],
      })
    );
    const { getMangaDexChapterDates } = await load();
    const info = await getMangaDexChapterDates('SlowManga');
    expect(info.avgDaysBetweenReleases).toBeNull();
    expect(info.mangadexId).toBeNull(); // kein seriesId geliefert
  });

  it('begrenzt recentChapters auf 5', async () => {
    const releases = Array.from({ length: 8 }, (_, i) => ({
      chapter: 100 - i,
      date: `2026-03-${String(20 - i).padStart(2, '0')}`,
    }));
    backendFetchMock.mockResolvedValueOnce(res({ seriesId: 1, releases }));
    const { getMangaDexChapterDates } = await load();
    const info = await getMangaDexChapterDates('LongList');
    expect(info.recentChapters).toHaveLength(5);
  });

  it('Response non-ok → nullChapterResult', async () => {
    backendFetchMock.mockResolvedValueOnce(res({}, false));
    const { getMangaDexChapterDates } = await load();
    expect(await getMangaDexChapterDates('X')).toEqual({
      mangadexId: null,
      recentChapters: [],
      estimatedNextDate: null,
      avgDaysBetweenReleases: null,
    });
  });

  it('fehlendes releases-Array → leere recentChapters', async () => {
    backendFetchMock.mockResolvedValueOnce(res({ seriesId: 2 }));
    const { getMangaDexChapterDates } = await load();
    const info = await getMangaDexChapterDates('Empty');
    expect(info.recentChapters).toEqual([]);
  });

  it('backendFetch wirft → nullChapterResult', async () => {
    backendFetchMock.mockRejectedValueOnce(new Error('down'));
    const { getMangaDexChapterDates } = await load();
    expect((await getMangaDexChapterDates('X')).recentChapters).toEqual([]);
  });

  it('cached: zweiter Aufruf → nur ein backendFetch', async () => {
    backendFetchMock.mockResolvedValueOnce(res({ seriesId: 1, releases: [] }));
    const { getMangaDexChapterDates } = await load();
    await getMangaDexChapterDates('OnePiece');
    await getMangaDexChapterDates('onepiece');
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });
});
