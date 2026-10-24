import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// backendFetch (MangaUpdates-Proxy) mocken.
const backendFetchMock = vi.hoisted(() => vi.fn());
const hasBackendSession = vi.hoisted(() => vi.fn(() => true));
vi.mock('./backendApi', () => ({ backendFetch: backendFetchMock, hasBackendSession }));

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
      expect.objectContaining({ method: 'POST' }),
      { quietStatuses: [502] }
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

describe('getMangaChaptersBatch', () => {
  it('schickt alle Titel in einer Anfrage und liefert die Einträge', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({ items: { berserk: { c: 120, d: '2026-10-01', at: 1 } } })
    );
    const { getMangaChaptersBatch } = await load();

    const items = await getMangaChaptersBatch(['Berserk', 'Vagabond']);

    expect(items).toEqual({ berserk: { c: 120, d: '2026-10-01', at: 1 } });
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
    expect(backendFetchMock).toHaveBeenCalledWith(
      '/mangaupdates/batch',
      expect.objectContaining({ body: JSON.stringify({ titles: ['Berserk', 'Vagabond'] }) })
    );
  });

  it('teilt sehr lange Listen in Pakete zu 200 Titeln', async () => {
    backendFetchMock.mockResolvedValue(res({ items: {} }));
    const { getMangaChaptersBatch } = await load();

    await getMangaChaptersBatch(Array.from({ length: 450 }, (_, i) => `Titel ${i}`));

    expect(backendFetchMock).toHaveBeenCalledTimes(3);
  });

  it('Fehler und non-ok Antworten ergeben ein leeres Ergebnis', async () => {
    backendFetchMock.mockResolvedValueOnce(res({}, false));
    const { getMangaChaptersBatch } = await load();
    expect(await getMangaChaptersBatch(['A'])).toEqual({});

    backendFetchMock.mockRejectedValueOnce(new Error('netz'));
    expect(await getMangaChaptersBatch(['B'])).toEqual({});
  });

  it('mangaChapterKey normalisiert wie das Backend', async () => {
    const { mangaChapterKey } = await load();
    expect(mangaChapterKey('  One Piece ')).toBe('one piece');
  });
});

describe('searchMangaUpdatesTitles', () => {
  it('liefert Haupt- und Fundtitel, dekodiert HTML-Entities und verwirft kaputte Einträge', async () => {
    backendFetchMock.mockResolvedValueOnce(
      res({
        hits: [
          {
            id: 7,
            title: 'Don&#039;t Look for Me',
            hitTitle: 'Suche nicht nach Mir',
            type: 'Manhwa',
            image: 'cover.jpg',
            year: '2021',
            genres: ['Drama'],
          },
          { title: 42, hitTitle: 'kaputt' },
          { title: 'Ohne Extras', hitTitle: 'Ohne Extras' },
        ],
      })
    );
    const { searchMangaUpdatesTitles } = await load();

    expect(await searchMangaUpdatesTitles('Suche nicht nach mir')).toEqual([
      {
        id: 7,
        title: "Don't Look for Me",
        hitTitle: 'Suche nicht nach Mir',
        type: 'Manhwa',
        image: 'cover.jpg',
        year: '2021',
        genres: ['Drama'],
      },
      {
        id: null,
        title: 'Ohne Extras',
        hitTitle: 'Ohne Extras',
        type: null,
        image: null,
        year: null,
        genres: [],
      },
    ]);
    expect(backendFetchMock).toHaveBeenCalledWith(
      '/mangaupdates/titles',
      expect.objectContaining({ body: JSON.stringify({ search: 'Suche nicht nach mir' }) }),
      { quietStatuses: [502] }
    );
  });

  it('cached je Suchbegriff', async () => {
    backendFetchMock.mockResolvedValue(res({ hits: [] }));
    const { searchMangaUpdatesTitles } = await load();
    await searchMangaUpdatesTitles('Biest');
    await searchMangaUpdatesTitles(' biest ');
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });

  it('Fehler → leere Liste', async () => {
    backendFetchMock.mockRejectedValueOnce(new Error('down'));
    const { searchMangaUpdatesTitles } = await load();
    expect(await searchMangaUpdatesTitles('X')).toEqual([]);
  });

  it('sucht auch ohne Anmeldung (Onboarding vor der Registrierung)', async () => {
    hasBackendSession.mockReturnValue(false);
    try {
      backendFetchMock.mockResolvedValueOnce(
        res({ hits: [{ id: 1, title: 'Solo Leveling', hitTitle: 'Solo Leveling' }] })
      );
      const { searchMangaUpdatesTitles } = await load();
      expect(await searchMangaUpdatesTitles('Solo Leveling')).toHaveLength(1);
    } finally {
      hasBackendSession.mockReturnValue(true);
    }
  });

  it('schickt Login-Routen ohne Anmeldung gar nicht erst ab und merkt sich nichts', async () => {
    hasBackendSession.mockReturnValueOnce(false);
    backendFetchMock.mockResolvedValue(res({ seriesId: 7, latestChapter: 3, completed: false }));
    const { getMangaDexInfo } = await load();
    expect((await getMangaDexInfo('Berserk')).mangadexId).toBeNull();
    expect(backendFetchMock).not.toHaveBeenCalled();
    expect((await getMangaDexInfo('Berserk')).mangadexId).toBe('7');
  });
});

describe('Last-Bremsen', () => {
  it('teilt gleichzeitige Aufrufe für denselben Titel auf eine Anfrage', async () => {
    backendFetchMock.mockResolvedValue(res({ seriesId: 1, releases: [] }));
    const { getMangaDexChapterDates } = await load();
    await Promise.all([getMangaDexChapterDates('Berserk'), getMangaDexChapterDates('berserk')]);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });

  it('pausiert nach 429 alle MangaUpdates-Abfragen statt sie zu wiederholen', async () => {
    backendFetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    const { getMangaDexInfo, getMangaDexChapterDates } = await load();
    expect((await getMangaDexInfo('A')).mangadexId).toBeNull();
    expect((await getMangaDexChapterDates('B')).recentChapters).toEqual([]);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
  });

  it('merkt sich „nicht gefunden“, aber keine Störung', async () => {
    backendFetchMock.mockResolvedValueOnce(res({ latestChapter: 5 }));
    backendFetchMock.mockRejectedValueOnce(new Error('netz'));
    backendFetchMock.mockResolvedValueOnce(res({ seriesId: 9, latestChapter: 3 }));
    const { getMangaDexInfo } = await load();
    await getMangaDexInfo('Unbekannt');
    await getMangaDexInfo('Unbekannt');
    await getMangaDexInfo('Wackel');
    expect((await getMangaDexInfo('Wackel')).mangadexId).toBe('9');
    expect(backendFetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('getMangaUpdatesSeries', () => {
  it('holt die Serie per ID und cached sie', async () => {
    backendFetchMock.mockResolvedValue(res({ id: 48132338279, title: 'Boyfriends.' }));
    const { getMangaUpdatesSeries } = await load();

    expect(await getMangaUpdatesSeries(48132338279)).toEqual({
      id: 48132338279,
      title: 'Boyfriends.',
    });
    await getMangaUpdatesSeries(48132338279);
    expect(backendFetchMock).toHaveBeenCalledTimes(1);
    expect(backendFetchMock).toHaveBeenCalledWith(
      '/mangaupdates/series',
      expect.objectContaining({ body: JSON.stringify({ id: 48132338279 }) }),
      { quietStatuses: [502] }
    );
  });

  it('wirft bei Fehlerstatus oder leerer Antwort', async () => {
    backendFetchMock.mockResolvedValueOnce(res({ error: 'not found' }, false));
    backendFetchMock.mockResolvedValueOnce(res({}));
    const { getMangaUpdatesSeries } = await load();

    await expect(getMangaUpdatesSeries(1)).rejects.toThrow();
    await expect(getMangaUpdatesSeries(2)).rejects.toThrow();
  });
});
