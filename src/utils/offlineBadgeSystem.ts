/**
 * 🏆 Offline-First Badge System
 *
 * Berechnet Badges direkt aus existierenden Daten ohne Firebase-Activities zu speichern.
 * Reduziert Firebase-Belastung drastisch und funktioniert offline.
 */

import firebase from 'firebase/compat/app';
import {
  BADGE_DEFINITIONS,
  type Badge,
  type EarnedBadge,
} from './badgeDefinitions';

export class OfflineBadgeSystem {
  private userId: string;
  private cachedData: any = null;
  private lastCacheTime: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 🚀 Haupt-Badge-Prüfung - Berechnet aus echten Daten
   */
  async checkForNewBadges(): Promise<EarnedBadge[]> {
    const [userData, currentBadges] = await Promise.all([
      this.getUserData(),
      this.getUserBadges(),
    ]);

    const currentBadgeIds = new Set(currentBadges.map((b) => b.id));
    const newBadges: EarnedBadge[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      if (currentBadgeIds.has(badge.id)) {
        continue;
      }

      const earned = await this.checkBadgeRequirement(badge, userData);
      if (earned) {
        const earnedBadge: EarnedBadge = {
          ...badge,
          earnedAt: Date.now(),
          details: earned.details,
        };

        newBadges.push(earnedBadge);
        await this.saveBadge(earnedBadge);
      }
    }
    return newBadges;
  }

  /**
   * 📊 Lade alle User-Daten einmal (mit Caching)
   */
  private async getUserData() {
    const now = Date.now();
    if (this.cachedData && now - this.lastCacheTime < this.CACHE_DURATION) {
      return this.cachedData;
    }

    const [series, movies, activities, badgeCounters] = await Promise.all([
      this.getSeriesData(),
      this.getMoviesData(),
      this.getActivitiesData(),
      this.getBadgeCounters(),
    ]);

    this.cachedData = { series, movies, activities, badgeCounters };
    this.lastCacheTime = now;
    return this.cachedData;
  }

  private async getSeriesData() {
    const snapshot = await firebase
      .database()
      .ref(`${this.userId}/serien`)
      .once('value');
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  }

  private async getMoviesData() {
    const snapshot = await firebase
      .database()
      .ref(`${this.userId}/filme`)
      .once('value');
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  }

  private async getActivitiesData() {
    const snapshot = await firebase
      .database()
      .ref(`activities/${this.userId}`)
      .once('value');
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  }

  private async getBadgeCounters() {
    const snapshot = await firebase
      .database()
      .ref(`badgeCounters/${this.userId}`)
      .once('value');
    return snapshot.exists() ? snapshot.val() : {};
  }

  /**
   * 🎯 Badge-Anforderungen prüfen
   */
  private async checkBadgeRequirement(
    badge: Badge,
    userData: any
  ): Promise<{ earned: boolean; details?: string } | null> {
    const { series, movies, activities, badgeCounters } = userData;

    switch (badge.category) {
      case 'series_explorer':
        return this.checkExplorerBadge(badge, series);

      case 'collector':
        return this.checkCollectorBadge(badge, series, movies);

      case 'social':
        return await this.checkSocialBadgeFromCounters(
          badge,
          badgeCounters,
          series,
          movies
        );

      case 'completion':
        return this.checkCompletionBadge(badge, series);

      case 'binge':
        return this.checkBingeBadgeFromSeries(badge, series, activities);

      case 'marathon':
        return this.checkMarathonBadgeFromSeries(badge, series, activities);

      case 'streak':
        return this.checkStreakBadgeFromCounters(badge, badgeCounters);

      case 'quickwatch':
        return this.checkQuickwatchBadgeFromCounters(badge, badgeCounters);

      case 'rewatch':
        return this.checkRewatchBadgeFromSeries(badge, series);

      case 'dedication':
        return this.checkDedicationBadgeFromSeries(badge, series);

      default:
        return null;
    }
  }

  /**
   * 🗺️ Explorer Badges - Anzahl verschiedener Serien
   */
  private checkExplorerBadge(
    badge: Badge,
    series: any[]
  ): { earned: boolean; details?: string } | null {
    const seriesCount = series.length;

    if (seriesCount >= badge.requirements.series!) {
      return {
        earned: true,
        details: `${seriesCount} verschiedene Serien entdeckt`,
      };
    }
    return null;
  }

  /**
   * ⭐ Collector Badges - Anzahl Bewertungen
   */
  private checkCollectorBadge(
    badge: Badge,
    series: any[],
    movies: any[]
  ): { earned: boolean; details?: string } | null {
    let ratingCount = 0;

    // Zähle bewertete Serien
    series.forEach((s: any) => {
      if (s.rating && this.hasValidRating(s.rating)) {
        ratingCount++;
      }
    });

    // Zähle bewertete Filme
    movies.forEach((m: any) => {
      if (m.rating && this.hasValidRating(m.rating)) {
        ratingCount++;
      }
    });

    if (ratingCount >= badge.requirements.ratings!) {
      return {
        earned: true,
        details: `${ratingCount} Bewertungen abgegeben`,
      };
    }
    return null;
  }

  private hasValidRating(rating: any): boolean {
    if (typeof rating === 'number') return rating > 0;
    if (typeof rating === 'object') {
      // Prüfe auf irgendeine Bewertung in verschiedenen Kategorien
      return Object.values(rating).some(
        (r: any) => typeof r === 'number' && r > 0
      );
    }
    return false;
  }

  /**
   * 🤝 Social Badges - Anzahl Freunde
   */
  private async checkSocialBadgeFromCounters(
    badge: Badge,
    _badgeCounters: any,
    _series: any[],
    _movies: any[]
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Lade Anzahl Freunde aus Firebase (korrekterer Pfad: users/{userId}/friends/)
    const friendsSnapshot = await firebase
      .database()
      .ref(`users/${this.userId}/friends`)
      .once('value');
    const friendsCount = friendsSnapshot.exists()
      ? Object.keys(friendsSnapshot.val()).length
      : 0;

    if (friendsCount >= badge.requirements.friends!) {
      return {
        earned: true,
        details: `${friendsCount} Freunde hinzugefügt`,
      };
    }
    return null;
  }

  /**
   * 🏆 Season-Badges aus echten Serien-Completion-Daten
   */
  private checkSeasonBadgeFromRealData(
    badge: Badge,
    series: any[]
  ): { earned: boolean; details?: string } | null {
    try {
      const timeWindowMs = this.getTimeWindowMs(badge.requirements.timeframe);
      if (!timeWindowMs) return null;

      const cutoff = Date.now() - timeWindowMs;
      let completedSeasonsInTimeframe = 0;

      // Durchsuche alle Serien nach kürzlich komplettierte Staffeln
      series.forEach((s) => {
        if (s.seasons && Array.isArray(s.seasons)) {
          s.seasons.forEach((season: any) => {
            if (this.isSeasonCompleted(season)) {
              // Prüfe wann die Staffel komplett wurde (anhand der letzten Episode)
              const completionTime = this.getSeasonCompletionTime(season);
              if (completionTime && completionTime >= cutoff) {
                completedSeasonsInTimeframe++;
              }
            }
          });
        }
      });

      if (completedSeasonsInTimeframe >= badge.requirements.seasons!) {
        return {
          earned: true,
          details: `${completedSeasonsInTimeframe} Staffel${
            completedSeasonsInTimeframe > 1 ? 'n' : ''
          } in ${badge.requirements.timeframe} komplett geschaut`,
        };
      }

      return null;
    } catch (error) {
      console.error('Fehler bei Season-Badge-Check:', error);
      return null;
    }
  }

  /**
   * Prüfe ob eine Staffel komplett ist
   */
  private isSeasonCompleted(season: any): boolean {
    if (!season.episodes || !Array.isArray(season.episodes)) return false;
    return season.episodes.every((ep: any) => ep.watched === true);
  }

  /**
   * Ermittle wann eine Staffel komplett wurde (Timestamp der letzten Episode)
   */
  private getSeasonCompletionTime(season: any): number | null {
    if (!season.episodes || !Array.isArray(season.episodes)) return null;

    let latestWatchTime = 0;
    for (const ep of season.episodes) {
      if (ep.watched && ep.watchedAt) {
        latestWatchTime = Math.max(latestWatchTime, ep.watchedAt);
      }
    }

    // Fallback: Wenn keine watchedAt Timestamps, nutze aktuelle Zeit (nur für Migration)
    return latestWatchTime || Date.now();
  }

  /**
   * 🏁 Completion Badges - Komplett geschaute Serien
   */
  private checkCompletionBadge(
    badge: Badge,
    series: any[]
  ): { earned: boolean; details?: string } | null {
    let completedCount = 0;

    series.forEach((s: any) => {
      if (this.isSeriesCompleted(s)) {
        completedCount++;
      }
    });

    if (completedCount >= badge.requirements.series!) {
      return {
        earned: true,
        details: `${completedCount} Serien komplett abgeschlossen`,
      };
    }
    return null;
  }

  private isSeriesCompleted(series: any): boolean {
    if (!series.seasons || !Array.isArray(series.seasons)) return false;

    return series.seasons.every((season: any) => {
      if (!season.episodes || !Array.isArray(season.episodes)) return false;
      return season.episodes.every((ep: any) => ep.watched === true);
    });
  }

  /**
   * 🍿 Binge Badges - Counter-basierte Prüfung
   */
  private checkBingeBadgeFromSeries(
    badge: Badge,
    _series: any[],
    _activities: any[]
  ): { earned: boolean; details?: string } | null {
    // Für Episode-basierte Binge-Badges: Nutze maxBingeEpisodes Counter
    if (badge.requirements.episodes) {
      // Verwende Counter-Daten
      const maxBingeEpisodes = this.getCounterValue('maxBingeEpisodes');

      if (maxBingeEpisodes >= badge.requirements.episodes) {
        return {
          earned: true,
          details: `${maxBingeEpisodes} Episoden in einer Binge-Session`,
        };
      }
    }

    // 🏆 Season-Badges aus echten Serien-Completion-Daten
    if (badge.requirements.seasons) {
      return this.checkSeasonBadgeFromRealData(badge, _series);
    }

    return null;
  }

  /**
   * Helper: Hole Counter-Wert aus badgeCounters
   */
  private getCounterValue(counterName: string): number {
    if (this.cachedData && this.cachedData.badgeCounters) {
      const value = this.cachedData.badgeCounters[counterName] || 0;

      return value;
    }
    return 0;
  }

  /**
   * 🏃 Marathon Badges - Counter-basierte Prüfung
   */
  private checkMarathonBadgeFromSeries(
    badge: Badge,
    _series: any[],
    _activities: any[]
  ): { earned: boolean; details?: string } | null {
    // Marathon = Episoden in der aktuellen Woche
    const currentWeekKey = this.getCurrentWeekKey();
    const marathonWeeks = this.getCounterValue('marathonWeeks') || {};
    const currentWeekEpisodes = (marathonWeeks as any)[currentWeekKey] || 0;

    if (currentWeekEpisodes >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${currentWeekEpisodes} Episoden in einer Woche`,
      };
    }
    return null;
  }

  /**
   * Helper: Aktuelle Woche als Key
   */
  private getCurrentWeekKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(
      (now.getTime() - new Date(year, 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );
    return `${year}-W${week}`;
  }

  /**
   * 🔥 Streak Badges - Aus Badge-Counters
   */
  private checkStreakBadgeFromCounters(
    badge: Badge,
    badgeCounters: any
  ): { earned: boolean; details?: string } | null {
    // PROBLEM: episode_watched ist NICHT in Friend-Activities!
    // LÖSUNG: Verwende separaten Streak-Counter
    const currentStreak = badgeCounters.currentStreak || 0;

    if (currentStreak >= badge.requirements.days!) {
      return {
        earned: true,
        details: `${currentStreak} Tage Streak`,
      };
    }
    return null;
  }

  /**
   * ⚡ Quickwatch Badges - Aus Badge-Counters
   */
  private checkQuickwatchBadgeFromCounters(
    badge: Badge,
    badgeCounters: any
  ): { earned: boolean; details?: string } | null {
    // Quickwatch-Count aus separatem Counter lesen
    const quickwatchCount = badgeCounters.quickwatchEpisodes || 0;

    if (quickwatchCount >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${quickwatchCount} Quickwatch Episoden`,
      };
    }
    return null;
  }

  /**
   * 🔄 Rewatch Badges - Aus Serien-Daten berechnen
   */
  private checkRewatchBadgeFromSeries(
    badge: Badge,
    series: any[]
  ): { earned: boolean; details?: string } | null {
    // Rewatch-Episoden durch watchCount > 1 in Serien-Daten erkennen
    let rewatchEpisodes = 0;

    series.forEach((s) => {
      if (s.seasons && Array.isArray(s.seasons)) {
        s.seasons.forEach((season: any) => {
          if (season.episodes && Array.isArray(season.episodes)) {
            season.episodes.forEach((ep: any) => {
              if (ep.watched && ep.watchCount && ep.watchCount > 1) {
                // Zähle Rewatch-Count minus erstes Schauen
                rewatchEpisodes += ep.watchCount - 1;
              }
            });
          }
        });
      }
    });

    if (rewatchEpisodes >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${rewatchEpisodes} Rewatch Episoden`,
      };
    }
    return null;
  }

  /**
   * ⏰ Dedication Badges - Aus Serien-Daten berechnen
   */
  private checkDedicationBadgeFromSeries(
    badge: Badge,
    series: any[]
  ): { earned: boolean; details?: string } | null {
    // Dedication = Gesamte geschaute Episoden (ähnlich wie Marathon)
    let totalWatchedEpisodes = 0;

    series.forEach((s) => {
      if (s.seasons && Array.isArray(s.seasons)) {
        s.seasons.forEach((season: any) => {
          if (season.episodes && Array.isArray(season.episodes)) {
            const watchedInSeason = season.episodes.filter(
              (ep: any) => ep.watched
            ).length;
            totalWatchedEpisodes += watchedInSeason;
          }
        });
      }
    });

    if (totalWatchedEpisodes >= badge.requirements.episodes!) {
      const timeText = badge.requirements.timeframe || 'insgesamt';
      return {
        earned: true,
        details: `${totalWatchedEpisodes} Episoden (${timeText})`,
      };
    }
    return null;
  }

  // Helper Methods
  private getTimeWindowMs(timeframe?: string): number | null {
    if (!timeframe) return null;
    const map: Record<string, number> = {
      '2hours': 2 * 60 * 60 * 1000,
      '4hours': 4 * 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000,
      '2days': 2 * 24 * 60 * 60 * 1000,
      '1week': 7 * 24 * 60 * 60 * 1000,
      '1month': 30 * 24 * 60 * 60 * 1000,
      '1year': 365 * 24 * 60 * 60 * 1000,
    };
    return map[timeframe] || null;
  }

  // Badge Management
  async getUserBadges(): Promise<EarnedBadge[]> {
    const snapshot = await firebase
      .database()
      .ref(`badges/${this.userId}`)
      .once('value');
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  }

  private async saveBadge(badge: EarnedBadge): Promise<void> {
    await firebase
      .database()
      .ref(`badges/${this.userId}/${badge.id}`)
      .set({
        ...badge,
        earnedAt: firebase.database.ServerValue.TIMESTAMP,
      });
  }

  /**
   * 🔄 Alle Badges neu berechnen (für Migration/Reparatur)
   */
  async recalculateAllBadges(): Promise<EarnedBadge[]> {
    // Cache leeren für frische Daten
    this.cachedData = null;
    return this.checkForNewBadges();
  }

  /**
   * 🧹 Invalidate Cache (nach großen Änderungen)
   */
  invalidateCache(): void {
    this.cachedData = null;
    this.lastCacheTime = 0;
  }

  /**
   * 🐛 Debug Social Badges - für Testing
   */
  async debugSocialBadges(): Promise<{
    friendsCount: number;
    socialBadges: any[];
    earnedSocialBadges: any[];
  }> {
    const friendsSnapshot = await firebase
      .database()
      .ref(`users/${this.userId}/friends`)
      .once('value');
    const friendsCount = friendsSnapshot.exists()
      ? Object.keys(friendsSnapshot.val()).length
      : 0;

    const socialBadges = BADGE_DEFINITIONS.filter(
      (b) => b.category === 'social'
    );
    const currentBadges = await this.getUserBadges();
    const earnedSocialBadges = currentBadges.filter(
      (b) => b.category === 'social'
    );

    // Prüfe jeden Social Badge manuell

    return { friendsCount, socialBadges, earnedSocialBadges };
  }
}

// Singleton Export
const offlineBadgeSystemInstances = new Map<string, OfflineBadgeSystem>();

export const getOfflineBadgeSystem = (userId: string): OfflineBadgeSystem => {
  if (!offlineBadgeSystemInstances.has(userId)) {
    offlineBadgeSystemInstances.set(userId, new OfflineBadgeSystem(userId));
  }
  return offlineBadgeSystemInstances.get(userId)!;
};

// Global Debug Functions für Browser Console
if (typeof window !== 'undefined') {
  (window as any).debugBadges = async (userId: string) => {
    const badgeSystem = getOfflineBadgeSystem(userId);
    const debug = await badgeSystem.debugSocialBadges();

    badgeSystem.invalidateCache();
    const newBadges = await badgeSystem.checkForNewBadges();

    return { debug, newBadges };
  };

  // 🧪 Extended Debug Tools
  (window as any).badgeDebugTools = {
    // User-ID automatisch finden
    getCurrentUserId: async () => {
      try {
        // Versuche über Firebase Auth
        const firebase = await import('firebase/compat/app');
        const user = firebase.default.auth().currentUser;
        if (user) {
          return user.uid;
        }
      } catch (error) {
        console.log('Firebase auth not available, trying localStorage...');
      }

      // Fallback: Suche in localStorage nach User-ähnlichen Keys
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(
        (key) =>
          key.includes('user') || key.includes('uid') || key.length === 28 // Firebase UIDs sind 28 Zeichen
      );

      if (userKeys.length > 0) {
        return userKeys[0];
      }

      return null;
    },
    // Alle Counter anzeigen
    showCounters: async (userId: string) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      const counters = await badgeCounterService.getAllCounters(userId);
      return counters;
    },

    // Binge-Session simulieren
    simulateBinge: async (userId: string, episodeCount: number = 5) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      await badgeCounterService.recordBingeSession(
        userId,
        episodeCount,
        '2hours'
      );
    },

    // Streak simulieren
    simulateStreak: async (userId: string, days: number = 7) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      await badgeCounterService.incrementCounter(userId, 'currentStreak', days);
    },

    // Quickwatch simulieren
    simulateQuickwatch: async (userId: string, count: number = 5) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      for (let i = 0; i < count; i++) {
        await badgeCounterService.incrementQuickwatchCounter(userId);
      }
    },

    // Badge-Progress für alle Kategorien zeigen
    showBadgeProgress: async (userId: string) => {
      const badgeSystem = getOfflineBadgeSystem(userId);
      const userData = await (badgeSystem as any).getUserData();
      const { series, movies } = userData;

      // Rating-Count berechnen
      let ratingCount = 0;
      series.forEach((s: any) => s.rating && ratingCount++);
      movies.forEach((m: any) => m.rating && ratingCount++);

      return userData;
    },

    // Counter zurücksetzen (für Testing)
    resetCounters: async (userId: string) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      await badgeCounterService.clearAllCounters(userId);
    },
  };
}

export default OfflineBadgeSystem;
