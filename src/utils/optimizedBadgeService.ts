/**
 * 🚀 Optimierter Badge Service mit intelligentem Caching
 * Reduziert Firebase-Reads drastisch durch smarte Cache-Strategien
 */

import firebase from 'firebase/compat/app';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class OptimizedBadgeService {
  private static instance: OptimizedBadgeService;
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 Minuten
  private readonly ACTIVITY_CACHE_TTL = 2 * 60 * 1000; // 2 Minuten für Activities

  static getInstance(): OptimizedBadgeService {
    if (!OptimizedBadgeService.instance) {
      OptimizedBadgeService.instance = new OptimizedBadgeService();
    }
    return OptimizedBadgeService.instance;
  }

  private getCacheKey(userId: string, type: string, extra?: string): string {
    return `${userId}:${type}${extra ? `:${extra}` : ''}`;
  }

  private isExpired(entry: CacheEntry<any>, customTTL?: number): boolean {
    const ttl = customTTL || this.CACHE_TTL;
    return Date.now() - entry.timestamp > ttl;
  }

  /**
   * 🎯 Cachet Badge Activities mit spezieller TTL
   */
  async getBadgeActivities(userId: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(userId, 'badgeActivities');
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached, this.ACTIVITY_CACHE_TTL)) {
      return cached.data;
    }

    const activitiesRef = firebase.database().ref(`badgeActivities/${userId}`);
    const snapshot = await activitiesRef.once('value');
    const activities = Object.values(snapshot.val() || {}) as any[];

    this.cache.set(cacheKey, {
      data: activities,
      timestamp: Date.now(),
    });

    return activities;
  }

  /**
   * 🎯 Cachet User Activities
   */
  async getUserActivities(userId: string, limit?: number): Promise<any[]> {
    const cacheKey = this.getCacheKey(userId, 'activities', limit?.toString());
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    let activitiesRef = firebase.database().ref(`activities/${userId}`);

    if (limit) {
      activitiesRef = activitiesRef.limitToLast(limit) as any;
    }

    const snapshot = await activitiesRef.once('value');
    const activities = Object.values(snapshot.val() || {}) as any[];

    this.cache.set(cacheKey, {
      data: activities,
      timestamp: Date.now(),
    });

    return activities;
  }

  /**
   * 🎯 Cachet Serie Daten
   */
  async getSeriesData(userId: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(userId, 'series');
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    const seriesRef = firebase.database().ref(`${userId}/serien`);
    const snapshot = await seriesRef.once('value');
    const series = Object.values(snapshot.val() || {}) as any[];

    this.cache.set(cacheKey, {
      data: series,
      timestamp: Date.now(),
    });

    return series;
  }

  /**
   * 🎯 Cachet Movie Daten
   */
  async getMoviesData(userId: string): Promise<any[]> {
    const cacheKey = this.getCacheKey(userId, 'movies');
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    const moviesRef = firebase.database().ref(`${userId}/filme`);
    const snapshot = await moviesRef.once('value');
    const movies = Object.values(snapshot.val() || {}) as any[];

    this.cache.set(cacheKey, {
      data: movies,
      timestamp: Date.now(),
    });

    return movies;
  }

  /**
   * 🎯 Batch-Loading für Badge-Calculations
   */
  async getBadgeCalculationData(userId: string): Promise<{
    badgeActivities: any[];
    userActivities: any[];
    series: any[];
    movies: any[];
  }> {
    // Lade alles parallel für bessere Performance
    const [badgeActivities, userActivities, series, movies] = await Promise.all(
      [
        this.getBadgeActivities(userId),
        this.getUserActivities(userId, 1000), // Limit für Performance
        this.getSeriesData(userId),
        this.getMoviesData(userId),
      ]
    );

    return {
      badgeActivities,
      userActivities,
      series,
      movies,
    };
  }

  /**
   * 🧹 Cache invalidieren
   */
  invalidateCache(userId: string, type?: string): void {
    if (type) {
      const pattern = `${userId}:${type}`;
      for (const [key] of this.cache) {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Invalidiere alles für den User
      for (const [key] of this.cache) {
        if (key.startsWith(`${userId}:`)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * 🧹 Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 📊 Cache Statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export Singleton
export const optimizedBadgeService = OptimizedBadgeService.getInstance();

// Auto-cleanup alle 10 Minuten
setInterval(() => {
  optimizedBadgeService.cleanupExpiredCache();
}, 10 * 60 * 1000);
