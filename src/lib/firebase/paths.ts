/**
 * Firebase Pfad-Konstanten und Pfad-Funktionen
 *
 * Zentralisiert alle Firebase-Datenbankpfade, die in der App verwendet werden.
 * Alle Pfade als typisierte Funktionen, um Schreibfehler zu vermeiden.
 */

// ============================================================================
// USER DATA PATHS
// ============================================================================

export const FIREBASE_PATHS = {
  // Serien & Filme
  userSeries: (uid: string) => `${uid}/serien` as const,
  userSeriesEntry: (uid: string, seriesId: number) => `${uid}/serien/${seriesId}` as const,
  userMovies: (uid: string) => `${uid}/filme` as const,
  userMovieEntry: (uid: string, movieId: number) => `${uid}/filme/${movieId}` as const,

  // Episode-Level Pfade
  seriesSeasons: (uid: string, seriesId: number) => `${uid}/serien/${seriesId}/seasons` as const,
  seriesEpisode: (uid: string, seriesId: number, seasonIdx: number, episodeIdx: number) =>
    `${uid}/serien/${seriesId}/seasons/${seasonIdx}/episodes/${episodeIdx}` as const,

  // Season Count Tracking (für new season detection)
  userSeasonCounts: (uid: string) => `${uid}/seasonCounts` as const,

  // Leaderboard
  userLeaderboardStats: (uid: string) => `${uid}/leaderboardStats` as const,
  userLeaderboardHistory: (uid: string) => `${uid}/leaderboardHistory` as const,
  userLeaderboardHistoryMonth: (uid: string, monthKey: string) =>
    `${uid}/leaderboardHistory/${monthKey}` as const,

  // Wrapped / Watch Activity
  userWrapped: (uid: string) => `${uid}/wrapped` as const,
  userWrappedYear: (uid: string, year: number) => `${uid}/wrapped/${year}` as const,
  userWrappedEvents: (uid: string, year: number) => `${uid}/wrapped/${year}/events` as const,
  userWrappedBingeSessions: (uid: string, year: number) =>
    `${uid}/wrapped/${year}/bingeSessions` as const,
  userWrappedStreak: (uid: string, year: number) => `${uid}/wrapped/${year}/streak` as const,

  // ============================================================================
  // GLOBAL/SHARED PATHS (keine uid)
  // ============================================================================

  // Users collection
  usersRoot: () => 'users' as const,
  userProfile: (uid: string) => `users/${uid}` as const,
  userNotifications: (uid: string) => `users/${uid}/notifications` as const,

  // Validation tracking
  userInactiveSeriesData: (uid: string) => `users/${uid}/inactiveSeriesData` as const,
  userInactiveSeriesNotifications: (uid: string) =>
    `users/${uid}/inactiveSeriesNotifications` as const,
  userInactiveRewatchNotifications: (uid: string) =>
    `users/${uid}/inactiveRewatchNotifications` as const,
  userCompletedSeriesData: (uid: string) => `users/${uid}/completedSeriesData` as const,
  userCompletedSeriesNotifications: (uid: string) =>
    `users/${uid}/completedSeriesNotifications` as const,

  // Pets
  userPets: (uid: string) => `pets/${uid}` as const,
  userPet: (uid: string, petId: string) => `pets/${uid}/${petId}` as const,
  userPetField: (uid: string, petId: string, field: string) =>
    `pets/${uid}/${petId}/${field}` as const,
  petWidget: (uid: string) => `petWidget/${uid}` as const,
  petWidgetActivePetId: (uid: string) => `petWidget/${uid}/activePetId` as const,
  petWidgetPosition: (uid: string) => `petWidget/${uid}/position` as const,

  // Leaderboard (global)
  leaderboardTrophies: () => 'leaderboardTrophies' as const,
  leaderboardTrophyMonth: (monthKey: string) => `leaderboardTrophies/${monthKey}` as const,

  // Discussion Feed
  discussionFeed: () => 'discussionFeed' as const,

  // Analytics
  analyticsUsersRoot: () => 'analytics/users' as const,
  analyticsUserEvents: (uid: string, dateKey: string, batchId: string) =>
    `analytics/users/${uid}/events/${dateKey}/${batchId}` as const,
  analyticsUserDaily: (uid: string, dateKey: string) =>
    `analytics/users/${uid}/daily/${dateKey}` as const,
  analyticsUserMeta: (uid: string) => `analytics/users/${uid}/meta` as const,
  analyticsUserMetaLastSeen: (uid: string) => `analytics/users/${uid}/meta/lastSeen` as const,
  analyticsUserMetaFirstSeen: (uid: string) => `analytics/users/${uid}/meta/firstSeen` as const,
  analyticsGlobalDaily: (dateKey: string) => `analytics/global/daily/${dateKey}` as const,
  analyticsGlobalMonthly: (monthKey: string) => `analytics/global/monthly/${monthKey}` as const,
  analyticsGlobalRealtime: () => 'analytics/global/realtime' as const,
  analyticsGlobalRealtimeUser: (uid: string) =>
    `analytics/global/realtime/activeUsers/${uid}` as const,
} as const;

export type FirebasePaths = typeof FIREBASE_PATHS;
