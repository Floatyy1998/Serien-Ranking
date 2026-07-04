import { describe, expect, it } from 'vitest';
import { calculateWrappedStats } from './aggregations';
import type {
  ActivityEvent,
  BingeSession,
  EpisodeWatchEvent,
  MovieWatchEvent,
} from '../../types/WatchActivity';

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

const binge = (over: Partial<BingeSession> = {}): BingeSession => ({
  id: 'b1',
  startedAt: '2025-03-01T20:00:00',
  seriesId: 1,
  seriesTitle: 'Dark',
  episodes: [
    { seasonNumber: 1, episodeNumber: 1, watchedAt: 'x' },
    { seasonNumber: 1, episodeNumber: 2, watchedAt: 'x' },
    { seasonNumber: 1, episodeNumber: 3, watchedAt: 'x' },
  ],
  totalMinutes: 135,
  isActive: false,
  ...over,
});

describe('calculateWrappedStats', () => {
  it('leeres Jahr → dokumentierte Null-/Fallback-Werte', () => {
    const stats = calculateWrappedStats([], [], 2025);
    expect(stats.year).toBe(2025);
    expect(stats.totalEpisodesWatched).toBe(0);
    expect(stats.totalMoviesWatched).toBe(0);
    expect(stats.totalMinutesWatched).toBe(0);
    expect(stats.totalHoursWatched).toBe(0);
    expect(stats.totalDaysEquivalent).toBe(0);
    expect(stats.uniqueSeriesWatched).toBe(0);
    expect(stats.topSeries).toEqual([]);
    expect(stats.topMovies).toEqual([]);
    expect(stats.topGenres).toEqual([]);
    expect(stats.topProviders).toEqual([]);
    expect(stats.monthlyBreakdown).toHaveLength(12);
    expect(stats.totalBingeSessions).toBe(0);
    expect(stats.longestBingeSession).toBeNull();
    expect(stats.averageBingeLength).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.firstWatch).toBeNull();
    expect(stats.lastWatch).toBeNull();
    expect(stats.heatmapData).toHaveLength(7);
    expect(stats.achievements).toHaveLength(10);
    expect(stats.achievements.every((a) => !a.unlocked)).toBe(true);
    expect(stats.funFacts.length).toBeGreaterThan(0);
  });

  it('filtert Events strikt aufs Kalenderjahr des Timestamps', () => {
    const events: ActivityEvent[] = [
      ep({ timestamp: '2024-12-31T23:00:00' }),
      ep({ timestamp: '2025-01-01T00:30:00', month: 1 }),
      ep({ timestamp: '2025-12-31T22:00:00', month: 12 }),
      ep({ timestamp: '2026-01-01T01:00:00', month: 1 }),
    ];
    expect(calculateWrappedStats(events, [], 2025).totalEpisodesWatched).toBe(2);
  });

  it('zählt movie_rating als geschaut inkl. Laufzeit', () => {
    const events: ActivityEvent[] = [
      mov({ type: 'movie_rating', runtime: 90, rating: 8 }),
      mov({ type: 'movie_watch', runtime: 100 }),
    ];
    const stats = calculateWrappedStats(events, [], 2025);
    expect(stats.totalMoviesWatched).toBe(2);
    expect(stats.totalMinutesWatched).toBe(190);
  });

  it('nutzt Default-Runtimes (Episode 45, Film 120) und rundet Stunden/Tage', () => {
    const events: ActivityEvent[] = [
      ep(),
      ep({ episodeRuntime: 30, seriesId: 2, seriesTitle: 'Severance' }),
      mov(),
      mov({ type: 'movie_rating', runtime: 90, movieId: 101 }),
    ];
    const stats = calculateWrappedStats(events, [], 2025);
    expect(stats.totalMinutesWatched).toBe(285);
    expect(stats.totalHoursWatched).toBe(5);
    expect(stats.totalDaysEquivalent).toBe(0.2);
    expect(stats.uniqueSeriesWatched).toBe(2);
  });

  it('episodeRuntime 0 gilt als fehlend → Default 45', () => {
    expect(calculateWrappedStats([ep({ episodeRuntime: 0 })], [], 2025).totalMinutesWatched).toBe(
      45
    );
  });

  it('findet die längste Binge-Session und rundet den Schnitt', () => {
    const sessions: BingeSession[] = [
      binge({ id: 'b0', startedAt: '2024-12-30T20:00:00' }), // anderes Jahr
      binge({
        id: 'b1',
        seriesId: 7,
        seriesTitle: 'Breaking Bad',
        totalMinutes: 200,
        episodes: Array.from({ length: 4 }, (_, i) => ({
          seasonNumber: 1,
          episodeNumber: i + 1,
          watchedAt: 'x',
        })),
      }),
      binge({ id: 'b3' }), // 3 Episoden
    ];
    const stats = calculateWrappedStats([], sessions, 2025);
    expect(stats.totalBingeSessions).toBe(2);
    expect(stats.longestBingeSession).toEqual({
      seriesId: 7,
      seriesTitle: 'Breaking Bad',
      episodeCount: 4,
      totalMinutes: 200,
      date: '2025-03-01',
    });
    expect(stats.averageBingeLength).toBe(4); // round((4+3)/2)=round(3.5)=4
  });

  it('berechnet den Device-Breakdown relativ zu allen Jahres-Events', () => {
    const events: ActivityEvent[] = [
      ep({ deviceType: 'mobile' }),
      ep({ deviceType: 'mobile' }),
      mov({ deviceType: 'desktop' }),
      ep(),
    ];
    expect(calculateWrappedStats(events, [], 2025).deviceBreakdown).toEqual({
      mobile: { count: 2, percentage: 50 },
      desktop: { count: 1, percentage: 25 },
      tablet: { count: 0, percentage: 0 },
    });
  });
});
