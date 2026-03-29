import type { BadgeUserData } from './badgeTypes';
import { getOfflineBadgeSystem } from './offlineBadgeSystem';

export function registerBadgeDebugTools(): void {
  if (typeof window === 'undefined') return;

  (window as unknown as Record<string, unknown>).debugBadges = async (userId: string) => {
    const badgeSystem = getOfflineBadgeSystem(userId);
    const debug = await badgeSystem.debugSocialBadges();

    badgeSystem.invalidateCache();
    const newBadges = await badgeSystem.checkForNewBadges();

    return { debug, newBadges };
  };

  (window as unknown as Record<string, unknown>).badgeDebugTools = {
    getCurrentUserId: async () => {
      try {
        const firebase = await import('firebase/compat/app');
        const user = firebase.default.auth().currentUser;
        if (user) {
          return user.uid;
        }
      } catch {
        // Firebase auth not available
      }

      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(
        (key) => key.includes('user') || key.includes('uid') || key.length === 28
      );

      if (userKeys.length > 0) {
        return userKeys[0];
      }

      return null;
    },
    showCounters: async (userId: string) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      const counters = await badgeCounterService.getAllCounters(userId);
      return counters;
    },

    simulateBinge: async (userId: string, episodeCount: number = 5) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      for (let i = 0; i < episodeCount; i++) {
        await badgeCounterService.recordBingeEpisode(userId);
      }
    },

    simulateStreak: async (userId: string, days: number = 7) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      await badgeCounterService.incrementCounter(userId, 'currentStreak', days);
    },

    simulateQuickwatch: async (userId: string, count: number = 5) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      for (let i = 0; i < count; i++) {
        await badgeCounterService.incrementQuickwatchCounter(userId);
      }
    },

    showBadgeProgress: async (userId: string) => {
      const badgeSystem = getOfflineBadgeSystem(userId);
      const userData = await (
        badgeSystem as unknown as { getUserData(): Promise<BadgeUserData> }
      ).getUserData();
      const { series, movies } = userData;

      let ratingCount = 0;
      series.forEach((s) => s.rating && ratingCount++);
      movies.forEach((m) => m.rating && ratingCount++);

      return userData;
    },

    resetCounters: async (userId: string) => {
      const { badgeCounterService } = await import('./badgeCounterService');
      await badgeCounterService.clearAllCounters(userId);
    },
  };
}
