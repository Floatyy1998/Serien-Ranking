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
});
