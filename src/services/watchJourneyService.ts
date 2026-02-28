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
import { EpisodeWatchEvent, MovieWatchEvent } from '../types/WatchActivity';

// ============================================================================
// TYPES
// ============================================================================

export interface MonthlyData {
  month: number;
  monthName: string;
  values: Record<string, number>;
  total: number;
}

export interface HeatmapData {
  hour: number;
  dayOfWeek: number;
  count: number;
  minutes: number;
}

export interface ActivityData {
  month: number;
  monthName: string;
  episodes: number;
  movies: number;
  totalMinutes: number;
}

export interface WatchJourneyData {
  year: number;

  // Genre Journey
  genreMonths: MonthlyData[];
  topGenres: string[];
  genreColors: Record<string, string>;

  // Provider Journey
  providerMonths: MonthlyData[];
  topProviders: string[];
  providerColors: Record<string, string>;

  // Heatmap (7 days x 24 hours)
  heatmap: HeatmapData[];
  peakHour: number;
  peakDay: number;

  // Activity Timeline
  activity: ActivityData[];
  totalEpisodes: number;
  totalMovies: number;
  totalMinutes: number;

  // Binge Stats
  bingeSessionCount: number; // Anzahl der Binge-Sessions
  bingeEpisodeCount: number; // Episoden in Binge-Sessions
  avgBingeLength: number; // Ø Episoden pro Binge-Session
  longestBinge: number; // Längste Binge-Session (Episoden)

  // Rewatch Stats
  rewatchCount: number;
  rewatchMinutes: number;
  rewatchPercentage: number;

  // Runtime Stats
  avgEpisodeRuntime: number;
  shortestEpisode: number;
  longestEpisode: number;

  // Series Stats
  seriesStats: {
    seriesId: number;
    title: string;
    episodes: number;
    minutes: number;
    avgRuntime: number;
    rewatchEpisodes: number;
    bingeEpisodes: number;
    genres: string[];
    provider?: string;
    firstWatched: string; // ISO date
    lastWatched: string; // ISO date
  }[];
  uniqueSeriesCount: number;
  avgEpisodesPerSeries: number;
  mostBingedSeries?: {
    title: string;
    bingeEpisodes: number;
  };
}

// Multi-Year Trends Data
export interface YearlyTrendData {
  year: number;
  episodes: number;
  movies: number;
  totalMinutes: number;
  totalHours: number;
  topGenre: string;
  topProvider: string;
  genreDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
}

export interface MultiYearTrendsData {
  years: number[];
  yearlyData: YearlyTrendData[];

  // Aggregated top items across all years
  allTimeTopGenres: { genre: string; hours: number; color: string }[];
  allTimeTopProviders: { provider: string; hours: number; color: string }[];

  // Trend indicators
  episodesTrend: 'up' | 'down' | 'stable';
  hoursTrend: 'up' | 'down' | 'stable';

  // Totals
  totalEpisodes: number;
  totalMovies: number;
  totalHours: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
];

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const GENRE_COLORS: Record<string, string> = {
  Drama: '#667eea',
  Comedy: '#f5af19',
  Action: '#e94560',
  'Action & Adventure': '#e94560',
  Thriller: '#764ba2',
  'Sci-Fi & Fantasy': '#00cec9',
  'Science Fiction': '#00cec9',
  Horror: '#d63031',
  Romance: '#ff6b9d',
  Crime: '#636e72',
  Documentary: '#00b894',
  Animation: '#fdcb6e',
  Family: '#74b9ff',
  Mystery: '#a29bfe',
  Fantasy: '#81ecec',
  Adventure: '#fab1a0',
  Kids: '#55efc4',
  Reality: '#ffeaa7',
};

const PROVIDER_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  'Disney Plus': '#113CCF',
  'Disney+': '#113CCF',
  'Amazon Prime Video': '#00A8E1',
  'Prime Video': '#00A8E1',
  'Apple TV+': '#000000',
  'Apple TV Plus': '#000000',
  'HBO Max': '#B428DB',
  Max: '#002BE7',
  'Paramount+': '#0064FF',
  'Paramount Plus': '#0064FF',
  Peacock: '#000000',
  Hulu: '#1CE783',
  Crunchyroll: '#F47521',
  Sky: '#0072CE',
  WOW: '#6B3FA0',
  'RTL+': '#E3000F',
  Joyn: '#1E1E1E',
  MagentaTV: '#E20074',
  'ARD Mediathek': '#003D7F',
  'ZDF Mediathek': '#FF6600',
  'Animation Digital Network': '#0096FF',
  ADN: '#0096FF',
};

const FALLBACK_COLORS = [
  '#667eea',
  '#f093fb',
  '#00cec9',
  '#fdcb6e',
  '#e94560',
  '#764ba2',
  '#00b894',
  '#74b9ff',
  '#a29bfe',
  '#fab1a0',
  '#ff6b9d',
  '#81ecec',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isValidGenre(genre: string): boolean {
  if (!genre || typeof genre !== 'string') return false;
  const invalid = ['all', 'alle', 'unknown', 'other', 'sonstige', ''];
  return !invalid.includes(genre.toLowerCase().trim());
}

function isValidProvider(provider: string): boolean {
  if (!provider || typeof provider !== 'string') return false;
  return provider.trim().length > 0;
}

function getColor(name: string, colorMap: Record<string, string>, index: number): string {
  return colorMap[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

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
      ? (event as EpisodeWatchEvent).episodeRuntime || 45
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

    // Genres
    const genres = (event.genres || []).filter(isValidGenre);
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
      const epRuntime = (event as EpisodeWatchEvent).episodeRuntime || 45;
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

      const seriesData = seriesMap.get(seriesId)!;
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

      // Add genres
      (epEvent.genres || []).filter(isValidGenre).forEach((g) => seriesData.genres.add(g));

      // Update provider if not set
      if (!seriesData.provider && epEvent.provider) {
        seriesData.provider = epEvent.provider;
      }
    }
  });

  // Top genres (limit to 6)
  const sortedGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);
  const topGenres = sortedGenres.slice(0, 6);

  // Consolidate other genres
  const otherGenres = sortedGenres.slice(6);
  if (otherGenres.length > 0) {
    genreMonthly.forEach((month) => {
      let otherTotal = 0;
      otherGenres.forEach((genre) => {
        if (month.values[genre]) {
          otherTotal += month.values[genre];
          delete month.values[genre];
        }
      });
      if (otherTotal > 0) month.values['Andere'] = otherTotal;
    });
    if (genreMonthly.some((m) => m.values['Andere'] > 0)) {
      topGenres.push('Andere');
    }
  }

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
  let peakHour = 20;
  let peakDay = 0;

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${hour}-${day}`;
      const data = heatmapGrid[key] || { count: 0, minutes: 0 };
      heatmap.push({ hour, dayOfWeek: day, count: data.count, minutes: data.minutes });
      if (data.count > maxCount) {
        maxCount = data.count;
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
// MULTI-YEAR TRENDS CALCULATION
// ============================================================================

export async function calculateMultiYearTrends(
  userId: string,
  years: number[]
): Promise<MultiYearTrendsData> {
  // Fetch data for all years in parallel
  const yearDataPromises = years.map((year) => calculateWatchJourney(userId, year));
  const allYearData = await Promise.all(yearDataPromises);

  // Process each year
  const yearlyData: YearlyTrendData[] = allYearData.map((data) => {
    // Calculate genre distribution (hours)
    const genreDistribution: Record<string, number> = {};
    data.genreMonths.forEach((month) => {
      Object.entries(month.values).forEach(([genre, mins]) => {
        genreDistribution[genre] = (genreDistribution[genre] || 0) + mins / 60;
      });
    });

    // Calculate provider distribution (hours)
    const providerDistribution: Record<string, number> = {};
    data.providerMonths.forEach((month) => {
      Object.entries(month.values).forEach(([provider, mins]) => {
        providerDistribution[provider] = (providerDistribution[provider] || 0) + mins / 60;
      });
    });

    // Find top genre
    const topGenre =
      Object.entries(genreDistribution)
        .filter(([genre]) => genre !== 'Andere')
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Find top provider
    const topProvider =
      Object.entries(providerDistribution)
        .filter(([provider]) => provider !== 'Andere')
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return {
      year: data.year,
      episodes: data.totalEpisodes,
      movies: data.totalMovies,
      totalMinutes: data.totalMinutes,
      totalHours: Math.round(data.totalMinutes / 60),
      topGenre,
      topProvider,
      genreDistribution,
      providerDistribution,
    };
  });

  // Sort by year
  yearlyData.sort((a, b) => a.year - b.year);

  // Aggregate all-time top genres
  const allGenres: Record<string, number> = {};
  yearlyData.forEach((yd) => {
    Object.entries(yd.genreDistribution).forEach(([genre, hours]) => {
      if (genre !== 'Andere') {
        allGenres[genre] = (allGenres[genre] || 0) + hours;
      }
    });
  });
  const allTimeTopGenres = Object.entries(allGenres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, hours], i) => ({
      genre,
      hours: Math.round(hours),
      color: getColor(genre, GENRE_COLORS, i),
    }));

  // Aggregate all-time top providers
  const allProviders: Record<string, number> = {};
  yearlyData.forEach((yd) => {
    Object.entries(yd.providerDistribution).forEach(([provider, hours]) => {
      if (provider !== 'Andere') {
        allProviders[provider] = (allProviders[provider] || 0) + hours;
      }
    });
  });
  const allTimeTopProviders = Object.entries(allProviders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([provider, hours], i) => ({
      provider,
      hours: Math.round(hours),
      color: getColor(provider, PROVIDER_COLORS, i),
    }));

  // Calculate trends (compare last two years if available)
  let episodesTrend: 'up' | 'down' | 'stable' = 'stable';
  let hoursTrend: 'up' | 'down' | 'stable' = 'stable';

  if (yearlyData.length >= 2) {
    const lastYear = yearlyData[yearlyData.length - 1];
    const prevYear = yearlyData[yearlyData.length - 2];

    if (lastYear.episodes > prevYear.episodes * 1.1) episodesTrend = 'up';
    else if (lastYear.episodes < prevYear.episodes * 0.9) episodesTrend = 'down';

    if (lastYear.totalHours > prevYear.totalHours * 1.1) hoursTrend = 'up';
    else if (lastYear.totalHours < prevYear.totalHours * 0.9) hoursTrend = 'down';
  }

  // Totals
  const totalEpisodes = yearlyData.reduce((sum, yd) => sum + yd.episodes, 0);
  const totalMovies = yearlyData.reduce((sum, yd) => sum + yd.movies, 0);
  const totalHours = yearlyData.reduce((sum, yd) => sum + yd.totalHours, 0);

  return {
    years: yearlyData.map((yd) => yd.year),
    yearlyData,
    allTimeTopGenres,
    allTimeTopProviders,
    episodesTrend,
    hoursTrend,
    totalEpisodes,
    totalMovies,
    totalHours,
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

export { DAY_NAMES, MONTH_NAMES };

export default {
  calculateWatchJourney,
  calculateMultiYearTrends,
  normalizeMonthlyData,
  DAY_NAMES,
  MONTH_NAMES,
};
