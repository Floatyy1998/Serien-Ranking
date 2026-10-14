import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { searchMangaWithTitleFallback } from './mangaSearch';

const searchManga = vi.hoisted(() => vi.fn());
const searchMangaByTitles = vi.hoisted(() => vi.fn());
vi.mock('./anilistService', () => ({ searchManga, searchMangaByTitles }));

const searchMangaUpdatesTitles = vi.hoisted(() => vi.fn());
vi.mock('./mangaUpdatesService', () => ({ searchMangaUpdatesTitles }));

function manga(id: number, english: string, romaji = english): AniListMangaSearchResult {
  return {
    id,
    title: { romaji, english, native: null },
    coverImage: { large: '', medium: '' },
    bannerImage: null,
    description: null,
    chapters: null,
    volumes: null,
    status: 'RELEASING',
    format: 'MANGA',
    countryOfOrigin: 'KR',
    genres: [],
    averageScore: null,
    startDate: { year: null, month: null, day: null },
    isAdult: false,
  };
}

const werewolves = manga(180320, 'Werewolves Going Crazy Over Me');
const unrelated = manga(1, 'Something Else');

beforeEach(() => {
  searchManga.mockReset();
  searchMangaByTitles.mockReset();
  searchMangaUpdatesTitles.mockReset();
});

describe('searchMangaWithTitleFallback', () => {
  it('fragt MangaUpdates nicht, wenn AniList den Titel direkt findet', async () => {
    searchManga.mockResolvedValue({ results: [werewolves] });

    const outcome = await searchMangaWithTitleFallback('Werewolves Going');

    expect(outcome).toEqual({ results: [werewolves], aliases: {} });
    expect(searchMangaUpdatesTitles).not.toHaveBeenCalled();
  });

  it('übersetzt deutsche Webtoon-Titel über MangaUpdates und stellt sie nach vorn', async () => {
    searchManga.mockResolvedValue({ results: [unrelated] });
    searchMangaUpdatesTitles.mockResolvedValue([
      { title: 'Werewolves Going Crazy Over Me', hitTitle: 'Werwölfe sind verrückt nach mir' },
      { title: 'Chasing Mr. CEO', hitTitle: 'Ich bin verrückt nach meinem Boss' },
    ]);
    searchMangaByTitles.mockResolvedValue([[werewolves]]);

    const outcome = await searchMangaWithTitleFallback('Werwölfe sind verrückt nach mir');

    expect(searchMangaByTitles).toHaveBeenCalledWith(['Werewolves Going Crazy Over Me']);
    expect(outcome.results).toEqual([werewolves, unrelated]);
    expect(outcome.aliases).toEqual({ 180320: 'Werwölfe sind verrückt nach mir' });
  });

  it('verwirft MangaUpdates-Titel ohne exakten AniList-Treffer', async () => {
    searchManga.mockResolvedValue({ results: [] });
    searchMangaUpdatesTitles.mockResolvedValue([
      { title: 'The Beau and the Beast', hitTitle: 'Der Schöne und das Biest' },
    ]);
    searchMangaByTitles.mockResolvedValue([[manga(5, 'Beauty and the Beast')]]);

    const outcome = await searchMangaWithTitleFallback('Der Schöne und das Biest');

    expect(outcome).toEqual({ results: [], aliases: {} });
  });

  it('bleibt bei den AniList-Ergebnissen, wenn der Fallback scheitert', async () => {
    searchManga.mockResolvedValue({ results: [unrelated] });
    searchMangaUpdatesTitles.mockResolvedValue([
      { title: 'Werewolves Going Crazy Over Me', hitTitle: 'Werwölfe sind verrückt nach mir' },
    ]);
    searchMangaByTitles.mockRejectedValue(new Error('AniList down'));

    const outcome = await searchMangaWithTitleFallback('Werwölfe sind verrückt nach mir');

    expect(outcome).toEqual({ results: [unrelated], aliases: {} });
  });

  it('nutzt den Fallback bei sehr kurzen Eingaben nicht', async () => {
    searchManga.mockResolvedValue({ results: [] });

    await searchMangaWithTitleFallback('Wer');

    expect(searchMangaUpdatesTitles).not.toHaveBeenCalled();
  });

  it('zeigt Titel, die nur MangaUpdates kennt, und stellt exakte Treffer nach vorn', async () => {
    const notYet = manga(101007, 'Not Boyfriends Yet');
    searchManga.mockResolvedValue({ results: [notYet] });
    searchMangaUpdatesTitles.mockResolvedValue([
      {
        id: 48132338279,
        title: 'Boyfriends.',
        hitTitle: 'Boyfriends.',
        type: 'OEL',
        image: 'cover.jpg',
        year: '2023',
        genres: ['Romance'],
      },
      { id: 9, title: 'Alpha Boyfriends', hitTitle: 'Alpha Boyfriends', type: 'Manhwa' },
      {
        id: 10,
        title: 'Lewd Boyfriends',
        hitTitle: 'Lewd Boyfriends',
        type: 'OEL',
        genres: ['Adult'],
      },
    ]);
    searchMangaByTitles.mockResolvedValue([[], [], []]);

    const outcome = await searchMangaWithTitleFallback('Boyfriends');

    expect(outcome.results.map((r) => r.id)).toEqual([-48132338279, 101007]);
    expect(outcome.results[0]).toMatchObject({
      title: { english: 'Boyfriends.' },
      format: 'COMIC',
      coverImage: { large: 'cover.jpg' },
    });
    expect(outcome.aliases).toEqual({});
  });

  it('nimmt den AniList-Eintrag, wenn AniList einen westlichen Titel doch führt', async () => {
    const listed = manga(77, 'Dramacon');
    searchManga.mockResolvedValue({ results: [] });
    searchMangaUpdatesTitles.mockResolvedValue([
      { id: 5, title: 'Dramacon', hitTitle: 'Dramacon', type: 'OEL' },
    ]);
    searchMangaByTitles.mockResolvedValue([[listed]]);

    const outcome = await searchMangaWithTitleFallback('Dramacon');

    expect(outcome.results).toEqual([listed]);
  });
});
