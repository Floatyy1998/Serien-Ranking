/**
 * Tests für die Multi-Jahres-Trend-Aggregation.
 *
 * calculateWatchJourney (die pro-Jahr-Quelle) ist gemockt, sodass die reine
 * Aggregationslogik geprüft wird: Genre-/Provider-Verteilung in Stunden,
 * Top-Werte (ohne "Andere"), All-Time-Aggregate, Trend-Schwellen (1.1 / 0.9)
 * und Gesamtsummen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WatchJourneyData, MonthlyData } from './watchJourneyTypes';

const calculateWatchJourney = vi.hoisted(() => vi.fn());
vi.mock('./watchJourneyService', () => ({ calculateWatchJourney }));

import { calculateMultiYearTrends } from './watchJourneyTrends';

const month = (values: Record<string, number>): MonthlyData => ({
  month: 1,
  monthName: 'Januar',
  values,
  total: Object.values(values).reduce((a, b) => a + b, 0),
});

interface YearSpec {
  year: number;
  episodes: number;
  movies: number;
  minutes: number;
  genres?: Record<string, number>;
  providers?: Record<string, number>;
}

const makeYear = (s: YearSpec): WatchJourneyData =>
  ({
    year: s.year,
    genreMonths: s.genres ? [month(s.genres)] : [],
    topGenres: [],
    genreColors: {},
    providerMonths: s.providers ? [month(s.providers)] : [],
    topProviders: [],
    providerColors: {},
    heatmap: [],
    peakHour: 0,
    peakDay: 0,
    activity: [],
    totalEpisodes: s.episodes,
    totalMovies: s.movies,
    totalMinutes: s.minutes,
    bingeSessionCount: 0,
    bingeEpisodeCount: 0,
    avgBingeLength: 0,
    longestBinge: 0,
    rewatchCount: 0,
  }) as unknown as WatchJourneyData;

/** Registriert die Jahres-Daten, die der Mock je year zurückgibt. */
function serve(specs: YearSpec[]) {
  const byYear = new Map(specs.map((s) => [s.year, makeYear(s)]));
  calculateWatchJourney.mockImplementation(async (_uid: string, year: number) => {
    const y = byYear.get(year);
    if (!y) throw new Error(`no data for ${year}`);
    return y;
  });
}

beforeEach(() => {
  calculateWatchJourney.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calculateMultiYearTrends – einzelnes Jahr', () => {
  it('rechnet Minuten in Stunden um und findet Top-Genre/Provider ohne "Andere"', async () => {
    serve([
      {
        year: 2025,
        episodes: 100,
        movies: 10,
        minutes: 6000,
        genres: { Drama: 3000, Comedy: 1200, Andere: 600 },
        providers: { Netflix: 3600, Andere: 600 },
      },
    ]);

    const result = await calculateMultiYearTrends('u', [2025]);

    expect(result.years).toEqual([2025]);
    const yd = result.yearlyData[0];
    expect(yd.episodes).toBe(100);
    expect(yd.totalHours).toBe(100); // round(6000/60)
    expect(yd.topGenre).toBe('Drama'); // 50h > 20h
    expect(yd.topProvider).toBe('Netflix');
    expect(yd.genreDistribution).toEqual({ Drama: 50, Comedy: 20, Andere: 10 });

    // "Andere" fließt nicht in die All-Time-Top-Listen
    expect(result.allTimeTopGenres.map((g) => g.genre)).toEqual(['Drama', 'Comedy']);
    expect(result.allTimeTopGenres[0]).toMatchObject({ genre: 'Drama', hours: 50 });
    expect(result.allTimeTopGenres[0].color).toEqual(expect.any(String));
    expect(result.allTimeTopProviders.map((p) => p.provider)).toEqual(['Netflix']);
  });

  it('nur "Andere" vorhanden → Top-Genre/Provider ist "-"', async () => {
    serve([
      {
        year: 2025,
        episodes: 5,
        movies: 0,
        minutes: 300,
        genres: { Andere: 300 },
        providers: { Andere: 300 },
      },
    ]);
    const result = await calculateMultiYearTrends('u', [2025]);
    expect(result.yearlyData[0].topGenre).toBe('-');
    expect(result.yearlyData[0].topProvider).toBe('-');
  });

  it('einzelnes Jahr → Trends bleiben stable', async () => {
    serve([{ year: 2025, episodes: 100, movies: 10, minutes: 6000 }]);
    const result = await calculateMultiYearTrends('u', [2025]);
    expect(result.episodesTrend).toBe('stable');
    expect(result.hoursTrend).toBe('stable');
  });
});

describe('calculateMultiYearTrends – Sortierung & Summen', () => {
  it('sortiert yearlyData aufsteigend nach Jahr und summiert die Gesamtwerte', async () => {
    serve([
      { year: 2024, episodes: 40, movies: 4, minutes: 3600 },
      { year: 2025, episodes: 60, movies: 6, minutes: 6000 },
    ]);
    const result = await calculateMultiYearTrends('u', [2025, 2024]);

    expect(result.yearlyData.map((y) => y.year)).toEqual([2024, 2025]);
    expect(result.years).toEqual([2024, 2025]);
    expect(result.totalEpisodes).toBe(100);
    expect(result.totalMovies).toBe(10);
    expect(result.totalHours).toBe(60 + 100); // round(3600/60)+round(6000/60)
  });
});

describe('calculateMultiYearTrends – Trend-Schwellen', () => {
  const twoYears = (lastEp: number, lastMin: number) => [
    { year: 2024, episodes: 100, movies: 0, minutes: 6000 },
    { year: 2025, episodes: lastEp, movies: 0, minutes: lastMin },
  ];

  it('Anstieg > 10 %: episodesTrend/hoursTrend = up', async () => {
    serve(twoYears(120, 7200)); // Episoden 120 > 110, Stunden 120 > 110
    const result = await calculateMultiYearTrends('u', [2024, 2025]);
    expect(result.episodesTrend).toBe('up');
    expect(result.hoursTrend).toBe('up');
  });

  it('Rückgang > 10 %: down', async () => {
    serve(twoYears(50, 3000)); // 50 < 90, 50h < 90
    const result = await calculateMultiYearTrends('u', [2024, 2025]);
    expect(result.episodesTrend).toBe('down');
    expect(result.hoursTrend).toBe('down');
  });

  it('innerhalb ±10 %: stable', async () => {
    serve(twoYears(105, 6300)); // 105 in (90,110], 105h in (90,110]
    const result = await calculateMultiYearTrends('u', [2024, 2025]);
    expect(result.episodesTrend).toBe('stable');
    expect(result.hoursTrend).toBe('stable');
  });
});

describe('calculateMultiYearTrends – All-Time-Grenzen', () => {
  it('begrenzt Top-Genres auf 6 und Top-Provider auf 5', async () => {
    const genres: Record<string, number> = {};
    for (let i = 0; i < 8; i++) genres[`G${i}`] = (8 - i) * 600; // absteigend
    const providers: Record<string, number> = {};
    for (let i = 0; i < 7; i++) providers[`P${i}`] = (7 - i) * 600;

    serve([{ year: 2025, episodes: 10, movies: 0, minutes: 6000, genres, providers }]);
    const result = await calculateMultiYearTrends('u', [2025]);

    expect(result.allTimeTopGenres).toHaveLength(6);
    expect(result.allTimeTopGenres[0].genre).toBe('G0'); // höchste Stunden
    expect(result.allTimeTopProviders).toHaveLength(5);
    expect(result.allTimeTopProviders[0].provider).toBe('P0');
  });
});
