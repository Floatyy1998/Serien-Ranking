// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../../types/Manga';
import type { MangaCatalogEntry } from './mangaCatalog';

const backend = vi.hoisted(() => ({
  fetch: vi.fn(async () => new Response('{}')),
  session: true,
}));

vi.mock('../api/backendApi', () => ({
  backendFetch: backend.fetch,
  hasBackendSession: () => backend.session,
}));
vi.mock('../i18n', () => ({ appLocale: 'de' }));

import {
  describeMangaFromCatalog,
  keepMangaInCatalog,
  mangaEntryMatches,
  searchMangaCatalog,
} from './mangaCatalog';

const INDEX: { v: number; n: number; items: MangaCatalogEntry[] } = {
  v: 3,
  n: 2,
  items: [
    { id: '30013', t: 'One Piece', r: 'One Piece', y: 1997, f: 'MANGA', k: 'JP', c: 1, v: 50 },
    {
      id: '-55',
      t: 'Solo Leveling',
      e: 'Solo Leveling',
      r: 'Na Honjaman Level Up',
      k: 'KR',
      v: 40,
    },
  ],
};
const ITEMS: Record<string, unknown> = {
  '30013': {
    id: '30013',
    anilistId: 30013,
    title: 'One Piece',
    titleRomaji: 'One Piece',
    poster: 'https://s4.anilist.co/x.jpg',
    cover: 'https://serienapi.konrad-dinges.de/mangacover/30013-L.jpg?v=50',
    chapters: 1100,
    status: 'RELEASING',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action'],
    startDate: '1997-07-22',
    v: 50,
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = vi.fn(async (url: string) => {
  if (url.endsWith('/manga/version')) return json({ version: 3, count: 2 });
  if (url.includes('/catalog/manga/index.json?v=3')) return json(INDEX);
  const item = /\/catalog\/manga\/items\/([^.]+)\.json\?v=\d+/.exec(url);
  if (item && ITEMS[item[1]]) return json(ITEMS[item[1]]);
  return json({ error: 'nope' }, 404);
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  backend.session = true;
});

afterEach(() => {
  vi.unstubAllGlobals();
  backend.fetch.mockClear();
});

const result = (over: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult => ({
  id: 30013,
  title: { romaji: 'One Piece', english: 'One Piece', native: 'ワンピース' },
  coverImage: { large: 'https://s4.anilist.co/x.jpg', medium: 'https://s4.anilist.co/m.jpg' },
  bannerImage: null,
  description: '<p>Gol D. Roger …</p>',
  chapters: 1100,
  volumes: null,
  status: 'RELEASING',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  genres: ['Action'],
  averageScore: 92,
  startDate: { year: 1997, month: 7, day: 22 },
  isAdult: false,
  ...over,
});

describe('Manga-Katalog', () => {
  it('findet Katalog-Manga über jeden Titel und liefert sie als Suchtreffer mit eigenem Cover', async () => {
    const hits = await searchMangaCatalog('one piece');
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe(30013);
    expect(hits[0].coverImage.large).toContain('/mangacover/30013-L.jpg');
    expect(hits[0].startDate).toEqual({ year: 1997, month: 7, day: 22 });
    expect(hits[0].title.native).toBeNull();
    expect(fetchMock.mock.calls.map(([u]) => u)).toContainEqual(
      expect.stringContaining('/catalog/manga/items/30013.json?v=50')
    );
  });

  it('vergleicht Suchwörter gegen Anzeigetitel, Englisch und Romaji', () => {
    const entry = INDEX.items[1];
    expect(mangaEntryMatches(entry, 'honjaman')).toBe(true);
    expect(mangaEntryMatches(entry, 'solo lev')).toBe(true);
    expect(mangaEntryMatches(entry, 'solo piece')).toBe(false);
    expect(mangaEntryMatches(entry, 'x')).toBe(false);
  });

  it('schickt beim Hinzufügen einen flachen Eintrag mit Titeln als Strings', () => {
    keepMangaInCatalog(result());
    expect(backend.fetch).toHaveBeenCalledTimes(1);
    const [path, init] = backend.fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe('/manga/add');
    const body = JSON.parse(String(init.body)) as { lang: string; manga: Record<string, unknown> };
    expect(body.lang).toBe('de');
    expect(body.manga).toMatchObject({
      id: '30013',
      title: 'One Piece',
      titleNative: 'ワンピース',
      poster: 'https://s4.anilist.co/x.jpg',
      startDate: '1997-07-22',
    });
    expect(body.manga).not.toHaveProperty('isAdult');
    expect(body.manga).not.toHaveProperty('recommendations');
  });

  it('holt die Beschreibung in App-Sprache und merkt sie sich', async () => {
    backend.fetch.mockResolvedValueOnce(json({ text: 'Gol D. Roger war …', source: 'ai' }));
    const first = await describeMangaFromCatalog('30013', 'de', '<p>Gol D. Roger …</p>');
    expect(first).toEqual({ text: 'Gol D. Roger war …', capped: false, translated: true });
    const [path, init] = backend.fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe('/manga/describe');
    expect(JSON.parse(String(init.body))).toEqual({
      id: '30013',
      lang: 'de',
      text: '<p>Gol D. Roger …</p>',
    });
    const second = await describeMangaFromCatalog('30013', 'de');
    expect(second.text).toBe('Gol D. Roger war …');
    expect(backend.fetch).toHaveBeenCalledTimes(1);
  });

  it('ruft ohne Anmeldung nichts auf', () => {
    backend.session = false;
    keepMangaInCatalog(result());
    expect(backend.fetch).not.toHaveBeenCalled();
  });
});
