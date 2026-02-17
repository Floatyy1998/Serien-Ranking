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
}
