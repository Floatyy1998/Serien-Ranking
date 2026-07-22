import { describe, expect, it } from 'vitest';
import { buildExportData, buildWatchCsv } from './buildExport';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

const series = {
  id: 66732,
  title: 'Stranger Things',
  seasons: [
    {
      seasonNumber: 0,
      episodes: [
        {
          id: 111,
          name: 'Kapitel eins',
          air_date: '2016-07-15',
          watched: true,
          watchCount: 2,
          firstWatchedAt: '2022-07-03T20:00:00Z',
          lastWatchedAt: '2023-01-01T20:00:00Z',
          episode_number: 1,
        },
        {
          id: 112,
          name: 'Kapitel zwei',
          air_date: '2016-07-15',
          watched: false,
          episode_number: 2,
        },
      ],
    },
  ],
} as unknown as Series;

const movie = {
  id: 949,
  title: 'Heat',
  watched: true,
  watchedAt: '2022-02-02',
  rating: { Action: 9 },
  genre: { genres: ['Action'] },
} as unknown as Movie;

describe('buildExportData', () => {
  it('exportiert nur gesehene Episoden mit 1-basierter Staffel', () => {
    const data = buildExportData([series], [movie]);
    expect(data.format).toBe('tvrank');
    expect(data.series).toHaveLength(1);
    expect(data.series[0].episodes).toHaveLength(1);
    expect(data.series[0].episodes[0]).toMatchObject({
      season: 1,
      episode: 1,
      episodeId: 111,
      watchCount: 2,
      firstWatchedAt: '2022-07-03T20:00:00Z',
    });
    expect(data.movies[0]).toMatchObject({ tmdbId: 949, watched: true, rating: 9 });
  });

  it('lässt Serien ohne gesehene Folgen und ohne Watchlist weg', () => {
    const unwatched = {
      ...series,
      id: 1,
      seasons: [{ seasonNumber: 0, episodes: [{ id: 5, watched: false }] }],
    } as unknown as Series;
    const data = buildExportData([unwatched], []);
    expect(data.series).toHaveLength(0);
  });
});

describe('buildWatchCsv', () => {
  it('erzeugt Header + eine Zeile pro Episode/Film und escapt Kommata', () => {
    const withComma = {
      ...series,
      title: 'Stranger, Things',
    } as unknown as Series;
    const csv = buildWatchCsv(buildExportData([withComma], [movie]));
    const lines = csv.split('\n');
    expect(lines[0]).toContain('type,tmdbId,title');
    expect(lines).toHaveLength(3); // Header + 1 Episode + 1 Film
    expect(lines[1]).toContain('"Stranger, Things"');
    expect(lines[2].startsWith('movie,949')).toBe(true);
  });
});
