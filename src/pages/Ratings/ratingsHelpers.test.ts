import { describe, expect, it } from 'vitest';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import {
  extractProviders,
  getRating,
  getSeriesProgress,
  hasWatchedEpisodes,
  prepareMovieItem,
  prepareSeriesItem,
} from './ratingsHelpers';

const PAST = '2000-01-01';
const FUTURE = '2999-12-31';

function ep(overrides: Record<string, unknown> = {}) {
  return { air_date: PAST, watched: false, episode_number: 1, ...overrides };
}

function makeSeries(overrides: Record<string, unknown> = {}): Series {
  return {
    id: 1,
    title: 'Breaking Bad',
    poster: { poster: '/poster.jpg' },
    rating: { user1: 8 },
    seasons: [],
    ...overrides,
  } as unknown as Series;
}

function makeMovie(overrides: Record<string, unknown> = {}): Movie {
  return {
    id: 2,
    title: 'Inception',
    poster: { poster: '/inception.jpg' },
    rating: { user1: 9 },
    release_date: '2010-07-16',
    ...overrides,
  } as unknown as Movie;
}

describe('getRating', () => {
  it('mittelt positive Ratings aus der User-Map', () => {
    expect(getRating(makeSeries({ rating: { a: 8, b: 6 } }))).toBe(7);
  });

  it('ignoriert 0/negative Werte', () => {
    expect(getRating(makeSeries({ rating: { a: 8, b: 0 } }))).toBe(8);
  });

  it('leere Rating-Map → 0', () => {
    expect(getRating(makeSeries({ rating: {} }))).toBe(0);
  });

  it('ungültiges rating → 0 (kein NaN)', () => {
    expect(getRating(makeSeries({ rating: null }))).toBe(0);
  });
});

describe('getSeriesProgress', () => {
  it('ohne Staffeln → 0', () => {
    expect(getSeriesProgress(makeSeries({ seasons: undefined }))).toBe(0);
  });

  it('rechnet Prozent gesehener AIRED-Episoden', () => {
    const series = makeSeries({
      seasons: [
        {
          episodes: [
            ep({ watched: true }),
            ep({ watched: true, episode_number: 2 }),
            ep({ watched: false, episode_number: 3 }),
            ep({ watched: false, episode_number: 4 }),
          ],
        },
      ],
    });
    expect(getSeriesProgress(series)).toBe(50);
  });

  it('zählt nur ausgestrahlte Episoden', () => {
    const series = makeSeries({
      seasons: [
        {
          episodes: [
            ep({ watched: true }),
            ep({ air_date: FUTURE, watched: false, episode_number: 2 }),
          ],
        },
      ],
    });
    // 1 von 1 ausgestrahlt gesehen → 100 %
    expect(getSeriesProgress(series)).toBe(100);
  });

  it('keine ausgestrahlten Episoden → 0', () => {
    const series = makeSeries({
      seasons: [{ episodes: [ep({ air_date: FUTURE })] }],
    });
    expect(getSeriesProgress(series)).toBe(0);
  });

  it('überspringt Staffeln ohne episodes und null-Episoden', () => {
    const series = makeSeries({
      seasons: [{ episodes: null }, { episodes: [null, ep({ watched: true })] }],
    });
    expect(getSeriesProgress(series)).toBe(100);
  });
});

describe('hasWatchedEpisodes', () => {
  it('true bei mindestens einer gesehenen ausgestrahlten Episode', () => {
    const series = makeSeries({ seasons: [{ episodes: [ep({ watched: true })] }] });
    expect(hasWatchedEpisodes(series)).toBe(true);
  });

  it('false wenn nur ungesehene oder nicht ausgestrahlte Episoden', () => {
    expect(hasWatchedEpisodes(makeSeries({ seasons: [{ episodes: [ep()] }] }))).toBe(false);
    expect(
      hasWatchedEpisodes(
        makeSeries({ seasons: [{ episodes: [ep({ air_date: FUTURE, watched: true })] }] })
      )
    ).toBe(false);
  });

  it('false ohne Staffeln', () => {
    expect(hasWatchedEpisodes(makeSeries({ seasons: undefined }))).toBe(false);
  });
});

describe('extractProviders', () => {
  it('leere Liste ohne provider', () => {
    expect(extractProviders(makeSeries({ provider: undefined }))).toEqual([]);
  });

  it('dedupliziert nach Name und begrenzt auf 2', () => {
    const series = makeSeries({
      provider: {
        provider: [
          { name: 'Netflix', logo: 'n.png' },
          { name: 'Netflix', logo: 'n2.png' },
          { name: 'Prime', logo: 'p.png' },
          { name: 'Disney', logo: 'd.png' },
        ],
      },
    });
    expect(extractProviders(series)).toEqual([
      { name: 'Netflix', logo: 'n.png' },
      { name: 'Prime', logo: 'p.png' },
    ]);
  });
});

describe('prepareSeriesItem', () => {
  it('baut ein PreparedItem mit abgeleiteten Feldern', () => {
    const series = makeSeries({
      first_air_date: '2008-01-20',
      watchlist: true,
      genre: { genres: ['Drama', 'Crime', 'All'] },
      provider: { provider: [{ name: 'Netflix', logo: 'n.png' }] },
      seasons: [{ episodes: [ep({ watched: true })] }],
    });
    const item = prepareSeriesItem(series, 8.5);
    expect(item.id).toBe(1);
    expect(item.title).toBe('Breaking Bad');
    expect(item.isMovie).toBe(false);
    expect(item.rating).toBe(8.5);
    expect(item.watchlist).toBe(true);
    expect(item.year).toBe('2008');
    expect(item.progress).toBe(100);
    // "All" wird gefiltert, max 2 Genres
    expect(item.genres).toBe('Drama, Crime');
    expect(item.providers).toEqual([{ name: 'Netflix', logo: 'n.png' }]);
    expect(item.posterUrl).toContain('/poster.jpg');
  });

  it('leitet das Jahr aus der ersten Episode ab, wenn keine expliziten Daten', () => {
    const series = makeSeries({
      first_air_date: undefined,
      release_date: undefined,
      seasons: [{ episodes: [ep({ air_date: '2015-06-01' })] }],
    });
    expect(prepareSeriesItem(series, 0).year).toBe('2015');
  });
});

describe('prepareMovieItem', () => {
  it('baut ein PreparedItem für einen Film (progress immer 0)', () => {
    const movie = makeMovie({ watchlist: false, genres: [{ name: 'Sci-Fi' }, { name: 'All' }] });
    const item = prepareMovieItem(movie, 9);
    expect(item.id).toBe(2);
    expect(item.isMovie).toBe(true);
    expect(item.progress).toBe(0);
    expect(item.releaseDate).toBe('2010-07-16');
    expect(item.year).toBe('2010');
    expect(item.genres).toBe('Sci-Fi');
    expect(item.rating).toBe(9);
  });
});
