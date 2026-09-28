import { describe, expect, it } from 'vitest';
import {
  compareByRelease,
  firstAirDateOfSeasons,
  isReleaseSort,
  formatYearRange,
  hasYearRange,
  matchesYearRange,
  parseYearRange,
  releaseYearOf,
} from './releaseYearFilter';

describe('releaseYearFilter', () => {
  it('parst offene und geschlossene Bereiche', () => {
    expect(parseYearRange('1990-2005')).toEqual({ from: 1990, to: 2005 });
    expect(parseYearRange('2010-')).toEqual({ from: 2010, to: null });
    expect(parseYearRange('-1989')).toEqual({ from: null, to: 1989 });
    expect(parseYearRange('')).toEqual({ from: null, to: null });
    expect(parseYearRange('2020-2010')).toEqual({ from: 2010, to: 2020 });
    expect(parseYearRange('abc-19')).toEqual({ from: null, to: null });
  });

  it('formatiert rundlaufend', () => {
    expect(formatYearRange(2010, null)).toBe('2010-');
    expect(formatYearRange(null, null)).toBe('');
    expect(parseYearRange(formatYearRange(null, 1999))).toEqual({ from: null, to: 1999 });
  });

  it('erkennt aktive Bereiche', () => {
    expect(hasYearRange('2010-')).toBe(true);
    expect(hasYearRange('-')).toBe(false);
    expect(hasYearRange(undefined)).toBe(false);
  });

  it('matcht inklusive Grenzen und verwirft Titel ohne Jahr', () => {
    expect(matchesYearRange('2010-2019', 2010)).toBe(true);
    expect(matchesYearRange('2010-2019', 2019)).toBe(true);
    expect(matchesYearRange('2010-2019', 2020)).toBe(false);
    expect(matchesYearRange('-1989', 1970)).toBe(true);
    expect(matchesYearRange('2010-2019', null)).toBe(false);
    expect(matchesYearRange('', null)).toBe(true);
  });

  it('liest das Jahr aus Datumswerten', () => {
    expect(releaseYearOf('2019-04-12')).toBe(2019);
    expect(releaseYearOf('')).toBeNull();
    expect(releaseYearOf(undefined)).toBeNull();
  });

  it('findet das früheste Ausstrahlungsdatum', () => {
    expect(
      firstAirDateOfSeasons({
        '1': { episodes: [{ airDate: '2012-03-01' }, null] },
        '0': { episodes: [{ air_date: '2011-12-24' }, { airstamp: '2013-01-01T02:00:00Z' }] },
      })
    ).toBe('2011-12-24');
    expect(firstAirDateOfSeasons(undefined)).toBeUndefined();
  });

  it('sortiert nach Erscheinung, Titel ohne Datum immer hinten', () => {
    const dates = ['2015-06-01', undefined, '1999-01-01', '2015-01-01T20:00:00Z'];
    const asc = [...dates].sort((a, b) => compareByRelease(a, b, 'release-asc'));
    const desc = [...dates].sort((a, b) => compareByRelease(a, b, 'release-desc'));
    expect(asc).toEqual(['1999-01-01', '2015-01-01T20:00:00Z', '2015-06-01', undefined]);
    expect(desc).toEqual(['2015-06-01', '2015-01-01T20:00:00Z', '1999-01-01', undefined]);
    expect(isReleaseSort('release-asc')).toBe(true);
    expect(isReleaseSort('date-desc')).toBe(false);
  });
});
