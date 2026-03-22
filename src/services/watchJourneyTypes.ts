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

export const MONTH_NAMES = [
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

export const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const GENRE_COLORS: Record<string, string> = {
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

export const PROVIDER_COLORS: Record<string, string> = {
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

export const FALLBACK_COLORS = [
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

export function isValidGenre(genre: string): boolean {
  if (!genre || typeof genre !== 'string') return false;
  const invalid = ['all', 'alle', 'unknown', 'other', 'sonstige', ''];
  return !invalid.includes(genre.toLowerCase().trim());
}

export function isValidProvider(provider: string): boolean {
  if (!provider || typeof provider !== 'string') return false;
  return provider.trim().length > 0;
}

export function getColor(name: string, colorMap: Record<string, string>, index: number): string {
  return colorMap[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export type WatchEvent = EpisodeWatchEvent | MovieWatchEvent;
