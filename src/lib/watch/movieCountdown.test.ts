import { describe, expect, it } from 'vitest';
import type { Movie } from '../../types/Movie';
import {
  buildMovieCountdowns,
  daysUntilDay,
  isReleaseCandidate,
  parseCatalogRelease,
  pickRegionalRelease,
  sortReleaseCandidates,
  type RegionalRelease,
  type TmdbReleaseDates,
} from './movieCountdown';

const TODAY = new Date(2026, 10, 19, 15, 30);

const movie = (over: Partial<Movie> = {}): Movie =>
  ({
    id: 1,
    title: 'Film',
    poster: { poster: 'https://img/p.jpg' },
    rating: {},
    release_date: '2026-12-17',
    status: 'Post Production',
    ...over,
  }) as Movie;

const dates = (region: string, list: [number, string][]): TmdbReleaseDates => ({
  results: [
    { iso_3166_1: 'US', release_dates: [{ type: 3, release_date: '2026-12-18T00:00:00.000Z' }] },
    {
      iso_3166_1: region,
      release_dates: list.map(([type, release_date]) => ({ type, release_date })),
    },
  ],
});

describe('pickRegionalRelease', () => {
  it('nimmt den frühesten Kinostart der Region', () => {
    const data = dates('DE', [
      [1, '2026-11-01T00:00:00.000Z'],
      [3, '2026-12-17T00:00:00.000Z'],
      [2, '2026-12-10T00:00:00.000Z'],
      [4, '2027-02-01T00:00:00.000Z'],
    ]);
    expect(pickRegionalRelease(data, 'DE')).toEqual({ date: '2026-12-10', kind: 'cinema' });
  });

  it('fällt ohne Kinostart auf den Digital-Start zurück', () => {
    const data = dates('DE', [
      [1, '2026-11-01T00:00:00.000Z'],
      [4, '2027-02-01T00:00:00.000Z'],
    ]);
    expect(pickRegionalRelease(data, 'DE')).toEqual({ date: '2027-02-01', kind: 'digital' });
  });

  it('liefert null, wenn die Region fehlt oder nur eine Premiere kennt', () => {
    expect(pickRegionalRelease(dates('DE', [[1, '2026-11-01']]), 'DE')).toBeNull();
    expect(pickRegionalRelease(dates('DE', [[3, '2026-12-17']]), 'AT')).toBeNull();
    expect(pickRegionalRelease({}, 'DE')).toBeNull();
  });
});

describe('parseCatalogRelease', () => {
  it('liest Kino- vor Digital-Start', () => {
    expect(parseCatalogRelease('2026-12-17|2027-02-01')).toEqual({
      date: '2026-12-17',
      kind: 'cinema',
    });
    expect(parseCatalogRelease('2026-12-17|')).toEqual({ date: '2026-12-17', kind: 'cinema' });
    expect(parseCatalogRelease('|2027-02-01')).toEqual({ date: '2027-02-01', kind: 'digital' });
  });

  it('liefert null für leere oder kaputte Werte', () => {
    expect(parseCatalogRelease('')).toBeNull();
    expect(parseCatalogRelease(undefined)).toBeNull();
    expect(parseCatalogRelease('bald|')).toBeNull();
  });
});

describe('daysUntilDay', () => {
  it('zählt Kalendertage unabhängig von der Uhrzeit', () => {
    expect(daysUntilDay('2026-11-19', TODAY)).toBe(0);
    expect(daysUntilDay('2026-11-20', TODAY)).toBe(1);
    expect(daysUntilDay('2026-11-18T23:00:00.000Z', TODAY)).toBe(-1);
    expect(daysUntilDay('2026-12-17', TODAY)).toBe(28);
  });

  it('liefert null ohne lesbares Datum', () => {
    expect(daysUntilDay('', TODAY)).toBeNull();
    expect(daysUntilDay(undefined, TODAY)).toBeNull();
    expect(daysUntilDay('bald', TODAY)).toBeNull();
  });
});

describe('isReleaseCandidate', () => {
  it('nimmt kommende und jüngst erschienene, ungesehene Filme', () => {
    expect(isReleaseCandidate(movie(), TODAY)).toBe(true);
    expect(
      isReleaseCandidate(movie({ release_date: '2026-05-20', status: 'Released' }), TODAY)
    ).toBe(true);
  });

  it('lässt alte, gesehene und abgesagte Filme aus', () => {
    expect(isReleaseCandidate(movie({ release_date: '2024-05-20' }), TODAY)).toBe(false);
    expect(isReleaseCandidate(movie({ watched: true }), TODAY)).toBe(false);
    expect(isReleaseCandidate(movie({ rating: { Action: 8 } }), TODAY)).toBe(false);
    expect(isReleaseCandidate(movie({ status: 'Canceled' }), TODAY)).toBe(false);
  });

  it('nimmt Filme ohne Datum nur, solange sie nicht als erschienen gelten', () => {
    expect(isReleaseCandidate(movie({ release_date: '', status: 'In Production' }), TODAY)).toBe(
      true
    );
    expect(isReleaseCandidate(movie({ release_date: '', status: 'Released' }), TODAY)).toBe(false);
    expect(isReleaseCandidate(movie({ release_date: undefined, status: undefined }), TODAY)).toBe(
      false
    );
  });
});

describe('sortReleaseCandidates', () => {
  it('stellt undatierte und späte Filme nach vorn', () => {
    const sorted = sortReleaseCandidates([
      movie({ id: 1, release_date: '2026-06-01' }),
      movie({ id: 2, release_date: '' }),
      movie({ id: 3, release_date: '2027-03-01' }),
    ]);
    expect(sorted.map((m) => m.id)).toEqual([2, 3, 1]);
  });
});

describe('buildMovieCountdowns', () => {
  const lookup =
    (map: Record<number, RegionalRelease | null>) =>
    (id: number): RegionalRelease | null | undefined =>
      map[id];

  it('zählt bis zum regionalen Start und sortiert nach Tagen', () => {
    const result = buildMovieCountdowns(
      [
        movie({ id: 1, title: 'Spät', release_date: '2026-12-25' }),
        movie({ id: 2, title: 'Früh', release_date: '2026-11-01', status: 'Released' }),
      ],
      lookup({
        1: { date: '2026-12-24', kind: 'cinema' },
        2: { date: '2026-11-26', kind: 'digital' },
      }),
      TODAY
    );
    expect(result).toEqual([
      {
        type: 'movie-release',
        movieId: 2,
        title: 'Früh',
        posterUrl: 'https://img/p.jpg',
        nextDate: '2026-11-26',
        daysUntil: 7,
        release: 'digital',
      },
      {
        type: 'movie-release',
        movieId: 1,
        title: 'Spät',
        posterUrl: 'https://img/p.jpg',
        nextDate: '2026-12-24',
        daysUntil: 35,
        release: 'cinema',
      },
    ]);
  });

  it('nutzt das Katalog-Datum, solange kein regionaler Start bekannt ist', () => {
    const result = buildMovieCountdowns([movie({ id: 3 })], lookup({ 3: null }), TODAY);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ nextDate: '2026-12-17', daysUntil: 28, release: 'unknown' });
    expect(buildMovieCountdowns([movie({ id: 4 })], lookup({}), TODAY)[0].release).toBe('unknown');
  });

  it('zählt auch Filme mit altem Katalog-Datum, wenn der regionale Start noch kommt', () => {
    const result = buildMovieCountdowns(
      [movie({ id: 8, release_date: '2024-05-20', status: 'Released' })],
      lookup({ 8: { date: '2026-12-03', kind: 'cinema' } }),
      TODAY
    );
    expect(result).toMatchObject([{ movieId: 8, daysUntil: 14 }]);
  });

  it('lässt gesehene und abgesagte Filme weg', () => {
    const result = buildMovieCountdowns(
      [movie({ id: 9, watched: true }), movie({ id: 10, status: 'Canceled' })],
      lookup({}),
      TODAY
    );
    expect(result).toEqual([]);
  });

  it('zeigt einen Start von heute und lässt bereits gestartete Filme weg', () => {
    const result = buildMovieCountdowns(
      [movie({ id: 5 }), movie({ id: 6 }), movie({ id: 7, release_date: '2026-10-01' })],
      lookup({
        5: { date: '2026-11-19', kind: 'cinema' },
        6: { date: '2026-11-12', kind: 'cinema' },
        7: null,
      }),
      TODAY
    );
    expect(result.map((c) => [c.movieId, c.daysUntil])).toEqual([[5, 0]]);
  });
});
