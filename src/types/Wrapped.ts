/**
 * Wrapped Types - Wiederverwendbare Typen für den Jahresrückblick
 *
 * Diese Typen sind Jahr-agnostisch und können jedes Jahr recycelt werden.
 */

// ========================================
// Basis-Statistiken
// ========================================

export interface WrappedStats {
  year: number;

  // Grundlegende Zahlen
  totalEpisodesWatched: number;
  totalMoviesWatched: number;
  totalMinutesWatched: number;
  totalHoursWatched: number;
  totalDaysEquivalent: number; // Umgerechnet in Tage (z.B. "3.5 Tage")

  // Serien-Statistiken
  uniqueSeriesWatched: number;

  // Top-Listen
  topSeries: TopSeriesEntry[];
  topMovies: TopMovieEntry[];
  topGenres: TopGenreEntry[];
  topProviders: TopProviderEntry[];

  // Zeitliche Muster
  mostActiveMonth: MonthStats;
  mostActiveDay: DayStats;
  favoriteTimeOfDay: TimeOfDayStats;
  favoriteDayOfWeek: DayOfWeekStats;
  monthlyBreakdown: MonthStats[];

  // Binge-Statistiken
  totalBingeSessions: number;
  longestBingeSession: BingeSessionStats | null;
  averageBingeLength: number;

  // Streak-Statistiken
  longestStreak: number;
  currentStreak: number;

  // Geräte-Statistiken
  deviceBreakdown: DeviceBreakdown;

  // Achievements/Highlights
  achievements: WrappedAchievement[];

  // Zusätzliche Fun Facts
  funFacts: FunFact[];

  // NEUE STATS
  // Erstes & Letztes des Jahres
  firstWatch: FirstLastWatch | null;
  lastWatch: FirstLastWatch | null;

  // Late Night Stats
  lateNightStats: LateNightStats;

  // Heatmap Daten (Stunde x Wochentag)
  heatmapData: number[][]; // [dayOfWeek][hour] = count
}

// ========================================
// Top-Listen Einträge
// ========================================

export interface TopSeriesEntry {
  id: number;
  title: string;
  poster?: string;
  episodesWatched: number;
  minutesWatched: number;
  genres?: string[];
}

export interface TopMovieEntry {
  id: number;
  title: string;
  poster?: string;
  rating?: number;
  minutesWatched: number;
  genres?: string[];
}

export interface TopGenreEntry {
  genre: string;
  count: number;
  percentage: number;
  minutesWatched: number;
}

export interface TopProviderEntry {
  name: string;
  logo?: string;
  episodeCount: number;
  movieCount: number;
  totalCount: number;
  minutesWatched: number;
  percentage: number;
}

// ========================================
// Zeitliche Statistiken
// ========================================

export interface MonthStats {
  month: number; // 1-12
  monthName: string;
  episodesWatched: number;
  moviesWatched: number;
  minutesWatched: number;
}

export interface DayStats {
  date: string;
  dayName: string;
  episodesWatched: number;
  moviesWatched: number;
  minutesWatched: number;
}

export interface TimeOfDayStats {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  label: string;
  count: number;
  percentage: number;
}

export interface DayOfWeekStats {
  dayOfWeek: number; // 0-6 (Sonntag-Samstag)
  dayName: string;
  count: number;
  percentage: number;
}

// ========================================
// Binge-Statistiken
// ========================================

export interface BingeSessionStats {
  seriesId: number;
  seriesTitle: string;
  episodeCount: number;
  totalMinutes: number;
  date: string;
}

// ========================================
// Geräte-Statistiken
// ========================================

export interface DeviceBreakdown {
  mobile: { count: number; percentage: number };
  desktop: { count: number; percentage: number };
  tablet: { count: number; percentage: number };
}

// ========================================
// First/Last Watch
// ========================================

export interface FirstLastWatch {
  type: 'episode' | 'movie';
  title: string; // Serie oder Film Name
  subtitle?: string; // z.B. "S1 E1" für Episoden
  date: string;
  timestamp: string;
  poster?: string;
  id: number;
}

// ========================================
// Late Night Stats
// ========================================

export interface LateNightStats {
  totalLateNightWatches: number; // Nach 22 Uhr
  midnightWatches: number; // Nach Mitternacht (0-4 Uhr)
  latestWatch: { time: string; title: string } | null;
  percentage: number; // % aller Views nach 22 Uhr
}

// ========================================
// Achievements
// ========================================

export interface WrappedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji oder Icon-Name
  unlocked: boolean;
  value?: number | string; // Optionaler Wert (z.B. "50" für "50 Episoden")
}

// Standard-Achievements die jedes Jahr verfügbar sind
// icon values are icon identifiers, not emojis
export const WRAPPED_ACHIEVEMENTS: Omit<WrappedAchievement, 'unlocked' | 'value'>[] = [
  { id: 'night_owl', title: 'Nachteule', description: 'Mehr als 30% nachts geschaut', icon: 'moon' },
  { id: 'early_bird', title: 'Frühaufsteher', description: 'Mehr als 30% morgens geschaut', icon: 'sunrise' },
  { id: 'binge_king', title: 'Binge-König', description: '10+ Episoden am Stück', icon: 'crown' },
  { id: 'movie_lover', title: 'Cineast', description: '20+ Filme geschaut', icon: 'film' },
  { id: 'series_addict', title: 'Serien-Junkie', description: '500+ Episoden geschaut', icon: 'tv' },
  { id: 'genre_explorer', title: 'Genre-Entdecker', description: '5+ verschiedene Genres', icon: 'compass' },
  { id: 'weekend_warrior', title: 'Wochenend-Krieger', description: '50%+ am Wochenende', icon: 'sword' },
  { id: 'consistent', title: 'Beständig', description: '30+ Tage Streak', icon: 'flame' },
  { id: 'marathon_runner', title: 'Marathon-Läufer', description: '100+ Stunden geschaut', icon: 'runner' },
  { id: 'completionist', title: 'Abschließer', description: '5+ Serien abgeschlossen', icon: 'check' },
];

// ========================================
// Fun Facts
// ========================================

export interface FunFact {
  id: string;
  text: string;
  icon?: string;
}

// ========================================
// Slide-Konfiguration
// ========================================

export type WrappedSlideType =
  | 'intro'
  | 'total_time'
  | 'top_series'
  | 'top_movies'
  | 'top_genres'
  | 'top_providers'
  | 'time_pattern'
  | 'binge_stats'
  | 'achievements'
  | 'monthly_breakdown'
  | 'device_stats'
  | 'fun_facts'
  | 'summary'
  | 'first_last'
  | 'record_day'
  | 'late_night'
  | 'heatmap';

export interface WrappedSlideConfig {
  type: WrappedSlideType;
  title: string;
  enabled: boolean;
  order: number;
}

// Standard-Slide-Konfiguration
export const DEFAULT_SLIDE_CONFIG: WrappedSlideConfig[] = [
  { type: 'intro', title: 'Intro', enabled: true, order: 0 },
  { type: 'total_time', title: 'Gesamtzeit', enabled: true, order: 1 },
  { type: 'first_last', title: 'Erstes & Letztes', enabled: true, order: 2 },
  { type: 'top_series', title: 'Top Serien', enabled: true, order: 3 },
  { type: 'top_movies', title: 'Top Filme', enabled: true, order: 4 },
  { type: 'top_genres', title: 'Top Genres', enabled: true, order: 5 },
  { type: 'top_providers', title: 'Streaming-Dienste', enabled: true, order: 6 },
  { type: 'record_day', title: 'Rekord-Tag', enabled: true, order: 7 },
  { type: 'time_pattern', title: 'Zeitmuster', enabled: true, order: 8 },
  { type: 'late_night', title: 'Nachtschwärmer', enabled: true, order: 9 },
  { type: 'heatmap', title: 'Deine Watch-Zeiten', enabled: true, order: 10 },
  { type: 'binge_stats', title: 'Binge-Statistiken', enabled: true, order: 11 },
  { type: 'monthly_breakdown', title: 'Monatsübersicht', enabled: true, order: 12 },
  { type: 'achievements', title: 'Achievements', enabled: true, order: 13 },
  { type: 'summary', title: 'Zusammenfassung', enabled: true, order: 14 },
];

// ========================================
// Hilfsfunktionen für Labels
// ========================================

export const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export const DAY_NAMES = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'
];

export const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: 'Morgens (6-12 Uhr)',
  afternoon: 'Nachmittags (12-18 Uhr)',
  evening: 'Abends (18-22 Uhr)',
  night: 'Nachts (22-6 Uhr)',
};
