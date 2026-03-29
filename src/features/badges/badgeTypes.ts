export interface BadgeEpisode {
  watched: boolean;
  watchCount?: number;
  watchedAt?: number;
  air_date?: string;
}

export interface BadgeSeason {
  episodes: BadgeEpisode[];
  seasonNumber: number;
}

export interface BadgeSeriesItem {
  seasons?: BadgeSeason[];
  rating?: number | Record<string, number>;
}

export interface BadgeMovieItem {
  rating?: number | Record<string, number>;
}

export interface BingeWindow {
  count?: number;
  windowEnd?: number;
}

export interface BadgeCounters {
  currentStreak?: number;
  quickwatchEpisodes?: number;
  maxBingeEpisodes?: number;
  marathonWeeks?: Record<string, number>;
  bingeWindows?: Record<string, BingeWindow>;
  [key: string]: unknown;
}

export interface BadgeUserData {
  series: BadgeSeriesItem[];
  movies: BadgeMovieItem[];
  activities: unknown[];
  badgeCounters: BadgeCounters;
}
