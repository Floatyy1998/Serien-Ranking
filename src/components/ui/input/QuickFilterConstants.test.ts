import { describe, expect, it, vi } from 'vitest';

// Vermeide das Laden des riesigen @mui/icons-material-Barrels im node-Test.
vi.mock('@mui/icons-material', () => ({
  Bookmark: 'BookmarkIcon',
  NewReleases: 'NewReleasesIcon',
  PlaylistAdd: 'PlaylistAddIcon',
  Schedule: 'ScheduleIcon',
  Star: 'StarIcon',
}));

import { seriesQuickFilters, movieQuickFilters, ratingsQuickFilters } from './QuickFilterConstants';

const allFilters = [
  ['series', seriesQuickFilters],
  ['movie', movieQuickFilters],
  ['ratings', ratingsQuickFilters],
] as const;

describe('QuickFilterConstants', () => {
  it.each(allFilters)('%s-Filter haben value/label/icon je Eintrag', (_name, filters) => {
    expect(filters.length).toBeGreaterThan(0);
    for (const f of filters) {
      expect(typeof f.value).toBe('string');
      expect(f.value.length).toBeGreaterThan(0);
      expect(typeof f.label).toBe('string');
      expect(f.icon).toBeDefined();
    }
  });

  it.each(allFilters)('%s-Filter haben eindeutige values', (_name, filters) => {
    const values = filters.map((f) => f.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('alle Filtergruppen bieten "unrated"', () => {
    expect(seriesQuickFilters.some((f) => f.value === 'unrated')).toBe(true);
    expect(movieQuickFilters.some((f) => f.value === 'unrated')).toBe(true);
    expect(ratingsQuickFilters.some((f) => f.value === 'unrated')).toBe(true);
  });

  it('ratings-Filter enthalten watchlist-spezifische Optionen', () => {
    const values = ratingsQuickFilters.map((f) => f.value);
    expect(values).toContain('watchlist');
    expect(values).toContain('not-started');
    expect(values).toContain('ongoing');
  });

  it('movie-Filter bieten "unreleased" (Serien nicht)', () => {
    expect(movieQuickFilters.some((f) => f.value === 'unreleased')).toBe(true);
    expect(seriesQuickFilters.some((f) => f.value === 'unreleased')).toBe(false);
  });
});
