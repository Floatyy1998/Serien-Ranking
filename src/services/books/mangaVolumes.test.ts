import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../types/Book';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { findMangaByIsbn, resolveMangaVolumes } from './mangaVolumes';

const searchMangaByTitles = vi.hoisted(() => vi.fn());
vi.mock('../api/anilistService', () => ({ searchMangaByTitles }));

const findViaMangaUpdates = vi.hoisted(() => vi.fn());
vi.mock('../api/mangaAliasSearch', () => ({ findViaMangaUpdates }));

const searchBooks = vi.hoisted(() => vi.fn());
vi.mock('../api/booksApi', () => ({ searchBooks }));

const anilist = (
  id: number,
  english: string,
  synonyms: string[] = []
): AniListMangaSearchResult => ({
  id,
  title: { romaji: english, english, native: null },
  synonyms,
  coverImage: { large: '', medium: '' },
  bannerImage: null,
  description: null,
  chapters: null,
  volumes: null,
  status: 'FINISHED',
  format: 'MANGA',
  countryOfOrigin: 'JP',
  genres: [],
  averageScore: null,
  startDate: { year: null, month: null, day: null },
  isAdult: false,
});

const book = (
  id: string,
  title: string,
  over: Partial<BookSearchResult> = {}
): BookSearchResult => ({
  id,
  title,
  authors: [],
  source: 'google',
  categories: ['Comics & Graphic Novels'],
  ...over,
});

beforeEach(() => {
  searchMangaByTitles.mockReset();
  findViaMangaUpdates.mockReset();
  searchBooks.mockReset();
});

describe('resolveMangaVolumes', () => {
  it('fragt jede Reihe einmal ab und ordnet alle Bände zu', async () => {
    const onePiece = anilist(30013, 'One Piece');
    searchMangaByTitles.mockResolvedValueOnce([[onePiece]]);
    const hits = await resolveMangaVolumes([
      book('op18', 'One Piece 18'),
      book('op45', 'One Piece 45'),
      book('novel', 'Der Schwarm', { categories: ['Fiction'] }),
    ]);
    expect(searchMangaByTitles).toHaveBeenCalledOnce();
    expect(searchMangaByTitles).toHaveBeenCalledWith(['One Piece']);
    expect(hits).toEqual({
      op18: { manga: onePiece, volume: 18 },
      op45: { manga: onePiece, volume: 45 },
    });

    const again = await resolveMangaVolumes([book('op67', 'One Piece 67')]);
    expect(again.op67?.manga).toBe(onePiece);
    expect(searchMangaByTitles).toHaveBeenCalledOnce();
  });

  it('versucht den vollen Titel, wenn die Zahl zum Namen gehört', async () => {
    const kaiju = anilist(120760, 'Kaiju No.8');
    searchMangaByTitles.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[kaiju]]);
    const hits = await resolveMangaVolumes([book('k', 'Kaiju No. 8')]);
    expect(searchMangaByTitles).toHaveBeenNthCalledWith(2, ['Kaiju No. 8']);
    expect(hits.k).toEqual({ manga: kaiju });
  });

  it('löst deutsche Reihentitel nur im deep-Modus über MangaUpdates auf', async () => {
    const apothecary = anilist(107002, 'The Apothecary Diaries');
    searchMangaByTitles.mockResolvedValue([[]]);
    findViaMangaUpdates.mockResolvedValue({
      results: [apothecary],
      aliases: { 107002: 'Die Tagebücher der Apothekerin' },
    });
    const items = [
      book('apo', 'Die Tagebücher der Apothekerin 3'),
      book('apo4', 'Die Tagebücher der Apothekerin - Geheimnisse am Kaiserhof 4'),
    ];
    expect(await resolveMangaVolumes(items)).toEqual({});
    expect(findViaMangaUpdates).not.toHaveBeenCalled();
    expect(await resolveMangaVolumes(items, { deep: true })).toEqual({
      apo: { manga: apothecary, volume: 3 },
      apo4: { manga: apothecary, volume: 4 },
    });
    expect(findViaMangaUpdates).toHaveBeenCalledOnce();
    expect(findViaMangaUpdates).toHaveBeenCalledWith('Die Tagebücher der Apothekerin');
  });

  it('erkennt Bände ohne Comic-Merkmal nur über den Suchbegriff', async () => {
    const spy = anilist(108556, 'SPY x FAMILY');
    searchMangaByTitles.mockResolvedValueOnce([[spy]]);
    const items = [
      book('w2', 'Spy x family 2', { categories: undefined, publisher: 'Wydawnictwo W' }),
      book('w4', 'Spy x family 4', { categories: ['Drama'], publisher: undefined }),
    ];
    expect(await resolveMangaVolumes(items, { query: 'Spy x Family' })).toEqual({
      w2: { manga: spy, volume: 2 },
      w4: { manga: spy, volume: 4 },
    });
  });

  it('rät ohne Comic-Merkmal nicht, wenn es die Reihe auch als Roman gibt', async () => {
    const overlord = anilist(1, 'Overlord');
    const novel = { ...anilist(2, 'Overlord'), format: 'NOVEL' };
    searchMangaByTitles.mockResolvedValueOnce([[novel, overlord]]);
    const items = [book('ln1', 'Overlord 1', { categories: ['Fantasy'] })];
    expect(await resolveMangaVolumes(items, { query: 'Overlord' })).toEqual({});
  });

  it('lässt Bücher ohne Comic-Merkmal unangetastet', async () => {
    expect(await resolveMangaVolumes([book('x', 'Les Misérables', { categories: [] })])).toEqual(
      {}
    );
    expect(searchMangaByTitles).not.toHaveBeenCalled();
  });
});

describe('findMangaByIsbn', () => {
  it('findet die Reihe zum Band und merkt sich den Bandtitel', async () => {
    const spy = anilist(108556, 'SPY x FAMILY');
    searchBooks.mockResolvedValue([
      book('dnb-9783695504305', 'Spy x Family – Band 16', { categories: undefined }),
    ]);
    searchMangaByTitles.mockResolvedValueOnce([[spy]]);
    expect(await findMangaByIsbn('978-3-6955-0430-5')).toEqual({
      results: [spy],
      aliases: { 108556: 'Spy x Family – Band 16' },
      volumes: { 108556: 16 },
    });
  });

  it('liefert nichts, wenn die ISBN kein Manga ist', async () => {
    searchBooks.mockResolvedValue([
      book('dnb-1', 'Die Verwandlung', { categories: undefined, subtitle: 'Roman' }),
    ]);
    expect(await findMangaByIsbn('9783150000000')).toEqual({ results: [], aliases: {} });
    expect(searchMangaByTitles).not.toHaveBeenCalled();
  });
});
