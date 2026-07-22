import { describe, expect, it } from 'vitest';
import { parseImportFile } from './parseImport';

describe('parseImportFile', () => {
  it('parst TV-Rank-Export-JSON', () => {
    const json = JSON.stringify({
      format: 'tvrank',
      version: 1,
      exportedAt: '2026-07-23T00:00:00Z',
      series: [
        {
          tmdbId: 66732,
          title: 'Stranger Things',
          episodes: [
            {
              season: 1,
              episode: 2,
              episodeId: 123,
              watchCount: 2,
              firstWatchedAt: '2022-07-03T20:00:00Z',
            },
          ],
        },
      ],
      movies: [{ tmdbId: 661374, title: 'Glass Onion', watched: true, rating: 8 }],
    });
    const result = parseImportFile(json);
    expect(result?.source).toBe('tvrank');
    expect(result?.series[0]).toMatchObject({ tmdbId: 66732, title: 'Stranger Things' });
    expect(result?.series[0].episodes[0]).toMatchObject({
      season: 1,
      episode: 2,
      count: 2,
      watchedAt: '2022-07-03T20:00:00Z',
    });
    expect(result?.movies[0]).toMatchObject({ tmdbId: 661374, rating: 8 });
  });

  it('parst Trakt-watched-Shows-Export', () => {
    const json = JSON.stringify([
      {
        plays: 3,
        show: { title: 'Dark', ids: { trakt: 1, tmdb: 70523 } },
        seasons: [
          {
            number: 1,
            episodes: [
              { number: 1, plays: 2, last_watched_at: '2020-01-01T10:00:00.000Z' },
              { number: 2, plays: 1 },
            ],
          },
        ],
      },
    ]);
    const result = parseImportFile(json);
    expect(result?.source).toBe('trakt');
    expect(result?.series[0].tmdbId).toBe(70523);
    expect(result?.series[0].episodes).toHaveLength(2);
    expect(result?.series[0].episodes[0]).toMatchObject({ season: 1, episode: 1, count: 2 });
  });

  it('aggregiert Trakt-History-Einträge (mehrere Plays derselben Folge)', () => {
    const json = JSON.stringify([
      {
        type: 'episode',
        watched_at: '2021-05-01T20:00:00.000Z',
        episode: { season: 2, number: 5 },
        show: { title: 'Dark', ids: { tmdb: 70523 } },
      },
      {
        type: 'episode',
        watched_at: '2022-01-01T20:00:00.000Z',
        episode: { season: 2, number: 5 },
        show: { title: 'Dark', ids: { tmdb: 70523 } },
      },
      {
        type: 'movie',
        watched_at: '2022-02-02T20:00:00.000Z',
        movie: { title: 'Heat', ids: { tmdb: 949 } },
      },
    ]);
    const result = parseImportFile(json);
    expect(result?.series[0].episodes).toHaveLength(1);
    expect(result?.series[0].episodes[0].count).toBe(2);
    // ältestes Datum gewinnt als watchedAt
    expect(result?.series[0].episodes[0].watchedAt).toBe('2021-05-01T20:00:00.000Z');
    expect(result?.movies[0].tmdbId).toBe(949);
  });

  it('behält Trakt-Einträge ohne TMDB-Id (IMDb/TVDB als Fallback)', () => {
    const json = JSON.stringify([
      {
        type: 'episode',
        watched_at: '2021-05-01T20:00:00.000Z',
        episode: { season: 1, number: 1 },
        show: { title: 'Obscure Show', ids: { trakt: 9, imdb: 'tt1234567', tvdb: 555 } },
      },
    ]);
    const result = parseImportFile(json);
    expect(result?.series[0]).toMatchObject({
      tmdbId: null,
      imdbId: 'tt1234567',
      tvdbId: 555,
    });
  });

  it('lehnt Unbekanntes ab (Netflix-CSV, kaputtes JSON, leere Arrays)', () => {
    expect(parseImportFile('Title,Date\n"Foo: Staffel 1: Bar","01.01.22"')).toBeNull();
    expect(parseImportFile('{nicht json')).toBeNull();
    expect(parseImportFile('[]')).toBeNull();
    expect(parseImportFile('[{"foo": 1}]')).toBeNull();
  });
});
