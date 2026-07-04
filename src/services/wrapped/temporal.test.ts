import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyBreakdown,
  findMostActiveMonth,
  findMostActiveDay,
  calculateFavoriteTimeOfDay,
  calculateFavoriteDayOfWeek,
  findFirstWatch,
  findLastWatch,
  calculateLateNightStats,
  calculateHeatmapData,
} from './temporal';
import type { ActivityEvent, EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';

const ep = (over: Partial<EpisodeWatchEvent> = {}): EpisodeWatchEvent => ({
  type: 'episode_watch',
  timestamp: '2025-06-15T20:30:00',
  month: 6,
  dayOfWeek: 0,
  hour: 20,
  seriesId: 1,
  seriesTitle: 'Dark',
  seasonNumber: 1,
  episodeNumber: 1,
  isRewatch: false,
  ...over,
});

const mov = (over: Partial<MovieWatchEvent> = {}): MovieWatchEvent => ({
  type: 'movie_watch',
  timestamp: '2025-06-15T21:00:00',
  month: 6,
  dayOfWeek: 0,
  hour: 21,
  movieId: 100,
  movieTitle: 'Inception',
  ...over,
});

describe('calculateMonthlyBreakdown', () => {
  it('liefert 12 Monate mit deutschen Namen', () => {
    const breakdown = calculateMonthlyBreakdown([]);
    expect(breakdown).toHaveLength(12);
    expect(breakdown[0].monthName).toBe('Januar');
    expect(breakdown[11].monthName).toBe('Dezember');
  });

  it('bucketet nach month-Feld und summiert Minuten mit Defaults', () => {
    const breakdown = calculateMonthlyBreakdown([
      ep({ month: 3 }),
      ep({ month: 3, episodeRuntime: 25 }),
      mov({ month: 3 }),
      mov({ month: 3, type: 'movie_rating', runtime: 90 }),
    ]);
    expect(breakdown[2]).toEqual({
      month: 3,
      monthName: 'März',
      episodesWatched: 2,
      moviesWatched: 2,
      minutesWatched: 45 + 25 + 120 + 90,
    });
  });
});

describe('findMostActiveMonth', () => {
  it('vergleicht Episoden+Filme; bei Gleichstand gewinnt der frühere Monat', () => {
    const breakdown = calculateMonthlyBreakdown([
      ep({ month: 4 }),
      mov({ month: 4 }),
      ep({ month: 9 }),
      ep({ month: 9 }),
    ]);
    expect(findMostActiveMonth(breakdown).monthName).toBe('April');
  });

  it('leeres Jahr → erster Monat (Januar) gewinnt', () => {
    expect(findMostActiveMonth(calculateMonthlyBreakdown([])).monthName).toBe('Januar');
  });
});

describe('findMostActiveDay', () => {
  it('gruppiert nach Datumsteil und findet den aktivsten Tag', () => {
    const result = findMostActiveDay([
      ep({ timestamp: '2025-06-15T10:00:00' }),
      ep({ timestamp: '2025-06-15T22:00:00', episodeRuntime: 60 }),
      mov({ timestamp: '2025-06-15T20:00:00', runtime: 90 }),
      ep({ timestamp: '2025-06-16T20:00:00' }),
    ]);
    expect(result.date).toBe('2025-06-15');
    expect(result.episodesWatched).toBe(2);
    expect(result.moviesWatched).toBe(1);
    expect(result.minutesWatched).toBe(45 + 60 + 90);
  });

  it('leere Liste → date "" und dayName undefined', () => {
    const result = findMostActiveDay([]);
    expect(result.date).toBe('');
    expect(result.dayName).toBeUndefined();
    expect(result.episodesWatched).toBe(0);
  });
});

describe('calculateFavoriteTimeOfDay', () => {
  it('ordnet Stunden den Tageszeit-Fenstern zu', () => {
    const cases: Array<[number, string]> = [
      [5, 'night'],
      [6, 'morning'],
      [11, 'morning'],
      [12, 'afternoon'],
      [17, 'afternoon'],
      [18, 'evening'],
      [21, 'evening'],
      [22, 'night'],
      [0, 'night'],
    ];
    for (const [hour, expected] of cases) {
      expect(calculateFavoriteTimeOfDay([ep({ hour })]).timeOfDay).toBe(expected);
    }
  });

  it('berechnet Count und gerundete Prozent', () => {
    const result = calculateFavoriteTimeOfDay([
      ep({ hour: 23 }),
      ep({ hour: 2 }),
      ep({ hour: 15 }),
    ]);
    expect(result).toEqual({
      timeOfDay: 'night',
      label: 'Nachts (22-6 Uhr)',
      count: 2,
      percentage: 67,
    });
  });

  it('leere Liste → Fallback evening/0', () => {
    expect(calculateFavoriteTimeOfDay([])).toEqual({
      timeOfDay: 'evening',
      label: 'Abends (18-22 Uhr)',
      count: 0,
      percentage: 0,
    });
  });
});

describe('calculateFavoriteDayOfWeek', () => {
  it('zählt per dayOfWeek; bei Gleichstand kleinster Index', () => {
    const result = calculateFavoriteDayOfWeek([
      ep({ dayOfWeek: 5 }),
      ep({ dayOfWeek: 2 }),
      ep({ dayOfWeek: 2 }),
      ep({ dayOfWeek: 5 }),
    ]);
    expect(result).toEqual({ dayOfWeek: 2, dayName: 'Dienstag', count: 2, percentage: 50 });
  });

  it('leere Liste → Sonntag (Index 0) mit 0', () => {
    expect(calculateFavoriteDayOfWeek([])).toEqual({
      dayOfWeek: 0,
      dayName: 'Sonntag',
      count: 0,
      percentage: 0,
    });
  });
});

describe('findFirstWatch / findLastWatch', () => {
  const events: ActivityEvent[] = [
    mov({ timestamp: '2025-03-10T20:00:00', movieId: 55, movieTitle: 'Dune' }),
    ep({
      timestamp: '2025-01-05T10:00:00',
      seriesId: 9,
      seriesTitle: 'Dark',
      seasonNumber: 2,
      episodeNumber: 3,
    }),
    ep({ timestamp: '2025-11-20T21:00:00', seriesId: 9 }),
  ];

  it('findFirstWatch: frühestes Event mit S/E-Subtitle', () => {
    const first = findFirstWatch(events);
    expect(first?.type).toBe('episode');
    expect(first?.title).toBe('Dark');
    expect(first?.subtitle).toBe('S2 E3');
    expect(first?.id).toBe(9);
    expect(first?.timestamp).toBe('2025-01-05T10:00:00');
  });

  it('findLastWatch: spätestes Event', () => {
    expect(findLastWatch(events)?.timestamp).toBe('2025-11-20T21:00:00');
  });

  it('Filme haben keinen subtitle', () => {
    const last = findLastWatch([
      mov({ timestamp: '2025-03-10T20:00:00', movieId: 55, movieTitle: 'Dune' }),
    ]);
    expect(last?.type).toBe('movie');
    expect(last).not.toHaveProperty('subtitle');
  });

  it('leere Liste → null', () => {
    expect(findFirstWatch([])).toBeNull();
    expect(findLastWatch([])).toBeNull();
  });
});

describe('calculateLateNightStats', () => {
  it('zählt Late-Night (22-6) und Midnight (0-4) getrennt', () => {
    const result = calculateLateNightStats([ep({ hour: 23 }), ep({ hour: 3 }), ep({ hour: 12 })]);
    expect(result.totalLateNightWatches).toBe(2);
    expect(result.midnightWatches).toBe(1);
    expect(result.percentage).toBe(67);
  });

  it('Stunde 4 = Midnight, Stunde 5 nicht mehr', () => {
    expect(calculateLateNightStats([ep({ hour: 4 })]).midnightWatches).toBe(1);
    const five = calculateLateNightStats([ep({ hour: 5 })]);
    expect(five.midnightWatches).toBe(0);
    expect(five.totalLateNightWatches).toBe(1);
  });

  it('latestWatch: Nachtstunden < 6 normalisiert auf +24 — 3 Uhr schlägt 23 Uhr', () => {
    const result = calculateLateNightStats([
      ep({ hour: 23, seriesTitle: 'Abends', timestamp: '2025-06-15T23:45:00' }),
      ep({ hour: 3, seriesTitle: 'Nachts', timestamp: '2025-06-16T03:07:00' }),
    ]);
    expect(result.latestWatch).toEqual({ time: '03:07', title: 'Nachts' });
  });

  it('fehlende hour → 12 Uhr; Filme nutzen movieTitle', () => {
    const result = calculateLateNightStats([
      mov({ hour: undefined as unknown as number, movieTitle: 'Mittagsfilm' }),
    ]);
    expect(result.totalLateNightWatches).toBe(0);
    expect(result.latestWatch).toEqual({ time: '12:00', title: 'Mittagsfilm' });
  });

  it('leere Liste → Null-Werte', () => {
    expect(calculateLateNightStats([])).toEqual({
      totalLateNightWatches: 0,
      midnightWatches: 0,
      latestWatch: null,
      percentage: 0,
    });
  });
});

describe('calculateHeatmapData', () => {
  it('liefert 7x24-Matrix und zählt bei [dayOfWeek][hour]', () => {
    const heatmap = calculateHeatmapData([
      ep({ dayOfWeek: 2, hour: 21 }),
      ep({ dayOfWeek: 2, hour: 21 }),
      mov({ type: 'movie_rating', dayOfWeek: 6, hour: 0 }),
    ]);
    expect(heatmap).toHaveLength(7);
    expect(heatmap.every((row) => row.length === 24)).toBe(true);
    expect(heatmap[2][21]).toBe(2);
    expect(heatmap[6][0]).toBe(1);
    expect(heatmap.flat().reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('fehlende Felder defaulten auf Sonntag (0) und 12 Uhr', () => {
    const heatmap = calculateHeatmapData([
      ep({ dayOfWeek: undefined as unknown as number, hour: undefined as unknown as number }),
    ]);
    expect(heatmap[0][12]).toBe(1);
  });
});
