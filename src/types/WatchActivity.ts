/**
 * Wrapped 2026 - Umfassende Datensammlung für Jahresrückblick
 *
 * Dieses Modul definiert alle Typen für die detaillierte Erfassung
 * des Sehverhaltens, um am Ende des Jahres einen "Wrapped"-Rückblick
 * zu generieren.
 */

// Basis-Interface für alle Watch-Events
export interface WatchEvent {
  timestamp: string; // ISO-Datum

  // Zeitliche Metadaten für Auswertungen
  month: number; // 1-12
  dayOfWeek: number; // 0-6 (So-Sa)
  hour: number; // 0-23

  // Gerät/Kontext (optional)
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

// Episode-spezifisches Watch-Event
export interface EpisodeWatchEvent extends WatchEvent {
  type: 'episode_watch';

  // Serien-Referenz
  seriesId: number;
  seriesTitle: string;

  // Episode-Details
  seasonNumber: number;
  episodeNumber: number;
  episodeRuntime?: number; // Minuten

  // Genres für Genre-Statistiken
  genres?: string[];

  // Streaming-Dienst
  provider?: string; // z.B. "Netflix", "Disney+"
  providers?: string[]; // Alle Provider (für Wrapped-Statistiken)

  // Watch-Kontext
  isRewatch: boolean;

  // Binge-Detection
  isBingeSession?: boolean; // < 30min seit letzter Episode
  bingeSessionId?: string; // Gruppiert Binge-Sessions
}

// Film Watch-Event
export interface MovieWatchEvent extends WatchEvent {
  type: 'movie_watch' | 'movie_rating';

  movieId: number;
  movieTitle: string;

  runtime?: number; // Minuten
  rating?: number; // 0-10

  // Genres für Genre-Statistiken
  genres?: string[];

  // Streaming-Dienst
  provider?: string; // z.B. "Netflix", "Amazon Prime" (Hauptprovider für Abwärtskompatibilität)
  providers?: string[]; // Alle Provider (für Wrapped-Statistiken)
}

// Union Type für alle Events
export type ActivityEvent = EpisodeWatchEvent | MovieWatchEvent;

// Tägliche Zusammenfassung (für effiziente Wrapped-Berechnung)
export interface DailySummary {
  date: string; // YYYY-MM-DD

  episodesWatched: number;
  moviesWatched: number;
  totalMinutes: number;

  // Serien des Tages
  seriesWatched: {
    seriesId: number;
    title: string;
    episodeCount: number;
  }[];

  // Genre-Verteilung des Tages
  genreMinutes: Record<string, number>;

  // Binge-Sessions
  bingeSessions: number;
  longestBingeEpisodes: number;

  // Zeitliche Verteilung
  hourlyDistribution: Record<number, number>; // Stunde -> Minuten
}

// Wöchentliche Zusammenfassung
export interface WeeklySummary {
  year: number;
  week: number;
  startDate: string;
  endDate: string;

  episodesWatched: number;
  moviesWatched: number;
  totalMinutes: number;

  topSeries: { id: number; title: string; episodes: number }[];
  topGenres: { genre: string; minutes: number }[];

  streakDays: number; // Wie viele Tage am Stück geschaut
  mostActiveDay: string; // Wochentag
}

// Monatliche Zusammenfassung
export interface MonthlySummary {
  year: number;
  month: number;

  episodesWatched: number;
  moviesWatched: number;
  totalMinutes: number;

  newSeriesStarted: number;
  seriesCompleted: number;
  moviesRated: number;

  topSeries: { id: number; title: string; episodes: number; minutes: number }[];
  topGenres: { genre: string; minutes: number; percentage: number }[];

  averagePerDay: number;
  mostActiveWeek: number;
  longestStreak: number;
}

// Jahres-Wrapped Daten
export interface YearlyWrapped {
  year: number;
  generatedAt: string;

  // Hauptstatistiken
  totalMinutesWatched: number;
  totalEpisodesWatched: number;
  totalMoviesWatched: number;
  totalDaysActive: number;

  // Zeit-Formate für Display
  timeBreakdown: {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
  };

  // Top Content
  topSeries: {
    id: number;
    title: string;
    poster?: string;
    episodes: number;
    minutes: number;
    rating?: number;
  }[];

  topMovies: {
    id: number;
    title: string;
    poster?: string;
    rating: number;
  }[];

  // Genres
  topGenres: {
    genre: string;
    minutes: number;
    percentage: number;
    itemCount: number;
  }[];

  // Streaming-Dienste
  topProviders: {
    name: string;
    logo?: string;
    itemCount: number;
    minutes: number;
  }[];

  // Zeitliche Analyse
  busiestMonth: {
    month: number;
    name: string;
    minutes: number;
    episodes: number;
  };

  busiestDayOfWeek: {
    day: number;
    name: string;
    averageMinutes: number;
  };

  busiestHour: {
    hour: number;
    label: string; // "20:00 - 21:00"
    totalMinutes: number;
  };

  // Binge-Statistiken
  bingeStats: {
    totalBingeSessions: number;
    longestBinge: {
      date: string;
      seriesTitle: string;
      episodeCount: number;
      duration: number;
    };
    averageBingeLength: number;
  };

  // Streaks
  streakStats: {
    longestStreak: number; // Tage am Stück
    longestStreakStart: string;
    longestStreakEnd: string;
    currentStreak: number;
    totalStreakDays: number;
  };

  // Meilensteine
  milestones: {
    type: string;
    title: string;
    description: string;
    date: string;
    icon: string;
  }[];

  // Erste und letzte Episoden des Jahres
  firstEpisode: {
    seriesTitle: string;
    episodeTitle: string;
    date: string;
  };

  lastEpisode: {
    seriesTitle: string;
    episodeTitle: string;
    date: string;
  };

  // Vergleich zum Vorjahr (optional)
  comparison?: {
    previousYear: number;
    minutesDiff: number;
    percentageChange: number;
    moreOrLess: 'more' | 'less' | 'same';
  };

  // Fun Facts
  funFacts: {
    id: string;
    text: string;
    value?: string | number;
  }[];
}

// Binge-Session Tracking
export interface BingeSession {
  id: string;
  startedAt: string;
  endedAt?: string;

  seriesId: number;
  seriesTitle: string;

  episodes: {
    seasonNumber: number;
    episodeNumber: number;
    watchedAt: string;
  }[];

  totalMinutes: number;
  isActive: boolean;
}

// Streak Tracking
export interface WatchStreak {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string;

  // Streak-Historie
  streaks: {
    startDate: string;
    endDate: string;
    length: number;
  }[];

  // Streak Shield
  lastShieldUsedDate?: string;
  shieldUsedCount?: number;
}

// Erweiterte Episode-Daten (für Types/Series.ts Integration)
export interface EnhancedEpisodeData {
  // Bestehende Felder
  watched: boolean;
  watchCount?: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;

  // Neue Wrapped-Felder
  watchHistory?: {
    timestamp: string;
    deviceType?: string;
    bingeSessionId?: string;
  }[];
}

// Erweiterte Movie-Daten (für Types/Movie.ts Integration)
export interface EnhancedMovieData {
  // Neue Wrapped-Felder
  addedAt?: string;
  watchedAt?: string;
  ratedAt?: string;

  // Watch-Historie für Rewatches
  watchHistory?: {
    timestamp: string;
    rating?: number;
  }[];
}

// Firebase-Struktur für Activity-Log
export interface FirebaseActivityLog {
  // /users/{uid}/activityLog/{year}/{eventId}
  [eventId: string]: ActivityEvent;
}

// Firebase-Struktur für Summaries
export interface FirebaseSummaries {
  // /users/{uid}/wrappedData/{year}/
  daily: Record<string, DailySummary>; // YYYY-MM-DD -> Summary
  weekly: Record<string, WeeklySummary>; // YYYY-WW -> Summary
  monthly: Record<string, MonthlySummary>; // YYYY-MM -> Summary
  yearly?: YearlyWrapped;
}
