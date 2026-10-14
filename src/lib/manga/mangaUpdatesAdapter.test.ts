import { describe, expect, it } from 'vitest';
import { isMangaUpdatesId, mangaSourceLink, toMangaUpdatesSeriesId } from './mangaSource';
import {
  isMangaUpdatesOnlyType,
  mangaUpdatesToSearchResult,
  parseMangaUpdatesStatus,
} from './mangaUpdatesAdapter';

const boyfriends = {
  id: 48132338279,
  title: 'Boyfriends.',
  description: 'Vier Studenten &amp; ihre Beziehung.',
  image: 'https://cdn.mangaupdates.com/image/i504230.jpg',
  type: 'OEL',
  year: '2023',
  rating: 6.57,
  genres: ['Comedy', 'Mature', 'Romance', 'Shounen Ai', 'Yaoi', 'Sci-fi'],
  status: '4 Volume (Ongoing)',
  associated: ['Boyfriends &#039;DE&#039;'],
  authors: [
    { name: 'Refrainbow', type: 'Author' },
    { name: 'Refrainbow', type: 'Artist' },
  ],
};

describe('mangaSource', () => {
  it('kennzeichnet MangaUpdates-Titel über negative IDs', () => {
    const result = mangaUpdatesToSearchResult(boyfriends);
    expect(result.id).toBe(-48132338279);
    expect(isMangaUpdatesId(result.id)).toBe(true);
    expect(isMangaUpdatesId(30013)).toBe(false);
    expect(toMangaUpdatesSeriesId(result.id)).toBe(48132338279);
  });

  it('verlinkt je nach Quelle AniList oder MangaUpdates', () => {
    expect(mangaSourceLink(30013)).toEqual({
      label: 'AniList',
      url: 'https://anilist.co/manga/30013',
    });
    expect(mangaSourceLink(-48132338279)).toEqual({
      label: 'MangaUpdates',
      url: 'https://www.mangaupdates.com/series/m40r1wn',
    });
  });
});

describe('parseMangaUpdatesStatus', () => {
  it('liest Status, Kapitel und Bände', () => {
    expect(parseMangaUpdatesStatus('120 Chapters (Complete)')).toEqual({
      status: 'FINISHED',
      chapters: 120,
      volumes: null,
    });
    expect(parseMangaUpdatesStatus('4 Volume (Ongoing)')).toEqual({
      status: 'RELEASING',
      chapters: null,
      volumes: 4,
    });
  });

  it('bevorzugt Hiatus, Abbruch und laufende Staffeln vor „Complete“', () => {
    expect(parseMangaUpdatesStatus('S1: 60 Chapters (Complete)\nS2 (Ongoing)').status).toBe(
      'RELEASING'
    );
    expect(parseMangaUpdatesStatus('80 Chapters (Hiatus)').status).toBe('HIATUS');
    expect(parseMangaUpdatesStatus('12 Chapters (Discontinued)').status).toBe('CANCELLED');
    expect(parseMangaUpdatesStatus(null).status).toBe('');
  });
});

describe('mangaUpdatesToSearchResult', () => {
  it('bildet die Serie auf die AniList-Form ab', () => {
    const result = mangaUpdatesToSearchResult(boyfriends);
    expect(result.title).toEqual({ romaji: 'Boyfriends.', english: 'Boyfriends.', native: null });
    expect(result.synonyms).toEqual(["Boyfriends 'DE'"]);
    expect(result.coverImage.large).toBe(boyfriends.image);
    expect(result.format).toBe('COMIC');
    expect(result.status).toBe('RELEASING');
    expect(result.chapters).toBeNull();
    expect(result.averageScore).toBe(66);
    expect(result.startDate).toEqual({ year: 2023, month: null, day: null });
    expect(result.genres).toEqual(['Comedy', 'Romance', 'Sci-Fi']);
    expect(result.isAdult).toBe(false);
    expect(result.staff?.edges.map((e) => e.role)).toEqual(['Story', 'Art']);
  });

  it('übernimmt Kapitel und Bände nur bei abgeschlossenen Serien', () => {
    const result = mangaUpdatesToSearchResult({
      ...boyfriends,
      status: '30 Volumes (Complete)\n240 Chapters',
    });
    expect(result.chapters).toBe(240);
    expect(result.volumes).toBe(30);
  });

  it('markiert Erwachsenen-Genres und kommt ohne optionale Felder aus', () => {
    const result = mangaUpdatesToSearchResult({ id: 1, title: 'X', genres: ['Hentai'] });
    expect(result.isAdult).toBe(true);
    expect(result.startDate.year).toBeNull();
    expect(result.averageScore).toBeNull();
    expect(result.description).toBeNull();
  });
});

describe('isMangaUpdatesOnlyType', () => {
  it('lässt nur Typen durch, die AniList nicht führt', () => {
    expect(isMangaUpdatesOnlyType('OEL')).toBe(true);
    expect(isMangaUpdatesOnlyType('Indonesian')).toBe(true);
    expect(isMangaUpdatesOnlyType('Manhwa')).toBe(false);
    expect(isMangaUpdatesOnlyType(null)).toBe(false);
  });
});
