import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityEvent, EpisodeWatchEvent, MovieWatchEvent } from '../types/WatchActivity';

// getYearlyActivity liefert die Roh-Events → wird pro Test gestellt.
const getYearlyActivity = vi.hoisted(() => vi.fn());
vi.mock('./watchActivityService', () => ({ getYearlyActivity }));
// calculateMultiYearTrends wird nur re-exportiert → stubben, um Firebase/IO zu vermeiden.
vi.mock('./watchJourneyTrends', () => ({ calculateMultiYearTrends: vi.fn() }));
// providerChangeDetection (liefert das echte normalizeProviderName) importiert firebase/compat/app.
vi.mock('firebase/compat/app', () => ({ default: { database: () => ({ ref: () => ({}) }) } }));
vi.mock('firebase/compat/database', () => ({}));

import { calculateWatchJourney } from './watchJourneyService';

const ep = (over: Partial<EpisodeWatchEvent> = {}): EpisodeWatchEvent => ({
  type: 'episode_watch',
  timestamp: '2026-06-15T20:30:00',
  month: 6,
  dayOfWeek: 1,
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
  timestamp: '2026-06-15T21:00:00',
  month: 6,
  dayOfWeek: 1,
  hour: 21,
  movieId: 100,
  movieTitle: 'Inception',
  ...over,
});

const run = async (events: ActivityEvent[]) => {
  getYearlyActivity.mockResolvedValueOnce(events);
  return calculateWatchJourney('u1', 2026);
};

beforeEach(() => {
  getYearlyActivity.mockReset();
});

describe('calculateWatchJourney — Grundgerüst', () => {
  it('liefert für ein leeres Jahr Null-Werte und feste Strukturgrößen', async () => {
    const data = await run([]);

    expect(data.year).toBe(2026);
    expect(data.totalEpisodes).toBe(0);
    expect(data.totalMovies).toBe(0);
    expect(data.totalMinutes).toBe(0);
    expect(data.genreMonths).toHaveLength(12);
    expect(data.providerMonths).toHaveLength(12);
    expect(data.activity).toHaveLength(12);
    expect(data.heatmap).toHaveLength(7 * 24);
    expect(data.topGenres).toEqual([]);
    expect(data.topProviders).toEqual([]);
    expect(data.bingeSessionCount).toBe(0);
    expect(data.avgBingeLength).toBe(0);
    expect(data.longestBinge).toBe(0);
    expect(data.rewatchPercentage).toBe(0);
    expect(data.shortestEpisode).toBe(0); // Infinity → 0
    expect(data.avgEpisodeRuntime).toBe(0);
    expect(data.uniqueSeriesCount).toBe(0);
    expect(data.mostBingedSeries).toBeUndefined();
    // Peak-Defaults
    expect(data.peakHour).toBe(20);
    expect(data.peakDay).toBe(0);
  });

  it('ignoriert Nicht-Watch-Events und Events mit ungültigem Monat', async () => {
    const data = await run([
      ep(),
      { ...mov(), type: 'movie_rating' } as MovieWatchEvent, // kein watch → gefiltert
      ep({ month: 0 }), // monthIndex -1 → übersprungen
      ep({ month: 13 }), // monthIndex 12 → übersprungen
    ]);
    expect(data.totalEpisodes).toBe(1);
    expect(data.totalMovies).toBe(0);
  });
});

describe('Aktivität & Laufzeiten', () => {
  it('summiert Episoden/Filme pro Monat mit Runtime-Defaults (45 / 120)', async () => {
    const data = await run([
      ep({ month: 3 }), // 45
      ep({ month: 3, episodeRuntime: 30 }),
      mov({ month: 3 }), // 120
      mov({ month: 3, runtime: 90 }),
    ]);
    const march = data.activity[2];
    expect(march.episodes).toBe(2);
    expect(march.movies).toBe(2);
    expect(march.totalMinutes).toBe(45 + 30 + 120 + 90);
    expect(data.totalMinutes).toBe(285);
    expect(data.avgEpisodeRuntime).toBe(Math.round((45 + 30) / 2)); // 38
    expect(data.shortestEpisode).toBe(30);
    expect(data.longestEpisode).toBe(45);
  });
});

describe('Genres (normalisiert)', () => {
  it('verteilt Runtime gleichmäßig auf gültige, normalisierte Genres und merged Aliase', async () => {
    const data = await run([
      // Comedy → Komödie (Alias), 2 Genres → je 30 min
      ep({ episodeRuntime: 60, genres: ['Comedy', 'Drama'] }),
      // 'all' ist ungültig → gefiltert; 'Komödie' zählt weiter
      ep({ episodeRuntime: 40, genres: ['all', 'Komödie'] }),
    ]);
    // Komödie: 30 + 40 = 70, Drama: 30 → topGenres nach Zeit sortiert
    expect(data.topGenres[0]).toBe('Komödie');
    expect(data.topGenres).toContain('Drama');
    expect(data.genreColors['Komödie']).toBe('#ff9800'); // aus GENRE_COLORS
  });
});

describe('Provider (normalisiert & gefiltert)', () => {
  it('remappt Ad-Tiers/Freevee, filtert " Channel"-Add-Ons und Unbekannte', async () => {
    const data = await run([
      ep({ episodeRuntime: 45, providers: ['Netflix'] }),
      ep({ episodeRuntime: 45, providers: ['Freevee'] }), // → Amazon Prime Video
      ep({ episodeRuntime: 45, providers: ['Wow Fiction Amazon Channel'] }), // → null (raus)
      ep({ episodeRuntime: 45, providers: ['Irgendein Dienst'] }), // unbekannt → raus
    ]);
    expect(data.topProviders).toContain('Netflix');
    expect(data.topProviders).toContain('Amazon Prime Video');
    expect(data.topProviders).not.toContain('Wow Fiction Amazon Channel');
    expect(data.topProviders).toHaveLength(2);
  });

  it('fällt auf das provider-Einzelfeld zurück, wenn kein providers-Array vorhanden ist', async () => {
    const data = await run([ep({ episodeRuntime: 45, provider: 'Netflix' })]);
    expect(data.topProviders).toEqual(['Netflix']);
  });
});

describe('Heatmap', () => {
  it('zählt Events pro (hour,dayOfWeek) und ermittelt den Peak', async () => {
    const data = await run([
      ep({ hour: 22, dayOfWeek: 5 }),
      ep({ hour: 22, dayOfWeek: 5 }),
      ep({ hour: 10, dayOfWeek: 1 }),
    ]);
    const cell = data.heatmap.find((c) => c.hour === 22 && c.dayOfWeek === 5);
    expect(cell?.count).toBe(2);
    expect(data.peakHour).toBe(22);
    expect(data.peakDay).toBe(5);
  });
});

describe('Binge-Statistiken', () => {
  it('zählt Sessions und Episoden getrennt und berechnet Ø + längste Session', async () => {
    const data = await run([
      ep({ isBingeSession: true, bingeSessionId: 'a' }),
      ep({ isBingeSession: true, bingeSessionId: 'a' }),
      ep({ isBingeSession: true, bingeSessionId: 'a' }),
      ep({ isBingeSession: true, bingeSessionId: 'b' }),
      ep({ isBingeSession: true }), // ohne sessionId → zählt Episode, aber keine Session
    ]);
    expect(data.bingeEpisodeCount).toBe(5);
    expect(data.bingeSessionCount).toBe(2);
    expect(data.avgBingeLength).toBe(Math.round((5 / 2) * 10) / 10); // 2.5
    expect(data.longestBinge).toBe(3); // Session 'a'
  });
});

describe('Rewatch-Statistiken', () => {
  it('zählt Rewatches und ihren Minuten-Anteil in Prozent', async () => {
    const data = await run([
      ep({ episodeRuntime: 30, isRewatch: true }),
      ep({ episodeRuntime: 30, isRewatch: true }),
      ep({ episodeRuntime: 40, isRewatch: false }),
    ]);
    expect(data.rewatchCount).toBe(2);
    expect(data.rewatchMinutes).toBe(60);
    expect(data.rewatchPercentage).toBe(Math.round((60 / 100) * 100)); // 60
  });
});

describe('Serien-Statistiken', () => {
  it('aggregiert pro Serie, sortiert nach Episoden und trackt first/last watched + mostBinged', async () => {
    const data = await run([
      ep({
        seriesId: 1,
        seriesTitle: 'Dark',
        episodeRuntime: 50,
        timestamp: '2026-06-10T20:00:00',
        genres: ['Drama'],
        provider: 'Netflix',
      }),
      ep({
        seriesId: 1,
        seriesTitle: 'Dark',
        episodeRuntime: 50,
        timestamp: '2026-06-05T20:00:00', // früher → firstWatched
        isRewatch: true,
        isBingeSession: true,
      }),
      ep({
        seriesId: 1,
        seriesTitle: 'Dark',
        episodeRuntime: 50,
        timestamp: '2026-06-20T20:00:00', // später → lastWatched
        isBingeSession: true,
      }),
      ep({ seriesId: 2, seriesTitle: 'Severance', episodeRuntime: 40 }),
    ]);

    expect(data.uniqueSeriesCount).toBe(2);
    const dark = data.seriesStats[0];
    expect(dark.seriesId).toBe(1);
    expect(dark.episodes).toBe(3);
    expect(dark.avgRuntime).toBe(50);
    expect(dark.rewatchEpisodes).toBe(1);
    expect(dark.bingeEpisodes).toBe(2);
    expect(dark.firstWatched).toBe('2026-06-05T20:00:00');
    expect(dark.lastWatched).toBe('2026-06-20T20:00:00');
    expect(dark.genres).toContain('Drama');
    expect(dark.provider).toBe('Netflix');
    expect(data.avgEpisodesPerSeries).toBe(Math.round((4 / 2) * 10) / 10); // 2
    expect(data.mostBingedSeries).toEqual({ title: 'Dark', bingeEpisodes: 2 });
  });
});
