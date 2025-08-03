/**
 * 🚫 Disabled Badge Activity Logger
 * 
 * Ersetzt das alte badgeActivityLogger System mit No-Op Funktionen.
 * Verhindert Badge-Activity-Spam in Firebase.
 */

// Unused import removed

// No-Op Badge Activity Logger
class DisabledBadgeActivityLogger {
  // Alle Methoden sind jetzt No-Ops
  async logEpisodeWatched(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Episode)');
  }

  async logBatchEpisodesWatched(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Batch)');
  }

  async logSeasonWatched(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Season)');
  }

  async logRewatch(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Rewatch)');
  }

  async logSeriesAdded(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Series Added)');
  }

  async logMovieAdded(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Movie Added)');
  }

  async logRating(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Rating)');
  }

  async logWatchlistAdded(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Watchlist)');
  }

  async logMarathon(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Marathon)');
  }

  async logQuickwatch(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Quickwatch)');
  }

  async logStreak(_args: any[]): Promise<void> {
    // 🚫 DEAKTIVIERT: Keine Badge-Activities mehr
    console.log('🚫 Badge-Activity-Logging deaktiviert (Streak)');
  }

  async getBadgeActivitiesSince(_userId: string, _timestamp: number): Promise<any[]> {
    // 🚫 DEAKTIVIERT: Gib leeres Array zurück
    console.log('🚫 Badge-Activity-Loading deaktiviert');
    return [];
  }

  async getBadgeCounter(_userId: string, _counterType: string): Promise<number> {
    // 🚫 DEAKTIVIERT: Gib 0 zurück
    console.log('🚫 Badge-Counter-Loading deaktiviert');
    return 0;
  }

  async getAllBadgeActivities(_userId: string): Promise<any[]> {
    // 🚫 DEAKTIVIERT: Gib leeres Array zurück
    console.log('🚫 Badge-Activities-Loading deaktiviert');
    return [];
  }

  // Removed unused private methods
}

// Exportiere Singleton-Instanz
export const badgeActivityLogger = new DisabledBadgeActivityLogger();

// Export alle alten Funktionen als No-Ops
export const logEpisodeWatched = (_args: any[]) => badgeActivityLogger.logEpisodeWatched(_args);
export const logBatchEpisodesWatched = (_args: any[]) => badgeActivityLogger.logBatchEpisodesWatched(_args);
export const logSeasonWatched = (_args: any[]) => badgeActivityLogger.logSeasonWatched(_args);
export const logBadgeRewatch = (_args: any[]) => badgeActivityLogger.logRewatch(_args);
export const logBadgeSeriesAdded = (_args: any[]) => badgeActivityLogger.logSeriesAdded(_args);
export const logBadgeMovieAdded = (_args: any[]) => badgeActivityLogger.logMovieAdded(_args);
export const logBadgeRating = (_args: any[]) => badgeActivityLogger.logRating(_args);
export const logBadgeWatchlistAdded = (_args: any[]) => badgeActivityLogger.logWatchlistAdded(_args);
export const logBadgeMarathon = (_args: any[]) => badgeActivityLogger.logMarathon(_args);
export const logBadgeQuickwatch = (_args: any[]) => badgeActivityLogger.logQuickwatch(_args);
export const logBadgeStreak = (_args: any[]) => badgeActivityLogger.logStreak(_args);