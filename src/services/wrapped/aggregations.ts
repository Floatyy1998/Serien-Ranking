/**
 * Wrapped Aggregations - Haupt-Berechnungsfunktion und Gesamtstatistiken
 *
 * Dieses Modul ist Jahr-agnostisch und kann jedes Jahr wiederverwendet werden.
 */

import type {
  ActivityEvent,
  EpisodeWatchEvent,
  MovieWatchEvent,
  BingeSession,
} from '../../types/WatchActivity';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import type { WrappedStats, BingeSessionStats, DeviceBreakdown } from '../../types/Wrapped';
import {
  calculateTopSeries,
  calculateTopMovies,
  calculateTopGenres,
  calculateTopProviders,
} from './rankings';
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
import { calculateAchievements } from './achievements';
import { generateFunFacts } from './funFacts';

export function calculateWrappedStats(
  events: ActivityEvent[],
  bingeSessions: BingeSession[],
  year: number
): WrappedStats {
  // Filtere Events für das gewünschte Jahr
  const yearEvents = events.filter((e) => new Date(e.timestamp).getFullYear() === year);
  const episodeEvents = yearEvents.filter((e) => e.type === 'episode_watch') as EpisodeWatchEvent[];
  const movieEvents = yearEvents.filter(
    (e) => e.type === 'movie_watch' || e.type === 'movie_rating'
  ) as MovieWatchEvent[];

  // Grundlegende Berechnungen
  const totalEpisodes = episodeEvents.length;
  const totalMovies = movieEvents.length;

  const episodeMinutes = episodeEvents.reduce(
    (sum, e) => sum + (e.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES),
    0
  );
  const movieMinutes = movieEvents.reduce((sum, e) => sum + (e.runtime || 120), 0);
  const totalMinutes = episodeMinutes + movieMinutes;

  // Top Serien
  const topSeries = calculateTopSeries(episodeEvents);

  // Top Filme
  const topMovies = calculateTopMovies(movieEvents);

  // Top Genres
  const topGenres = calculateTopGenres(episodeEvents, movieEvents);

  // Top Providers (Streaming-Dienste)
  const topProviders = calculateTopProviders(episodeEvents, movieEvents);

  // Zeitliche Muster
  const monthlyBreakdown = calculateMonthlyBreakdown(yearEvents);
  const mostActiveMonth = findMostActiveMonth(monthlyBreakdown);
  const mostActiveDay = findMostActiveDay(yearEvents);
  const favoriteTimeOfDay = calculateFavoriteTimeOfDay(yearEvents);
  const favoriteDayOfWeek = calculateFavoriteDayOfWeek(yearEvents);

  // Binge-Statistiken
  const yearBingeSessions = bingeSessions.filter(
    (s) => new Date(s.startedAt).getFullYear() === year
  );
  const longestBinge = findLongestBingeSession(yearBingeSessions);

  // Geräte-Breakdown
  const deviceBreakdown = calculateDeviceBreakdown(yearEvents);

  // Unique Serien
  const uniqueSeriesIds = new Set(episodeEvents.map((e) => e.seriesId));

  // Achievements
  const achievements = calculateAchievements({
    totalEpisodes,
    totalMovies,
    totalMinutes,
    favoriteTimeOfDay,
    favoriteDayOfWeek,
    topGenres,
    longestStreak: 0, // TODO: Aus Streak-Daten
    yearBingeSessions,
  });

  // Fun Facts
  const funFacts = generateFunFacts({
    totalMinutes,
    totalEpisodes,
    totalMovies,
    topSeries,
    mostActiveMonth,
    favoriteTimeOfDay,
  });

  // NEUE BERECHNUNGEN
  // First & Last Watch
  const firstWatch = findFirstWatch(yearEvents);
  const lastWatch = findLastWatch(yearEvents);

  // Late Night Stats
  const lateNightStats = calculateLateNightStats(yearEvents);

  // Heatmap Data
  const heatmapData = calculateHeatmapData(yearEvents);

  return {
    year,
    totalEpisodesWatched: totalEpisodes,
    totalMoviesWatched: totalMovies,
    totalMinutesWatched: totalMinutes,
    totalHoursWatched: Math.round(totalMinutes / 60),
    totalDaysEquivalent: Math.round((totalMinutes / 60 / 24) * 10) / 10,
    uniqueSeriesWatched: uniqueSeriesIds.size,
    topSeries,
    topMovies,
    topGenres,
    topProviders,
    mostActiveMonth,
    mostActiveDay,
    favoriteTimeOfDay,
    favoriteDayOfWeek,
    monthlyBreakdown,
    totalBingeSessions: yearBingeSessions.length,
    longestBingeSession: longestBinge,
    averageBingeLength:
      yearBingeSessions.length > 0
        ? Math.round(
            yearBingeSessions.reduce((sum, s) => sum + s.episodes.length, 0) /
              yearBingeSessions.length
          )
        : 0,
    longestStreak: 0, // TODO: Aus Streak-Daten holen
    currentStreak: 0,
    deviceBreakdown,
    achievements,
    funFacts,
    // Neue Stats
    firstWatch,
    lastWatch,
    lateNightStats,
    heatmapData,
  };
}

// ========================================
// Binge-Berechnungen
// ========================================

function findLongestBingeSession(sessions: BingeSession[]): BingeSessionStats | null {
  if (sessions.length === 0) return null;

  const longest = sessions.reduce((max, s) => (s.episodes.length > max.episodes.length ? s : max));

  return {
    seriesId: longest.seriesId,
    seriesTitle: longest.seriesTitle,
    episodeCount: longest.episodes.length,
    totalMinutes: longest.totalMinutes,
    date: longest.startedAt.split('T')[0],
  };
}

// ========================================
// Geräte-Berechnungen
// ========================================

function calculateDeviceBreakdown(events: ActivityEvent[]): DeviceBreakdown {
  const counts = { mobile: 0, desktop: 0, tablet: 0 };
  const total = events.length;

  for (const event of events) {
    if (event.deviceType) {
      counts[event.deviceType]++;
    }
  }

  return {
    mobile: {
      count: counts.mobile,
      percentage: total > 0 ? Math.round((counts.mobile / total) * 100) : 0,
    },
    desktop: {
      count: counts.desktop,
      percentage: total > 0 ? Math.round((counts.desktop / total) * 100) : 0,
    },
    tablet: {
      count: counts.tablet,
      percentage: total > 0 ? Math.round((counts.tablet / total) * 100) : 0,
    },
  };
}
