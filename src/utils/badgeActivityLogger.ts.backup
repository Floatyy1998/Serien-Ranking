/**
 * 🏆 Badge-spezifisches Activity-Logging System
 *
 * Getrennt von Friend-Activities um Badge-spezifische Daten zu sammeln
 * mit allen notwendigen Informationen für korrekte Badge-Erkennung.
 */

import firebase from 'firebase/compat/app';
import { optimizedBadgeService } from './optimizedBadgeService';

// Badge-spezifische Activity-Interfaces
export interface BadgeActivityBase {
  userId: string;
  timestamp: number;
  type: string;
  tmdbId?: number;
  seriesTitle?: string;
  movieTitle?: string;
}

export interface EpisodeWatchedBadgeActivity extends BadgeActivityBase {
  type: 'episode_watched';
  seasonNumber: number;
  episodeNumber: number;
  airDate?: string; // Für Quickwatch-Detection
  isRewatch?: boolean;
}

export interface BatchEpisodesWatchedBadgeActivity extends BadgeActivityBase {
  type: 'episodes_watched';
  episodeCount: number;
  batchType?: 'season' | 'multiple' | 'rewatch';
  isRewatch?: boolean;
  airDates?: string[]; // Für Release-Day-Detection
}

export interface SeasonWatchedBadgeActivity extends BadgeActivityBase {
  type: 'season_watched';
  seasonNumber: number;
  episodeCount: number;
  isRewatch?: boolean;
}

export interface RewatchBadgeActivity extends BadgeActivityBase {
  type: 'rewatch';
  originalAirDate?: string;
  episodeCount?: number; // Falls mehrere Episoden
}

export interface MarathonBadgeActivity extends BadgeActivityBase {
  type: 'marathon';
  episodeCount: number;
  duration?: number; // Dauer in Minuten
  totalRuntime?: number; // Gesamtlaufzeit in Minuten
}

export interface QuickwatchBadgeActivity extends BadgeActivityBase {
  type: 'quickwatch';
  seasonNumber: number;
  episodeNumber: number;
  airDate: string;
  watchedWithin24h: boolean;
}

export interface StreakBadgeActivity extends BadgeActivityBase {
  type: 'streak';
  consecutiveDays: number;
  episodeCount: number;
  streakType: 'daily' | 'weekly'; // Tägliche oder wöchentliche Streak
}

export interface SeriesAddedBadgeActivity extends BadgeActivityBase {
  type: 'series_added';
  genres?: string[];
  firstAirDate?: string;
}

export interface MovieAddedBadgeActivity extends BadgeActivityBase {
  type: 'movie_added';
  genres?: string[];
  releaseDate?: string;
}

export interface RatingBadgeActivity extends BadgeActivityBase {
  type: 'rating_added';
  rating: number;
  contentType: 'series' | 'movie';
}

export interface WatchlistBadgeActivity extends BadgeActivityBase {
  type: 'watchlist_added';
  contentType: 'series' | 'movie';
  addedAt: number;
}

export type BadgeActivity =
  | EpisodeWatchedBadgeActivity
  | BatchEpisodesWatchedBadgeActivity
  | SeasonWatchedBadgeActivity
  | RewatchBadgeActivity
  | MarathonBadgeActivity
  | QuickwatchBadgeActivity
  | StreakBadgeActivity
  | SeriesAddedBadgeActivity
  | MovieAddedBadgeActivity
  | RatingBadgeActivity
  | WatchlistBadgeActivity;

/**
 * 🏆 Badge Activity Logger
 * Sammelt detaillierte Daten für Badge-System
 */
class BadgeActivityLogger {
  /**
   * 📺 Episode geschaut (für Binge/Quickwatch/Marathon/Streak)
   */
  async logEpisodeWatched(
    userId: string,
    seriesTitle: string,
    seasonNumber: number,
    episodeNumber: number,
    tmdbId: number,
    airDate?: string,
    isRewatch: boolean = false
  ): Promise<void> {
    const activity: EpisodeWatchedBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'episode_watched',
      seriesTitle,
      seasonNumber,
      episodeNumber,
      tmdbId,
      airDate,
      isRewatch,
    };

    await this.saveBadgeActivity(activity);

    // 🎯 ZUSÄTZLICH: Quickwatch-Prüfung wenn airDate vorhanden
    if (airDate && !isRewatch) {
      const today = new Date().toISOString().split('T')[0];
      const episodeDate = new Date(airDate).toISOString().split('T')[0];

      // Wenn Episode heute veröffentlicht wurde und heute geschaut wird
      if (episodeDate === today) {
        // Erstelle spezielle Quickwatch-Activity
        await this.logQuickwatch(
          userId,
          seriesTitle,
          seasonNumber,
          episodeNumber,
          tmdbId,
          airDate,
          true
        );
      }
    }
  }

  /**
   * 📺 Mehrere Episoden geschaut (Batch-Watching)
   */
  async logBatchEpisodesWatched(
    userId: string,
    seriesTitle: string,
    episodeCount: number,
    tmdbId: number,
    batchType: 'season' | 'multiple' | 'rewatch' = 'multiple',
    isRewatch: boolean = false,
    airDates?: string[]
  ): Promise<void> {
    const activity: BatchEpisodesWatchedBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'episodes_watched',
      seriesTitle,
      episodeCount,
      tmdbId,
      batchType,
      isRewatch,
      airDates,
    };

    await this.saveBadgeActivity(activity);

    // 🎯 ZUSÄTZLICH: Quickwatch-Prüfung für Batch-Episoden
    if (airDates && !isRewatch) {
      const today = new Date().toISOString().split('T')[0];

      // Zähle Episoden die heute veröffentlicht wurden
      const releaseDayEpisodes = airDates.filter((airDate) => {
        if (!airDate) return false;
        const episodeDate = new Date(airDate).toISOString().split('T')[0];
        return episodeDate === today;
      });

      if (releaseDayEpisodes.length > 0) {
        // Für jede Release Day Episode eine Quickwatch-Activity erstellen
        for (let i = 0; i < releaseDayEpisodes.length; i++) {
          await this.logQuickwatch(
            userId,
            seriesTitle,
            1, // seasonNumber (unbekannt bei Batch)
            i + 1, // episodeNumber (approximiert)
            tmdbId,
            releaseDayEpisodes[i],
            true
          );
        }
      }
    }
  }

  /**
   * 📺 Ganze Staffel geschaut
   */
  async logSeasonWatched(
    userId: string,
    seriesTitle: string,
    seasonNumber: number,
    episodeCount: number,
    tmdbId: number,
    isRewatch: boolean = false
  ): Promise<void> {
    const activity: SeasonWatchedBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'season_watched',
      seriesTitle,
      seasonNumber,
      episodeCount,
      tmdbId,
      isRewatch,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * 🔄 Rewatch-Activity (für Rewatch-Badges)
   */
  async logRewatch(
    userId: string,
    seriesTitle: string,
    tmdbId: number,
    originalAirDate?: string,
    episodeCount: number = 1
  ): Promise<void> {
    const activity: RewatchBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'rewatch',
      seriesTitle,
      tmdbId,
      originalAirDate,
      episodeCount,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * ➕ Serie hinzugefügt (für Explorer-Badges)
   */
  async logSeriesAdded(
    userId: string,
    seriesTitle: string,
    tmdbId: number,
    genres?: string[],
    firstAirDate?: string
  ): Promise<void> {
    const activity: SeriesAddedBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'series_added',
      seriesTitle,
      tmdbId,
      genres,
      firstAirDate,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * ➕ Film hinzugefügt (für Explorer-Badges)
   */
  async logMovieAdded(
    userId: string,
    movieTitle: string,
    tmdbId: number,
    genres?: string[],
    releaseDate?: string
  ): Promise<void> {
    const activity: MovieAddedBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'movie_added',
      movieTitle,
      tmdbId,
      genres,
      releaseDate,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * ⭐ Bewertung abgegeben (für Collector-Badges)
   */
  async logRating(
    userId: string,
    title: string,
    rating: number,
    tmdbId: number,
    contentType: 'series' | 'movie'
  ): Promise<void> {
    const activity: RatingBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'rating_added',
      rating,
      tmdbId,
      contentType,
      ...(contentType === 'series'
        ? { seriesTitle: title }
        : { movieTitle: title }),
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * 📋 Zur Watchlist hinzugefügt (für Social-Badges)
   */
  async logWatchlistAdded(
    userId: string,
    title: string,
    tmdbId: number,
    contentType: 'series' | 'movie'
  ): Promise<void> {
    const activity: WatchlistBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'watchlist_added',
      tmdbId,
      contentType,
      addedAt: Date.now(),
      ...(contentType === 'series'
        ? { seriesTitle: title }
        : { movieTitle: title }),
    };

    await this.saveBadgeActivity(activity);

    // Auch Badge-Counter für Social-Badges aktualisieren
    await this.incrementWatchlistCounter(userId);
  }

  /**
   * 🏃‍♂️ Marathon-Session (für Marathon-Badges)
   */
  async logMarathon(
    userId: string,
    seriesTitle: string,
    episodeCount: number,
    tmdbId: number,
    duration?: number,
    totalRuntime?: number
  ): Promise<void> {
    const activity: MarathonBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'marathon',
      seriesTitle,
      episodeCount,
      tmdbId,
      duration,
      totalRuntime,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * ⚡ Quickwatch - Episode am Veröffentlichungstag (für Quickwatch-Badges)
   */
  async logQuickwatch(
    userId: string,
    seriesTitle: string,
    seasonNumber: number,
    episodeNumber: number,
    tmdbId: number,
    airDate: string,
    watchedWithin24h: boolean = true
  ): Promise<void> {
    const activity: QuickwatchBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'quickwatch',
      seriesTitle,
      seasonNumber,
      episodeNumber,
      tmdbId,
      airDate,
      watchedWithin24h,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * 🔥 Streak - Tägliche/wöchentliche Streak (für Streak-Badges)
   */
  async logStreak(
    userId: string,
    seriesTitle: string,
    consecutiveDays: number,
    episodeCount: number,
    tmdbId: number,
    streakType: 'daily' | 'weekly' = 'daily'
  ): Promise<void> {
    const activity: StreakBadgeActivity = {
      userId,
      timestamp: Date.now(),
      type: 'streak',
      seriesTitle,
      consecutiveDays,
      episodeCount,
      tmdbId,
      streakType,
    };

    await this.saveBadgeActivity(activity);
  }

  /**
   * 💾 Badge-Activity in Firebase speichern
   */
  private async saveBadgeActivity(activity: BadgeActivity): Promise<void> {
    try {
      // Entferne undefined-Werte für Firebase
      const cleanActivity = this.removeUndefinedValues(activity);

      // Speichere in separatem Badge-Activities-Pfad (Firebase v8)
      const badgeActivitiesRef = firebase
        .database()
        .ref(`badgeActivities/${activity.userId}`);
      await badgeActivitiesRef.push(cleanActivity);

      // 🔥 AUTOMATISCHE BADGE-PRÜFUNG nach jeder Activity
      await this.checkForNewBadges(activity);
    } catch (error) {
      // Fehler beim Speichern der Badge-Activity
    }
  }

  /**
   * 🏆 Automatische Badge-Prüfung nach Activity
   */
  private async checkForNewBadges(activity: BadgeActivity): Promise<void> {
    try {
      // Dynamischer Import um Circular Dependencies zu vermeiden
      const { BadgeSystem } = await import('./badgeSystem');
      const badgeSystem = new BadgeSystem(activity.userId);

      // Prüfe für neue Badges basierend auf der Activity
      const newBadges = await badgeSystem.checkForNewBadges(activity);

      if (newBadges.length > 0) {
        // Neue Badges gefunden - diese werden vom BadgeSystem automatisch angezeigt
      } else {
        // ZUSÄTZLICHES DEBUG: Prüfe spezifisch Social-Badges bei watchlist_added
        if (activity.type === 'watchlist_added') {
          // Lade aktuelle Badges
          const currentBadges = await badgeSystem.getUserBadges();
          const currentBadgeIds = new Set(currentBadges.map((b: any) => b.id));

          // Prüfe Social-Badge-Definitionen
          const { BADGE_DEFINITIONS } = await import('./badgeSystem');
          const socialBadges = BADGE_DEFINITIONS.filter(
            (b) => b.category === 'social'
          );

          for (const socialBadge of socialBadges) {
            if (!currentBadgeIds.has(socialBadge.id)) {
              // Prüfe Badge-Bedingungen
            }
          }
        }
      }
    } catch (error) {
      // Fehler bei automatischer Badge-Prüfung
    }
  }

  /**
   * 🔢 Watchlist-Counter für Social-Badges
   */
  private async incrementWatchlistCounter(userId: string): Promise<void> {
    try {
      // 🚀 Nutze optimierten Service statt direkter Firebase-Call
      const { badgeActivities } =
        await optimizedBadgeService.getBadgeCalculationData(userId);
      const watchlistCount = badgeActivities.filter(
        (activity) => activity.type === 'watchlist'
      ).length;

      const counterRef = firebase
        .database()
        .ref(`badgeCounters/${userId}/watchlistItems`);

      // Setze den neuen Counter-Wert (Firebase v8)
      await counterRef.set(watchlistCount + 1);
    } catch (error) {
      // Fehler beim Aktualisieren des Watchlist-Counters - Fallback
      const counterRef = firebase
        .database()
        .ref(`badgeCounters/${userId}/watchlistItems`);
      const snapshot = await counterRef.once('value');
      const currentCount = snapshot.val() || 0;
      await counterRef.set(currentCount + 1);
    }
  }

  /**
   * 🧹 Entferne undefined-Werte für Firebase-Kompatibilität
   */
  private removeUndefinedValues(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * 📊 Hole Badge-Activities seit Zeitpunkt
   */
  async getBadgeActivitiesSince(
    userId: string,
    timestamp: number
  ): Promise<BadgeActivity[]> {
    try {
      const activitiesRef = firebase
        .database()
        .ref(`badgeActivities/${userId}`);
      const snapshot = await activitiesRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const activities = Object.values(snapshot.val() || {}) as BadgeActivity[];
      return activities.filter((activity) => activity.timestamp >= timestamp);
    } catch (error) {
      return [];
    }
  }

  /**
   * 📈 Hole spezifische Badge-Counters
   */
  async getBadgeCounter(userId: string, counterType: string): Promise<number> {
    try {
      const counterRef = firebase
        .database()
        .ref(`badgeCounters/${userId}/${counterType}`);
      const snapshot = await counterRef.once('value');
      return snapshot.val() || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📊 Hole alle Badge-Activities eines Users
   */
  async getAllBadgeActivities(userId: string): Promise<BadgeActivity[]> {
    try {
      const activitiesRef = firebase
        .database()
        .ref(`badgeActivities/${userId}`);
      const snapshot = await activitiesRef.once('value');

      if (!snapshot.exists()) {
        return [];
      }

      return Object.values(snapshot.val() || {}) as BadgeActivity[];
    } catch (error) {
      return [];
    }
  }
}

// Exportiere Singleton-Instanz
export const badgeActivityLogger = new BadgeActivityLogger();

/**
 * 🔧 Hilfsfunktionen für einfache Verwendung
 */

// Einfache Export-Funktionen für direkten Import
export const logEpisodeWatched = (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  tmdbId: number,
  airDate?: string,
  isRewatch?: boolean
) =>
  badgeActivityLogger.logEpisodeWatched(
    userId,
    seriesTitle,
    seasonNumber,
    episodeNumber,
    tmdbId,
    airDate,
    isRewatch
  );

export const logBatchEpisodesWatched = (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  tmdbId: number,
  batchType?: 'season' | 'multiple' | 'rewatch',
  isRewatch?: boolean,
  airDates?: string[]
) =>
  badgeActivityLogger.logBatchEpisodesWatched(
    userId,
    seriesTitle,
    episodeCount,
    tmdbId,
    batchType,
    isRewatch,
    airDates
  );

export const logSeasonWatched = (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeCount: number,
  tmdbId: number,
  isRewatch?: boolean
) =>
  badgeActivityLogger.logSeasonWatched(
    userId,
    seriesTitle,
    seasonNumber,
    episodeCount,
    tmdbId,
    isRewatch
  );

export const logBadgeRewatch = (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  originalAirDate?: string,
  episodeCount?: number
) =>
  badgeActivityLogger.logRewatch(
    userId,
    seriesTitle,
    tmdbId,
    originalAirDate,
    episodeCount
  );

export const logBadgeSeriesAdded = (
  userId: string,
  seriesTitle: string,
  tmdbId: number,
  genres?: string[],
  firstAirDate?: string
) =>
  badgeActivityLogger.logSeriesAdded(
    userId,
    seriesTitle,
    tmdbId,
    genres,
    firstAirDate
  );

export const logBadgeMovieAdded = (
  userId: string,
  movieTitle: string,
  tmdbId: number,
  genres?: string[],
  releaseDate?: string
) =>
  badgeActivityLogger.logMovieAdded(
    userId,
    movieTitle,
    tmdbId,
    genres,
    releaseDate
  );

export const logBadgeRating = (
  userId: string,
  title: string,
  rating: number,
  tmdbId: number,
  contentType: 'series' | 'movie'
) => badgeActivityLogger.logRating(userId, title, rating, tmdbId, contentType);

export const logBadgeWatchlistAdded = (
  userId: string,
  title: string,
  tmdbId: number,
  contentType: 'series' | 'movie'
) => badgeActivityLogger.logWatchlistAdded(userId, title, tmdbId, contentType);

export const logBadgeMarathon = (
  userId: string,
  seriesTitle: string,
  episodeCount: number,
  tmdbId: number,
  duration?: number,
  totalRuntime?: number
) =>
  badgeActivityLogger.logMarathon(
    userId,
    seriesTitle,
    episodeCount,
    tmdbId,
    duration,
    totalRuntime
  );

export const logBadgeQuickwatch = (
  userId: string,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  tmdbId: number,
  airDate: string,
  watchedWithin24h: boolean = true
) =>
  badgeActivityLogger.logQuickwatch(
    userId,
    seriesTitle,
    seasonNumber,
    episodeNumber,
    tmdbId,
    airDate,
    watchedWithin24h
  );

export const logBadgeStreak = (
  userId: string,
  seriesTitle: string,
  consecutiveDays: number,
  episodeCount: number,
  tmdbId: number,
  streakType: 'daily' | 'weekly' = 'daily'
) =>
  badgeActivityLogger.logStreak(
    userId,
    seriesTitle,
    consecutiveDays,
    episodeCount,
    tmdbId,
    streakType
  );
