import firebase from 'firebase/compat/app';
import type { Badge, BadgeProgress } from './badgeDefinitions';
import type { BadgeCounters, BadgeMovieItem, BadgeSeriesItem } from './badgeTypes';
import { hasValidRating } from './badgeCheckers';

export function getBingeProgress(badge: Badge, badgeCounters: BadgeCounters): BadgeProgress | null {
  if (!badge.requirements.episodes || !badge.requirements.timeframe) return null;

  const timeframe = badge.requirements.timeframe;
  const bingeWindow = badgeCounters.bingeWindows?.[timeframe];

  let current = 0;
  let timeRemaining: number | undefined;
  let sessionActive = false;

  if (bingeWindow?.windowEnd) {
    const now = Date.now();
    if (now < bingeWindow.windowEnd) {
      current = bingeWindow.count || 0;
      timeRemaining = Math.ceil((bingeWindow.windowEnd - now) / 1000);
      sessionActive = true;
    } else {
      current = 0;
    }
  }

  return {
    badgeId: badge.id,
    current,
    total: badge.requirements.episodes,
    lastUpdated: Date.now(),
    timeRemaining,
    sessionActive,
  };
}

export function getQuickwatchProgress(
  badge: Badge,
  badgeCounters: BadgeCounters
): BadgeProgress | null {
  if (!badge.requirements.episodes) return null;

  return {
    badgeId: badge.id,
    current: badgeCounters.quickwatchEpisodes || 0,
    total: badge.requirements.episodes,
    lastUpdated: Date.now(),
  };
}

export function getMarathonProgress(
  badge: Badge,
  badgeCounters: BadgeCounters
): BadgeProgress | null {
  if (!badge.requirements.episodes) return null;

  const marathonWeeks = badgeCounters.marathonWeeks || {};

  const currentWeekKey = getCurrentWeekKey();
  const currentWeekEpisodes = marathonWeeks[currentWeekKey] || 0;
  const timeRemainingInWeek = getTimeRemainingInWeek();

  return {
    badgeId: badge.id,
    current: currentWeekEpisodes,
    total: badge.requirements.episodes,
    lastUpdated: Date.now(),
    timeRemaining: timeRemainingInWeek,
    sessionActive: currentWeekEpisodes > 0,
  };
}

export function getTimeRemainingInWeek(): number {
  const now = new Date();
  const endOfWeek = new Date(now);

  const daysUntilSunday = 7 - now.getDay();
  endOfWeek.setDate(now.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
  endOfWeek.setHours(23, 59, 59, 999);

  return Math.max(0, Math.ceil((endOfWeek.getTime() - now.getTime()) / 1000));
}

export function getCurrentWeekKey(): string {
  const now = new Date();

  const target = new Date(now.getTime());
  const dayOfWeek = (now.getDay() + 6) % 7;
  target.setDate(now.getDate() - dayOfWeek + 3);

  const year = target.getFullYear();
  const firstThursday = new Date(year, 0, 4);
  const weekNumber = Math.ceil(
    (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000) + 1
  );

  return `${year}-W${weekNumber}`;
}

export function getStreakProgress(
  badge: Badge,
  badgeCounters: BadgeCounters
): BadgeProgress | null {
  if (!badge.requirements.days) return null;

  return {
    badgeId: badge.id,
    current: badgeCounters.currentStreak || 0,
    total: badge.requirements.days,
    lastUpdated: Date.now(),
  };
}

export function getRewatchProgress(badge: Badge, series: BadgeSeriesItem[]): BadgeProgress | null {
  if (!badge.requirements.episodes) return null;

  let rewatchCount = 0;
  series.forEach((s) => {
    if (s.seasons && Array.isArray(s.seasons)) {
      s.seasons.forEach((season) => {
        if (season.episodes && Array.isArray(season.episodes)) {
          season.episodes.forEach((ep) => {
            if (ep.watchCount && ep.watchCount > 1) {
              rewatchCount += ep.watchCount - 1;
            }
          });
        }
      });
    }
  });

  return {
    badgeId: badge.id,
    current: rewatchCount,
    total: badge.requirements.episodes,
    lastUpdated: Date.now(),
  };
}

export function getExplorerProgress(badge: Badge, series: BadgeSeriesItem[]): BadgeProgress | null {
  if (!badge.requirements.series) return null;

  return {
    badgeId: badge.id,
    current: series.length,
    total: badge.requirements.series,
    lastUpdated: Date.now(),
  };
}

export function getCollectorProgress(
  badge: Badge,
  series: BadgeSeriesItem[],
  movies: BadgeMovieItem[]
): BadgeProgress | null {
  if (!badge.requirements.ratings) return null;

  let ratingCount = 0;
  series.forEach((s) => {
    if (s.rating && hasValidRating(s.rating)) {
      ratingCount++;
    }
  });
  movies.forEach((m) => {
    if (m.rating && hasValidRating(m.rating)) {
      ratingCount++;
    }
  });

  return {
    badgeId: badge.id,
    current: ratingCount,
    total: badge.requirements.ratings,
    lastUpdated: Date.now(),
  };
}

export async function getSocialProgress(
  badge: Badge,
  userId: string
): Promise<BadgeProgress | null> {
  if (!badge.requirements.friends) return null;

  const friendsSnapshot = await firebase.database().ref(`users/${userId}/friends`).once('value');
  const friendsCount = friendsSnapshot.exists() ? Object.keys(friendsSnapshot.val()).length : 0;

  return {
    badgeId: badge.id,
    current: friendsCount,
    total: badge.requirements.friends,
    lastUpdated: Date.now(),
  };
}
