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
  Komödie: '#ff9800',
  Comedy: '#ff9800',
  Drama: '#42a5f5',
  'Sci-Fi & Fantasy': '#26c6da',
  'Science Fiction': '#26c6da',
  'Action & Adventure': '#ef5350',
  Action: '#ef5350',
  Animation: '#ab47bc',
  Mystery: '#ffee58',
  Crime: '#8d6e63',
  Krimi: '#8d6e63',
  Reality: '#66bb6a',
  Horror: '#b71c1c',
  Romance: '#ec407a',
  Documentary: '#26a69a',
  Thriller: '#5c6bc0',
  Fantasy: '#00bfa5',
  Family: '#66bb6a',
  Adventure: '#29b6f6',
  Western: '#a1887f',
  War: '#78909c',
  'War & Politics': '#78909c',
  Politik: '#78909c',
  Music: '#ab47bc',
  History: '#ffb74d',
  News: '#90a4ae',
  Talk: '#bcaaa4',
  Kids: '#aed581',
  Soap: '#ef6c00',
  Andere: '#607d8b',
};

export const PROVIDER_COLORS: Record<string, string> = {
  Netflix: '#e50914',
  'Amazon Prime Video': '#00a8e1',
  'Prime Video': '#00a8e1',
  'Disney Plus': '#113ccf',
  'Disney+': '#113ccf',
  'Apple TV+': '#a2aaad',
  'Apple TV Plus': '#a2aaad',
  Crunchyroll: '#f47521',
  WOW: '#5b2d8e',
  'Paramount+': '#0064ff',
  'Paramount Plus': '#0064ff',
  'ARD Mediathek': '#004b93',
  'ZDF Mediathek': '#ff7900',
  'RTL+': '#d42029',
  Joyn: '#11cccc',
  MagentaTV: '#e20074',
  Sky: '#333333',
  MUBI: '#00a650',
  'HBO Max': '#b428db',
  Max: '#002be7',
  Peacock: '#1a8c5e',
  Hulu: '#1ce783',
  'Animation Digital Network': '#0096ff',
  ADN: '#0096ff',
  default: '#78909c',
};

export const FALLBACK_COLORS = [
  '#ff8c00',
  '#1e88e5',
  '#00bfa5',
  '#ff1744',
  '#d500f9',
  '#fdd835',
  '#ff6e40',
  '#8d6e63',
  '#ec407a',
  '#5c6bc0',
  '#66bb6a',
  '#29b6f6',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Merge German/English genre names to a single canonical name
const GENRE_ALIASES: Record<string, string> = {
  Comedy: 'Komödie',
  Crime: 'Krimi',
  'Science Fiction': 'Sci-Fi & Fantasy',
  Fantasy: 'Sci-Fi & Fantasy',
  'War & Politics': 'War & Politics',
  War: 'War & Politics',
  Politik: 'War & Politics',
};

export function normalizeGenre(genre: string): string {
  return GENRE_ALIASES[genre] || genre;
}

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
