/**
 * Watch Journey Service - Berechnet alle Journey-Daten
 *
 * Analysiert Watch-Events für verschiedene Trend-Visualisierungen:
 * - Genre Journey (monatliche Genre-Verteilung)
 * - Provider Journey (Streaming-Dienst Nutzung)
 * - Watch Heatmap (Stunde x Wochentag)
 * - Activity Timeline (Episoden/Filme pro Monat)
 * - Binge Patterns
 */

import { getYearlyActivity } from './watchActivityService';
import type { EpisodeWatchEvent, MovieWatchEvent } from '../types/WatchActivity';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
import type {
  MonthlyData,
  HeatmapData,
  ActivityData,
  WatchJourneyData,
  YearlyTrendData,
  MultiYearTrendsData,
} from './watchJourneyTypes';
import {
  MONTH_NAMES,
  DAY_NAMES,
  GENRE_COLORS,
  PROVIDER_COLORS,
  FALLBACK_COLORS,
  isValidGenre,
  isValidProvider,
  getColor,
  normalizeGenre,
} from './watchJourneyTypes';
import { calculateMultiYearTrends } from './watchJourneyTrends';

// Re-export everything from sub-modules
export type {
  MonthlyData,
  HeatmapData,
  ActivityData,
  WatchJourneyData,
  YearlyTrendData,
  MultiYearTrendsData,
};
export { MONTH_NAMES, DAY_NAMES, GENRE_COLORS, PROVIDER_COLORS, FALLBACK_COLORS };
export { isValidGenre, isValidProvider, getColor };
export { calculateMultiYearTrends };

// ============================================================================
// MAIN CALCULATION
// ============================================================================

export async function calculateWatchJourney(
  userId: string,
  year: number
): Promise<WatchJourneyData> {
  const events = await getYearlyActivity(userId, year);

  // Filter watch events
  const watchEvents = events.filter(
    (e): e is EpisodeWatchEvent | MovieWatchEvent =>
      e.type === 'episode_watch' || e.type === 'movie_watch'
  );

  // Initialize data structures
  const genreMonthly = MONTH_NAMES.map((name, i) => ({
    month: i + 1,
    monthName: name,
    values: {} as Record<string, number>,
    total: 0,
  }));

  const providerMonthly = MONTH_NAMES.map((name, i) => ({
    month: i + 1,
    monthName: name,
    values: {} as Record<string, number>,
    total: 0,
  }));

  const activityMonthly = MONTH_NAMES.map((name, i) => ({
    month: i + 1,
    monthName: name,
    episodes: 0,
    movies: 0,
    totalMinutes: 0,
  }));

  const heatmapGrid: Record<string, { count: number; minutes: number }> = {};
  const genreCounts = new Map<string, number>();
  const providerCounts = new Map<string, number>();

  let totalEpisodes = 0;
  let totalMovies = 0;
  let totalMinutes = 0;

  // Binge tracking - separate sessions and episodes
  const bingeSessionIds = new Set<string>();
  let bingeEpisodeCount = 0;
  const bingeSessionEpisodes = new Map<string, number>(); // Track episodes per session

  // Rewatch tracking
  let rewatchCount = 0;
  let rewatchMinutes = 0;

  // Runtime tracking
  const episodeRuntimes: number[] = [];
  let shortestEpisode = Infinity;
  let longestEpisode = 0;

  // Series tracking
  const seriesMap = new Map<
    number,
    {
      seriesId: number;
      title: string;
      episodes: number;
      minutes: number;
      runtimes: number[];
      rewatchEpisodes: number;
      bingeEpisodes: number;
      genres: Set<string>;
      provider?: string;
      firstWatched: string;
      lastWatched: string;
    }
  >();

  // Process events
  watchEvents.forEach((event) => {
    const monthIndex = event.month - 1;
    if (monthIndex < 0 || monthIndex > 11) return;

    const isEpisode = event.type === 'episode_watch';
    const runtime = isEpisode
      ? (event as EpisodeWatchEvent).episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES
      : (event as MovieWatchEvent).runtime || 120;

    // Activity
    if (isEpisode) {
      activityMonthly[monthIndex].episodes++;
      totalEpisodes++;
    } else {
      activityMonthly[monthIndex].movies++;
      totalMovies++;
    }
    activityMonthly[monthIndex].totalMinutes += runtime;
    totalMinutes += runtime;

    // Genres (normalize to merge duplicates like Comedy/Komödie)
    const rawGenres = (event.genres || []).filter(isValidGenre);
    const genres = [...new Set(rawGenres.map(normalizeGenre))];
    const runtimePerGenre = runtime / Math.max(genres.length, 1);
    genres.forEach((genre) => {
      genreMonthly[monthIndex].values[genre] =
        (genreMonthly[monthIndex].values[genre] || 0) + runtimePerGenre;
      genreMonthly[monthIndex].total += runtimePerGenre;
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + runtimePerGenre);
    });

    // Providers
    const providers = [
      ...new Set(event.providers || (event.provider ? [event.provider] : [])),
    ].filter(isValidProvider);
    providers.forEach((provider) => {
      providerMonthly[monthIndex].values[provider] =
        (providerMonthly[monthIndex].values[provider] || 0) + runtime;
      providerMonthly[monthIndex].total += runtime;
      providerCounts.set(provider, (providerCounts.get(provider) || 0) + runtime);
    });

    // Heatmap
    const heatmapKey = `${event.hour}-${event.dayOfWeek}`;
    if (!heatmapGrid[heatmapKey]) {
      heatmapGrid[heatmapKey] = { count: 0, minutes: 0 };
    }
    heatmapGrid[heatmapKey].count++;
    heatmapGrid[heatmapKey].minutes += runtime;

    // Binge detection - track sessions and episodes separately
    if (isEpisode && (event as EpisodeWatchEvent).isBingeSession) {
      bingeEpisodeCount++;
      const sessionId = (event as EpisodeWatchEvent).bingeSessionId;
      if (sessionId) {
        bingeSessionIds.add(sessionId);
        bingeSessionEpisodes.set(sessionId, (bingeSessionEpisodes.get(sessionId) || 0) + 1);
      }
    }

    // Rewatch tracking
    if (isEpisode && (event as EpisodeWatchEvent).isRewatch) {
      rewatchCount++;
      rewatchMinutes += runtime;
    }

    // Episode runtime tracking
    if (isEpisode) {
      const epRuntime =
        (event as EpisodeWatchEvent).episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;
      episodeRuntimes.push(epRuntime);
      if (epRuntime < shortestEpisode) shortestEpisode = epRuntime;
      if (epRuntime > longestEpisode) longestEpisode = epRuntime;

      // Series tracking
      const epEvent = event as EpisodeWatchEvent;
      const seriesId = epEvent.seriesId;

      const eventTimestamp = epEvent.timestamp;

      if (!seriesMap.has(seriesId)) {
        seriesMap.set(seriesId, {
          seriesId,
          title: epEvent.seriesTitle,
          episodes: 0,
          minutes: 0,
          runtimes: [],
          rewatchEpisodes: 0,
          bingeEpisodes: 0,
          genres: new Set<string>(),
          provider: epEvent.provider,
          firstWatched: eventTimestamp,
          lastWatched: eventTimestamp,
        });
      }

      const seriesData = seriesMap.get(seriesId);
      if (!seriesData) return;
      seriesData.episodes++;
      seriesData.minutes += epRuntime;
      seriesData.runtimes.push(epRuntime);

      // Update first/last watched dates
      if (eventTimestamp < seriesData.firstWatched) {
        seriesData.firstWatched = eventTimestamp;
      }
      if (eventTimestamp > seriesData.lastWatched) {
        seriesData.lastWatched = eventTimestamp;
      }

      if (epEvent.isRewatch) {
        seriesData.rewatchEpisodes++;
      }
      if (epEvent.isBingeSession) {
        seriesData.bingeEpisodes++;
      }

      // Add genres (normalized)
      (epEvent.genres || [])
        .filter(isValidGenre)
        .map(normalizeGenre)
        .forEach((g) => seriesData.genres.add(g));

      // Update provider if not set
      if (!seriesData.provider && epEvent.provider) {
        seriesData.provider = epEvent.provider;
      }
    }
  });

  // All genres sorted by watch time (no limit, no "Andere")
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);

  // All providers sorted by watch time (no artificial limit)
  const topProviders = Array.from(providerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([provider]) => provider);

  // Generate colors
  const genreColors: Record<string, string> = {};
  topGenres.forEach((genre, i) => {
    genreColors[genre] = genre === 'Andere' ? '#636e72' : getColor(genre, GENRE_COLORS, i);
  });

  const providerColors: Record<string, string> = {};
  topProviders.forEach((provider, i) => {
    providerColors[provider] = getColor(provider, PROVIDER_COLORS, i);
  });

  // Build heatmap array
  const heatmap: HeatmapData[] = [];
  let maxCount = 0;
  let maxMinutes = 0;
  let peakHour = 20;
  let peakDay = 0;

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${hour}-${day}`;
      const data = heatmapGrid[key] || { count: 0, minutes: 0 };
      heatmap.push({ hour, dayOfWeek: day, count: data.count, minutes: data.minutes });
      if (data.count > maxCount || (data.count === maxCount && data.minutes > maxMinutes)) {
        maxCount = data.count;
        maxMinutes = data.minutes;
        peakHour = hour;
        peakDay = day;
      }
    }
  }

  return {
    year,
    genreMonths: genreMonthly,
    topGenres,
    genreColors,
    providerMonths: providerMonthly,
    topProviders,
    providerColors,
    heatmap,
    peakHour,
    peakDay,
    activity: activityMonthly,
    totalEpisodes,
    totalMovies,
    totalMinutes,

    // Binge stats
    bingeSessionCount: bingeSessionIds.size,
    bingeEpisodeCount,
    avgBingeLength:
      bingeSessionIds.size > 0
        ? Math.round((bingeEpisodeCount / bingeSessionIds.size) * 10) / 10
        : 0,
    longestBinge:
      bingeSessionEpisodes.size > 0 ? Math.max(...Array.from(bingeSessionEpisodes.values())) : 0,

    // Rewatch stats
    rewatchCount,
    rewatchMinutes,
    rewatchPercentage: totalMinutes > 0 ? Math.round((rewatchMinutes / totalMinutes) * 100) : 0,

    // Runtime stats
    avgEpisodeRuntime:
      episodeRuntimes.length > 0
        ? Math.round(episodeRuntimes.reduce((a, b) => a + b, 0) / episodeRuntimes.length)
        : 0,
    shortestEpisode: shortestEpisode === Infinity ? 0 : shortestEpisode,
    longestEpisode,

    // Series stats
    seriesStats: Array.from(seriesMap.values())
      .map((s) => ({
        seriesId: s.seriesId,
        title: s.title,
        episodes: s.episodes,
        minutes: s.minutes,
        avgRuntime:
          s.runtimes.length > 0
            ? Math.round(s.runtimes.reduce((a, b) => a + b, 0) / s.runtimes.length)
            : 0,
        rewatchEpisodes: s.rewatchEpisodes,
        bingeEpisodes: s.bingeEpisodes,
        genres: Array.from(s.genres),
        provider: s.provider,
        firstWatched: s.firstWatched,
        lastWatched: s.lastWatched,
      }))
      .sort((a, b) => b.episodes - a.episodes),
    uniqueSeriesCount: seriesMap.size,
    avgEpisodesPerSeries:
      seriesMap.size > 0 ? Math.round((totalEpisodes / seriesMap.size) * 10) / 10 : 0,
    mostBingedSeries: (() => {
      let maxBinge = { title: '', bingeEpisodes: 0 };
      seriesMap.forEach((s) => {
        if (s.bingeEpisodes > maxBinge.bingeEpisodes) {
          maxBinge = { title: s.title, bingeEpisodes: s.bingeEpisodes };
        }
      });
      return maxBinge.bingeEpisodes > 0 ? maxBinge : undefined;
    })(),
  };
}

// ============================================================================
// HELPER - Normalize data for stacked charts (0-100%)
// ============================================================================

export function normalizeMonthlyData(months: MonthlyData[], keys: string[]): MonthlyData[] {
  return months.map((month) => {
    const normalized: Record<string, number> = {};
    if (month.total > 0) {
      keys.forEach((key) => {
        normalized[key] = ((month.values[key] || 0) / month.total) * 100;
      });
    } else {
      keys.forEach((key) => {
        normalized[key] = 0;
      });
    }
    return { ...month, values: normalized, total: 100 };
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  calculateWatchJourney,
  calculateMultiYearTrends,
  normalizeMonthlyData,
  DAY_NAMES,
  MONTH_NAMES,
};
