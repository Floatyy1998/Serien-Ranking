export interface LeaderboardStats {
  episodesThisMonth: number;
  moviesThisMonth: number;
  watchtimeThisMonth: number; // Minuten
  streakThisMonth: number; // Längste Streak diesen Monat (Tage)
  streakAllTime: number; // Längste Streak aller Zeiten (Tage)
  streakCurrent: number; // Aktuelle laufende Streak (Hilfswert)
  lastStreakDate: string; // "YYYY-MM-DD" - letzter Tag mit Watch-Event
  lastUpdated: number;
  monthKey: string; // "YYYY-MM"
}

/** Veroeffentlichter Gesamt-Schnappschuss unter `users/$uid/leaderboard/totals`.
 *  Anders als die Monatswerte zaehlt er die ganze Bibliothek inklusive
 *  nachgetragener Folgen — er muss zur Zahl auf der Statistik-Seite passen. */
export interface LeaderboardTotals {
  watchtimeMinutes: number;
  episodes: number;
  seriesStarted: number;
  seriesCompleted: number;
  movies: number;
  updatedAt: number;
  /** Schema-Version, damit eine spaetere Neuberechnung erzwungen werden kann. */
  v: number;
}

export type TotalsCategory =
  'watchtimeMinutes' | 'seriesStarted' | 'movies' | 'episodes' | 'streakAllTime';

/** Zeitraum der Rangliste. Der Monat ist der Wettbewerb (mit Bulk-Schutz),
 *  die Gesamtwertung nur ein Vergleich ueber die ganze Bibliothek. */
export type RankingPeriod = 'month' | 'total';

export type LeaderboardCategory =
  | 'episodesThisMonth'
  | 'moviesThisMonth'
  | 'watchtimeThisMonth'
  | 'streakThisMonth'
  | 'streakAllTime';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  username?: string;
  value: number;
  rank: number;
  isCurrentUser: boolean;
  /** Zusatzzahl unter dem Namen (Gesamtwertung: „davon X komplett"). */
  detail?: number;
}

export type RankingCategory = LeaderboardCategory | TotalsCategory;

export interface GlobalLeaderboardEntry {
  uid: string;
  episodesThisMonth: number;
  moviesThisMonth: number;
  watchtimeThisMonth: number;
  streakThisMonth: number;
  streakAllTime: number;
  displayName: string;
  photoURL?: string;
  username?: string;
  lastUpdated: number;
}

export interface TrophyEntry {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
}

export interface MonthlyTrophy {
  monthKey: string;
  category: string;
  first: TrophyEntry | null;
  second: TrophyEntry | null;
  third: TrophyEntry | null;
}
