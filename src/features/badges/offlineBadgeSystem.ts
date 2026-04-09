/**
 * Offline-First Badge System
 *
 * Berechnet Badges direkt aus existierenden Daten ohne Firebase-Activities zu speichern.
 * Reduziert Firebase-Belastung drastisch und funktioniert offline.
 */

import firebase from 'firebase/compat/app';
import {
  BADGE_DEFINITIONS,
  type Badge,
  type BadgeCategory,
  type BadgeProgress,
  type EarnedBadge,
} from './badgeDefinitions';
import type { BadgeCounters, BadgeMovieItem, BadgeSeriesItem, BadgeUserData } from './badgeTypes';
import { checkBadgeRequirement } from './badgeCheckers';
import {
  getBingeProgress,
  getQuickwatchProgress,
  getMarathonProgress,
  getStreakProgress,
  getRewatchProgress,
  getExplorerProgress,
  getCollectorProgress,
  getSocialProgress,
} from './badgeProgressHelpers';
import { registerBadgeDebugTools } from './badgeDebugTools';

export class OfflineBadgeSystem {
  private userId: string;
  private cachedData: BadgeUserData | null = null;
  private lastCacheTime: number = 0;
  private CACHE_DURATION = 30 * 60 * 1000; // 30 Minuten Cache
  private cachedBadges: EarnedBadge[] | null = null;
  private cachedProgress: Record<string, BadgeProgress> | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 🚀 Haupt-Badge-Prüfung - Berechnet aus echten Daten
   */
  async checkForNewBadges(): Promise<EarnedBadge[]> {
    const [userData, currentBadges] = await Promise.all([this.getUserData(), this.getUserBadges()]);

    const currentBadgeIds = new Set(currentBadges.map((b) => b.id));
    const newBadges: EarnedBadge[] = [];

    for (const badge of BADGE_DEFINITIONS) {
      if (currentBadgeIds.has(badge.id)) {
        continue;
      }

      const earned = await checkBadgeRequirement(badge, userData, this.userId, this.cachedData);
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
  private async getUserData(): Promise<BadgeUserData> {
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

  private async getSeriesData(): Promise<BadgeSeriesItem[]> {
    const [refsSnap, watchSnap] = await Promise.all([
      firebase.database().ref(`users/${this.userId}/series`).once('value'),
      firebase.database().ref(`users/${this.userId}/seriesWatch`).once('value'),
    ]);
    if (!refsSnap.exists()) return [];
    const refs = refsSnap.val() as Record<string, Record<string, unknown>>;
    const watchData = (watchSnap.val() || {}) as Record<string, Record<string, unknown>>;
    return Object.entries(refs).map(([tmdbId, ref]) => ({
      rating: ref.rating,
      seasons: watchData[tmdbId]?.seasons
        ? Object.values(watchData[tmdbId].seasons as Record<string, unknown>)
        : [],
    })) as BadgeSeriesItem[];
  }

  private async getMoviesData(): Promise<BadgeMovieItem[]> {
    const snapshot = await firebase.database().ref(`users/${this.userId}/movies`).once('value');
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val() as Record<string, Record<string, unknown>>).map((ref) => ({
      rating: ref.rating,
    })) as BadgeMovieItem[];
  }

  private async getActivitiesData(): Promise<unknown[]> {
    const snapshot = await firebase.database().ref(`users/${this.userId}/activities`).once('value');
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  }

  private async getBadgeCounters(): Promise<BadgeCounters> {
    const snapshot = await firebase
      .database()
      .ref(`users/${this.userId}/badgeCounters`)
      .once('value');
    return snapshot.exists() ? (snapshot.val() as BadgeCounters) : {};
  }

  // Badge Management
  async getUserBadges(): Promise<EarnedBadge[]> {
    if (this.isCacheValid() && this.cachedBadges) {
      return this.cachedBadges;
    }

    const snapshot = await firebase.database().ref(`users/${this.userId}/badges`).once('value');

    this.cachedBadges = snapshot.exists() ? Object.values(snapshot.val()) : [];
    return this.cachedBadges;
  }

  private async saveBadge(badge: EarnedBadge): Promise<void> {
    await firebase
      .database()
      .ref(`users/${this.userId}/badges/${badge.id}`)
      .set({
        ...badge,
        earnedAt: firebase.database.ServerValue.TIMESTAMP,
      });
  }

  /**
   * 📊 Badge-Fortschritt berechnen für nicht erreichte Badges
   */
  async getBadgeProgress(badgeId: string): Promise<BadgeProgress | null> {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!badge) return null;

    const currentBadges = await this.getUserBadges();
    if (currentBadges.some((b) => b.id === badgeId)) return null;

    const userData = await this.getUserData();
    const { series, movies, badgeCounters } = userData;

    switch (badge.category) {
      case 'binge':
        return getBingeProgress(badge, badgeCounters);

      case 'quickwatch':
        return getQuickwatchProgress(badge, badgeCounters);

      case 'marathon':
        return getMarathonProgress(badge, badgeCounters);

      case 'streak':
        return getStreakProgress(badge, badgeCounters);

      case 'rewatch':
        return getRewatchProgress(badge, series);

      case 'series_explorer':
        return getExplorerProgress(badge, series);

      case 'collector':
        return getCollectorProgress(badge, series, movies);

      case 'social':
        return await getSocialProgress(badge, this.userId);

      default:
        return null;
    }
  }

  /**
   * 📈 Fortschritt für alle nicht-erreichten Badges
   */
  async getAllBadgeProgress(): Promise<Record<string, BadgeProgress>> {
    if (this.isCacheValid() && this.cachedProgress) {
      const currentBadges = await this.getUserBadges();
      const earnedIds = new Set(currentBadges.map((b) => b.id));

      const updatedProgress: Record<string, BadgeProgress> = {};
      const progressCache = this.cachedProgress;
      if (progressCache) {
        Object.keys(progressCache).forEach((badgeId) => {
          if (!earnedIds.has(badgeId)) {
            const progress = progressCache[badgeId];
            if (progress) updatedProgress[badgeId] = progress;
          }
        });
      }

      const userData = this.cachedData;
      if (userData?.badgeCounters) {
        Object.keys(updatedProgress).forEach((badgeId) => {
          const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
          if (badge?.category === 'binge' && badge.requirements.timeframe) {
            const newProgress = getBingeProgress(badge, userData.badgeCounters);
            if (newProgress) {
              updatedProgress[badgeId] = newProgress;
            } else {
              delete updatedProgress[badgeId];
            }
          }
        });
      }

      return updatedProgress;
    }

    const currentBadges = await this.getUserBadges();
    const earnedIds = new Set(currentBadges.map((b) => b.id));

    const [series, movies, badgeCounters] = await Promise.all([
      this.getSeriesData(),
      this.getMoviesData(),
      this.getBadgeCounters(),
    ]);

    this.cachedData = { series, movies, activities: [], badgeCounters };
    this.lastCacheTime = Date.now();

    const progressData: Record<string, BadgeProgress> = {};

    for (const badge of BADGE_DEFINITIONS) {
      if (earnedIds.has(badge.id)) continue;

      let progress: BadgeProgress | null = null;

      switch (badge.category) {
        case 'binge':
          progress = getBingeProgress(badge, badgeCounters);
          break;
        case 'quickwatch':
          progress = getQuickwatchProgress(badge, badgeCounters);
          break;
        case 'marathon':
          progress = getMarathonProgress(badge, badgeCounters);
          break;
        case 'streak':
          progress = getStreakProgress(badge, badgeCounters);
          break;
        case 'rewatch':
          progress = getRewatchProgress(badge, series);
          break;
        case 'series_explorer':
          progress = getExplorerProgress(badge, series);
          break;
        case 'collector':
          progress = getCollectorProgress(badge, series, movies);
          break;
        case 'social':
          progress = await getSocialProgress(badge, this.userId);
          break;
      }

      if (progress) {
        progressData[badge.id] = progress;
      }
    }

    this.cachedProgress = progressData;
    return progressData;
  }

  /**
   * 📈 Fortschritt für alle Badges einer Kategorie
   */
  async getCategoryProgress(category: BadgeCategory): Promise<BadgeProgress[]> {
    const categoryBadges = BADGE_DEFINITIONS.filter((b) => b.category === category);
    const progressList: BadgeProgress[] = [];

    for (const badge of categoryBadges) {
      const progress = await this.getBadgeProgress(badge.id);
      if (progress) {
        progressList.push(progress);
      }
    }

    return progressList;
  }

  /**
   * 🔄 Alle Badges neu berechnen (für Migration/Reparatur)
   */
  async recalculateAllBadges(): Promise<EarnedBadge[]> {
    this.cachedData = null;
    return this.checkForNewBadges();
  }

  /**
   * 🧹 Invalidate Cache (nach großen Änderungen)
   */
  invalidateCache(): void {
    this.cachedData = null;
    this.cachedBadges = null;
    this.cachedProgress = null;
    this.lastCacheTime = 0;
  }

  /**
   * 🔍 Prüfe ob Cache noch gültig ist
   */
  isCacheValid(): boolean {
    const now = Date.now();
    return this.cachedData !== null && now - this.lastCacheTime < this.CACHE_DURATION;
  }

  /**
   * 🐛 Debug Social Badges - für Testing
   */
  async debugSocialBadges(): Promise<{
    friendsCount: number;
    socialBadges: Badge[];
    earnedSocialBadges: EarnedBadge[];
  }> {
    const friendsSnapshot = await firebase
      .database()
      .ref(`users/${this.userId}/friends`)
      .once('value');
    const friendsCount = friendsSnapshot.exists() ? Object.keys(friendsSnapshot.val()).length : 0;

    const socialBadges = BADGE_DEFINITIONS.filter((b) => b.category === 'social');
    const currentBadges = await this.getUserBadges();
    const earnedSocialBadges = currentBadges.filter((b) => b.category === 'social');

    return { friendsCount, socialBadges, earnedSocialBadges };
  }
}

// Singleton Export
const offlineBadgeSystemInstances = new Map<string, OfflineBadgeSystem>();

export const getOfflineBadgeSystem = (userId: string): OfflineBadgeSystem => {
  if (!offlineBadgeSystemInstances.has(userId)) {
    offlineBadgeSystemInstances.set(userId, new OfflineBadgeSystem(userId));
  }
  return offlineBadgeSystemInstances.get(userId) as OfflineBadgeSystem;
};

// Global Debug Functions für Browser Console
registerBadgeDebugTools();

export default OfflineBadgeSystem;
