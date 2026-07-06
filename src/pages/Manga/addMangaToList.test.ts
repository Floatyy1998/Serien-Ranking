import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../../types/Manga';
import type { MangaDexInfo } from '../../services/mangaUpdatesService';

// Firebase-Set einfangen (letzter Aufruf: Pfad + Wert).
const fb = vi.hoisted(() => {
  const calls: { path: string; value: Record<string, unknown> }[] = [];
  return {
    calls,
    setMock: vi.fn(async (path: string, value: Record<string, unknown>) => {
      calls.push({ path, value });
    }),
  };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: (path: string) => ({
        set: (value: Record<string, unknown>) => fb.setMock(path, value),
      }),
    }),
  },
}));

vi.mock('../../services/mangaUpdatesService', () => ({
  getMangaDexInfo: vi.fn<() => Promise<MangaDexInfo>>(),
}));

import { getMangaDexInfo } from '../../services/mangaUpdatesService';
import { addMangaToList } from './addMangaToList';

const mockedGetInfo = vi.mocked(getMangaDexInfo);

function makeResult(overrides: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult {
  return {
    id: 111,
    title: { romaji: 'Vagabondo', english: 'Vagabond', native: null },
    coverImage: { large: 'large.jpg', medium: 'medium.jpg' },
    bannerImage: null,
    description: null,
    chapters: 2,
    volumes: 37,
    status: 'FINISHED',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action', 'Drama'],
    averageScore: 90,
    startDate: { year: 1998, month: 9, day: 3 },
    isAdult: false,
    ...overrides,
  } as AniListMangaSearchResult;
}

function lastWrite() {
  return fb.calls[fb.calls.length - 1];
}

beforeEach(() => {
  fb.calls.length = 0;
  fb.setMock.mockClear();
  mockedGetInfo.mockReset();
  mockedGetInfo.mockResolvedValue({ latestChapter: null } as MangaDexInfo);
});

describe('addMangaToList', () => {
  it('schreibt unter users/$uid/manga/$anilistId', async () => {
    await addMangaToList('u1', makeResult(), 7);
    expect(lastWrite().path).toBe('users/u1/manga/111');
  });

  it('setzt die Basis-Felder inkl. sicherer Defaults (kein undefined)', async () => {
    await addMangaToList('u1', makeResult(), 7);
    const manga = lastWrite().value;
    expect(manga.nmr).toBe(7);
    expect(manga.anilistId).toBe(111);
    expect(manga.currentChapter).toBe(0);
    expect(manga.readStatus).toBe('planned');
    expect(manga.rating).toEqual({});
    expect(manga.format).toBe('MANGA');
    expect(typeof manga.addedAt).toBe('string');
    // Kein einziger Wert darf undefined sein (Firebase lehnt das ab).
    for (const value of Object.values(manga)) {
      expect(value).not.toBeUndefined();
    }
  });

  it('bevorzugt den englischen Titel, fällt sonst auf Romaji zurück', async () => {
    await addMangaToList(
      'u1',
      makeResult({ title: { romaji: 'R', english: 'E', native: null } }),
      1
    );
    expect(lastWrite().value.title).toBe('E');

    await addMangaToList(
      'u1',
      makeResult({ title: { romaji: 'R', english: null, native: null } }),
      1
    );
    expect(lastWrite().value.title).toBe('R');
  });

  it('formatiert das vollständige startDate als YYYY-MM-DD', async () => {
    await addMangaToList('u1', makeResult({ startDate: { year: 2001, month: 3, day: 5 } }), 1);
    expect(lastWrite().value.startDate).toBe('2001-03-05');
  });

  it('setzt startDate auf null, wenn Teile fehlen', async () => {
    await addMangaToList('u1', makeResult({ startDate: { year: 2001, month: null, day: 5 } }), 1);
    expect(lastWrite().value.startDate).toBeNull();
  });

  it('mappt fehlende Felder auf null statt undefined', async () => {
    await addMangaToList(
      'u1',
      makeResult({ chapters: null, volumes: null, status: '', averageScore: null }),
      1
    );
    const manga = lastWrite().value;
    expect(manga.chapters).toBeNull();
    expect(manga.volumes).toBeNull();
    expect(manga.status).toBeNull();
    expect(manga.averageScore).toBeNull();
  });

  it('fügt optionale Felder nur bei Vorhandensein hinzu', async () => {
    await addMangaToList(
      'u1',
      makeResult({ title: { romaji: 'R', english: null, native: null } }),
      1
    );
    const without = lastWrite().value;
    expect(without).not.toHaveProperty('titleEnglish');
    expect(without).not.toHaveProperty('bannerImage');
    expect(without).not.toHaveProperty('description');

    await addMangaToList(
      'u1',
      makeResult({
        title: { romaji: 'R', english: 'E', native: null },
        bannerImage: 'banner.jpg',
        description: 'desc',
      }),
      1
    );
    const withOpt = lastWrite().value;
    expect(withOpt.titleEnglish).toBe('E');
    expect(withOpt.bannerImage).toBe('banner.jpg');
    expect(withOpt.description).toBe('desc');
  });

  it('holt für RELEASING-Manga die aktuelle Kapitelzahl von MangaUpdates', async () => {
    mockedGetInfo.mockResolvedValue({ latestChapter: 326 } as MangaDexInfo);
    await addMangaToList('u1', makeResult({ status: 'RELEASING' }), 1);
    expect(mockedGetInfo).toHaveBeenCalledOnce();
    expect(lastWrite().value.latestChapterAvailable).toBe(326);
  });

  it('fragt MangaUpdates auch für HIATUS-Manga ab', async () => {
    mockedGetInfo.mockResolvedValue({ latestChapter: 50 } as MangaDexInfo);
    await addMangaToList('u1', makeResult({ status: 'HIATUS' }), 1);
    expect(mockedGetInfo).toHaveBeenCalledOnce();
    expect(lastWrite().value.latestChapterAvailable).toBe(50);
  });

  it('fragt MangaUpdates NICHT für FINISHED-Manga ab', async () => {
    await addMangaToList('u1', makeResult({ status: 'FINISHED' }), 1);
    expect(mockedGetInfo).not.toHaveBeenCalled();
    expect(lastWrite().value).not.toHaveProperty('latestChapterAvailable');
  });

  it('ignoriert latestChapter <= 0', async () => {
    mockedGetInfo.mockResolvedValue({ latestChapter: 0 } as MangaDexInfo);
    await addMangaToList('u1', makeResult({ status: 'RELEASING' }), 1);
    expect(lastWrite().value).not.toHaveProperty('latestChapterAvailable');
  });

  it('fügt den Manga trotz MangaUpdates-Fehler hinzu', async () => {
    mockedGetInfo.mockRejectedValue(new Error('network'));
    await addMangaToList('u1', makeResult({ status: 'RELEASING' }), 1);
    expect(fb.setMock).toHaveBeenCalledOnce();
    expect(lastWrite().value).not.toHaveProperty('latestChapterAvailable');
  });
});
