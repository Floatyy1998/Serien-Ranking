import { BadgeSystem, EarnedBadge } from './badgeSystem';
// import { pushActivityWithLimit } from './activityCleanup'; // Nicht mehr benötigt - keine Friend-Activities für Episodes
import {
  BatchDetectionOptions,
  BatchResult,
  EpisodeWatchData,
  generateBatchActivity,
} from './batchActivity.utils';

interface PendingActivity {
  episodeData: EpisodeWatchData;
  timestamp: number;
  userId: string;
  tmdbId: number;
}

interface BatchConfig extends BatchDetectionOptions {
  batchDelayMs?: number; // Zeit die gewartet wird bevor Batch verarbeitet wird (default: 30 Sekunden)
}

class ActivityBatchManager {
  private pendingActivities: Map<string, PendingActivity[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: Required<BatchConfig>;
  private badgeCallbacks: Map<string, (badges: EarnedBadge[]) => void> =
    new Map();

  constructor(config: BatchConfig = {}) {
    this.config = {
      bingeTimeWindowMinutes: 120,
      quickwatchHoursAfterRelease: 24,
      batchDelayMs: 0, // Sofort verarbeiten ohne Verzögerung
      ...config,
    };
  }

  /**
   * Fügt eine Episode-Activity zur Batch-Verarbeitung hinzu
   */
  async addEpisodeActivity(
    userId: string,
    episodeData: EpisodeWatchData
  ): Promise<void> {
    const userKey = userId;

    // Sofortige Badge-Prüfung für alle Episoden (nicht nur Rewatch)
    await this.checkBadgesForIndividualEpisode(userId, episodeData);

    // Init user's pending activities if not exists
    if (!this.pendingActivities.has(userKey)) {
      this.pendingActivities.set(userKey, []);
    }

    const userActivities = this.pendingActivities.get(userKey)!;

    // Füge neue Activity hinzu
    userActivities.push({
      episodeData,
      timestamp: Date.now(),
      userId,
      tmdbId: episodeData.tmdbId,
    });

    // Clear existing timer for this user
    const existingTimer = this.batchTimers.get(userKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Bei sofortiger Verarbeitung (batchDelayMs = 0) warten wir kurz
    // um mehrere schnell hintereinander hinzugefügte Episoden zu sammeln
    const effectiveDelay =
      this.config.batchDelayMs === 0 ? 1000 : this.config.batchDelayMs;

    // Set new timer
    const timer = setTimeout(() => {
      this.processUserBatch(userKey);
    }, effectiveDelay);

    this.batchTimers.set(userKey, timer);
  }

  /**
   * Verarbeitet die gesammelten Activities für einen User
   */
  private async processUserBatch(userId: string): Promise<void> {
    const userActivities = this.pendingActivities.get(userId);
    if (!userActivities || userActivities.length === 0) {
      return;
    }

    try {
      // Gruppiere Activities nach Serie
      const activitiesBySeries = this.groupActivitiesBySeries(userActivities);

      for (const [, activities] of activitiesBySeries.entries()) {
        const episodeDataList = activities.map((a) => a.episodeData);
        const batchResult = generateBatchActivity(episodeDataList, this.config);

        if (batchResult.shouldBatch) {
          // Erstelle Batch-Activity
          await this.createBatchActivity(userId, batchResult);

          // Prüfe auf neue Badges für Batch-Aktivitäten
          await this.checkBadgesForBatch(userId, batchResult);
        } else {
          // Erstelle individuelle Activities
          for (const activity of activities) {
            await this.createIndividualActivity(userId, activity);
          }
        }
      }

      // Cleanup
      this.pendingActivities.delete(userId);
      this.batchTimers.delete(userId);
    } catch (error) {
      console.error('💥 Error in batch processing:', error);
      // Fallback: Erstelle individuelle Activities
      for (const activity of userActivities) {
        await this.createIndividualActivity(userId, activity);
      }

      this.pendingActivities.delete(userId);
      this.batchTimers.delete(userId);
    }
  }

  /**
   * Gruppiert Activities nach Serie (und optional Staffel für besseres Batching)
   */
  private groupActivitiesBySeries(
    activities: PendingActivity[]
  ): Map<string, PendingActivity[]> {
    const groups = new Map<string, PendingActivity[]>();

    for (const activity of activities) {
      // Gruppiere nach Serie und Staffel für bessere Batch-Detection
      const key = `${activity.episodeData.tmdbId}-S${activity.episodeData.seasonNumber}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(activity);
    }

    return groups;
  }

  /**
   * Erstellt eine Batch-Activity in Firebase
   */
  private async createBatchActivity(
    userId: string,
    batchResult: BatchResult
  ): Promise<void> {
    const activity = {
      type: 'episodes_watched' as const,
      itemTitle: batchResult.activityTitle, // Kein Emoji im Titel - wird separat am Ende angezeigt
      tmdbId: batchResult.episodes[0].tmdbId,
      timestamp: Date.now(),
      batchType: batchResult.batchType,
      episodeCount: batchResult.episodes.length,
    };

    // 🚫 Kein Friend-Activity-Logging mehr für Batch-Episode-Updates
    // Nur noch Badge-System wird von einzelnen Komponenten direkt aufgerufen
  }

  /**
   * Erstellt eine individuelle Episode-Activity
   */
  private async createIndividualActivity(
    userId: string,
    pendingActivity: PendingActivity
  ): Promise<void> {
    const { episodeData } = pendingActivity;

    let activityTitle = `${episodeData.seriesTitle} - Staffel ${episodeData.seasonNumber} Episode ${episodeData.episodeNumber}`;

    if (
      episodeData.isRewatch &&
      episodeData.watchCount &&
      episodeData.watchCount > 1
    ) {
      activityTitle += ` (${episodeData.watchCount}x gesehen)`;
    }

    const activity = {
      type: 'episode_watched' as const,
      itemTitle: activityTitle,
      tmdbId: episodeData.tmdbId,
      timestamp: pendingActivity.timestamp,
    };

    // 🚫 Kein Friend-Activity-Logging mehr für Episode-Updates
    // Nur noch Badge-System wird von einzelnen Komponenten direkt aufgerufen

    // Badge-Checks werden bereits beim Hinzufügen gemacht - nicht doppelt
  }

  /**
   * Erzwingt die sofortige Verarbeitung aller pending Activities
   */
  async flushAll(): Promise<void> {
    const userIds = Array.from(this.pendingActivities.keys());

    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Process all batches
    await Promise.all(userIds.map((userId) => this.processUserBatch(userId)));
  }

  /**
   * Erzwingt die sofortige Verarbeitung für einen spezifischen User
   */
  async flushUser(userId: string): Promise<void> {
    const timer = this.batchTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(userId);
    }

    await this.processUserBatch(userId);
  }

  /**
   * Registriert einen Callback für neue Badges
   */
  onBadgeEarned(
    userId: string,
    callback: (badges: EarnedBadge[]) => void
  ): void {
    this.badgeCallbacks.set(userId, callback);
  }

  /**
   * Entfernt Badge-Callback für einen User
   */
  removeBadgeCallback(userId: string): void {
    this.badgeCallbacks.delete(userId);
  }

  /**
   * Prüft auf neue Badges basierend auf Batch-Aktivität
   */
  private async checkBadgesForBatch(
    userId: string,
    batchResult: BatchResult
  ): Promise<void> {
    try {
      const badgeSystem = new BadgeSystem(userId);

      // Erstelle Badge-Check-Daten basierend auf Batch-Typ
      const activityData = {
        type: batchResult.batchType,
        episodes: batchResult.episodes.length,
        seriesTitle: batchResult.episodes[0]?.seriesTitle || 'Unbekannte Serie',
        timestamp: Date.now(),
      };

      const newBadges = await badgeSystem.checkForNewBadges(activityData);

      if (newBadges.length > 0) {
        // Callback ausführen wenn registriert
        const callback = this.badgeCallbacks.get(userId);
        if (callback) {
          callback(newBadges);
        }
      }
    } catch (error) {}
  }

  /**
   * Prüft auf neue Badges für individuelle Episoden (besonders Rewatch-Badges)
   */
  private async checkBadgesForIndividualEpisode(
    userId: string,
    episodeData: EpisodeWatchData
  ): Promise<void> {
    try {
      const badgeSystem = new BadgeSystem(userId);

      // Erstelle Activity-Daten für Badge-Check - IMMER als episode_watched
      // (Rewatch-Erkennung erfolgt über watchCount und Titel-Pattern)
      const activityData = {
        type: 'episode_watched',
        episodes: 1,
        seriesTitle: episodeData.seriesTitle,
        timestamp: episodeData.watchedTimestamp,
        isRewatch: episodeData.isRewatch,
        watchCount: episodeData.watchCount,
        tmdbId: episodeData.tmdbId,
        airDate: episodeData.airDate, // Für Release Day Badge-Prüfung
        seasonNumber: episodeData.seasonNumber,
        episodeNumber: episodeData.episodeNumber,
      };

      const newBadges = await badgeSystem.checkForNewBadges(activityData);

      if (newBadges.length > 0) {
        // Callback ausführen wenn registriert
        const callback = this.badgeCallbacks.get(userId);
        if (callback) {
          callback(newBadges);
        }
      }
    } catch (error) {}
  }
}

// Singleton instance
export const activityBatchManager = new ActivityBatchManager({
  bingeTimeWindowMinutes: 120, // 2 Stunden für Binge-Detection
  quickwatchHoursAfterRelease: 24, // 24 Stunden für Quickwatch
  batchDelayMs: 0, // Sofort verarbeiten ohne Verzögerung
});

export default ActivityBatchManager;
