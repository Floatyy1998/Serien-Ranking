import { EarnedBadge } from './badgeSystem';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';
import { badgeCounterService } from './badgeCounterService';
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
    _userId: string,
    _batchResult: BatchResult
  ): Promise<void> {
    // 🚫 Kein Friend-Activity-Logging mehr für Batch-Episode-Updates
    // Nur noch Badge-System wird von einzelnen Komponenten direkt aufgerufen
  }

  /**
   * Erstellt eine individuelle Episode-Activity
   */
  private async createIndividualActivity(
    _userId: string,
    _pendingActivity: PendingActivity
  ): Promise<void> {
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
      // 🍿 Binge-Session Detection
      await this.detectBingeSession(userId, batchResult);

      const badgeSystem = getOfflineBadgeSystem(userId);
      const newBadges = await badgeSystem.checkForNewBadges();

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
   * 🍿 Erkenne Binge-Sessions aus Batch-Daten
   */
  private async detectBingeSession(userId: string, batchResult: BatchResult): Promise<void> {
    try {
      const episodeCount = batchResult.episodes.length;
      
      // Bestimme Binge-Typ basierend auf Episode-Count und Zeit
      let bingeTimeframe = '';
      
      if (episodeCount >= 3 && episodeCount < 8) {
        bingeTimeframe = '2hours'; // Snack-Session / Appetit-Anreger
      } else if (episodeCount >= 8 && episodeCount < 12) {
        bingeTimeframe = '4hours'; // Couch-Potato / Serien-Schnürer
      } else if (episodeCount >= 12) {
        bingeTimeframe = '1day'; // Staffel-Fresser+
      }

      if (bingeTimeframe && episodeCount >= 3) {
        await badgeCounterService.recordBingeSession(userId, episodeCount, bingeTimeframe);
        console.log(`🍿 Binge-Session erkannt: ${episodeCount} Episoden (${bingeTimeframe})`);
      }
    } catch (error) {
      console.error('Fehler bei Binge-Detection:', error);
    }
  }

  /**
   * Prüft auf neue Badges für individuelle Episoden + aktualisiert Counter
   */
  private async checkBadgesForIndividualEpisode(
    userId: string,
    episodeData: EpisodeWatchData
  ): Promise<void> {
    try {
      // 1. Counter aktualisieren
      await this.updateCountersForEpisode(userId, episodeData);

      // 2. Badge-Check
      const badgeSystem = getOfflineBadgeSystem(userId);
      const newBadges = await badgeSystem.checkForNewBadges();

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
   * Aktualisiert Counter basierend auf Episode-Daten
   */
  private async updateCountersForEpisode(
    userId: string,
    episodeData: EpisodeWatchData
  ): Promise<void> {
    try {
      // Streak-Counter aktualisieren (bei jeder Episode)
      await badgeCounterService.updateStreakCounter(userId);

      // Quickwatch-Counter falls Episode am Release Day
      if (episodeData.airDate && !episodeData.isRewatch) {
        const airDate = new Date(episodeData.airDate).toDateString();
        const today = new Date().toDateString();
        
        if (airDate === today) {
          await badgeCounterService.incrementQuickwatchCounter(userId);
        }
      }

      // Rewatch-Counter falls Rewatch
      if (episodeData.isRewatch) {
        await badgeCounterService.incrementRewatchCounter(userId);
      }

      // Marathon-Counter (wöchentlich)
      await badgeCounterService.recordMarathonProgress(userId, 1);
    } catch (error) {
      console.error('Fehler beim Counter-Update:', error);
    }
  }
}

// Singleton instance
export const activityBatchManager = new ActivityBatchManager({
  bingeTimeWindowMinutes: 120, // 2 Stunden für Binge-Detection
  quickwatchHoursAfterRelease: 24, // 24 Stunden für Quickwatch
  batchDelayMs: 0, // Sofort verarbeiten ohne Verzögerung
});

export default ActivityBatchManager;
