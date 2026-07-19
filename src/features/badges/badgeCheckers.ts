import { dbRef, userPath } from '../../services/db/ref';
import { t } from '../../services/i18n';
import type { Badge } from './badgeDefinitions';
import type {
  BadgeCounters,
  BadgeMovieItem,
  BadgeSeason,
  BadgeSeriesItem,
  BadgeUserData,
} from './badgeTypes';

export function hasValidRating(rating: number | Record<string, number>): boolean {
  if (typeof rating === 'number') return rating > 0;
  if (typeof rating === 'object') {
    return Object.values(rating).some((r) => typeof r === 'number' && r > 0);
  }
  return false;
}

export function checkExplorerBadge(
  badge: Badge,
  series: BadgeSeriesItem[]
): { earned: boolean; details?: string } | null {
  const seriesCount = series.length;

  if (seriesCount >= (badge.requirements.series ?? 0)) {
    return {
      earned: true,
      details: t('{n} verschiedene Serien entdeckt', { n: seriesCount }),
    };
  }
  return null;
}

export function checkCollectorBadge(
  badge: Badge,
  series: BadgeSeriesItem[],
  movies: BadgeMovieItem[]
): { earned: boolean; details?: string } | null {
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

  if (ratingCount >= (badge.requirements.ratings ?? 0)) {
    return {
      earned: true,
      details: t('{n} Bewertungen abgegeben', { n: ratingCount }),
    };
  }
  return null;
}

export async function checkSocialBadgeFromCounters(
  badge: Badge,
  userId: string,
  _badgeCounters: BadgeCounters,
  _series: BadgeSeriesItem[],
  _movies: BadgeMovieItem[]
): Promise<{ earned: boolean; details?: string } | null> {
  const friendsSnapshot = await dbRef(userPath(userId, 'friends')).once('value');
  const friendsCount = friendsSnapshot.exists() ? Object.keys(friendsSnapshot.val()).length : 0;

  if (friendsCount >= (badge.requirements.friends ?? 0)) {
    return {
      earned: true,
      details: t('{n} Freunde hinzugefügt', { n: friendsCount }),
    };
  }
  return null;
}

export function getTimeframeDescription(timeframe: string): string {
  switch (timeframe) {
    case '10hours':
      return t('10 Stunden');
    case '1day':
      return t('einem Tag');
    case '2days':
      return t('zwei Tagen');
    default:
      return t('einer Session');
  }
}

export function getTimeWindowMs(timeframe?: string): number | null {
  if (!timeframe) return null;
  const map: Record<string, number> = {
    '10hours': 10 * 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000,
    '2days': 2 * 24 * 60 * 60 * 1000,
    '1week': 7 * 24 * 60 * 60 * 1000,
    '1month': 30 * 24 * 60 * 60 * 1000,
    '1year': 365 * 24 * 60 * 60 * 1000,
  };
  return map[timeframe] || null;
}

export function isSeasonCompleted(season: BadgeSeason): boolean {
  if (!season.episodes || !Array.isArray(season.episodes)) return false;
  return season.episodes.every((ep) => ep.watched === true);
}

export function getSeasonCompletionTime(season: BadgeSeason): number | null {
  if (!season.episodes || !Array.isArray(season.episodes)) return null;

  let latestWatchTime = 0;
  for (const ep of season.episodes) {
    if (ep.watched && ep.watchedAt) {
      latestWatchTime = Math.max(latestWatchTime, ep.watchedAt);
    }
  }

  return latestWatchTime || Date.now();
}

export function checkSeasonBadgeFromRealData(
  badge: Badge,
  series: BadgeSeriesItem[]
): { earned: boolean; details?: string } | null {
  try {
    const timeWindowMs = getTimeWindowMs(badge.requirements.timeframe);
    if (!timeWindowMs) return null;

    const cutoff = Date.now() - timeWindowMs;
    let completedSeasonsInTimeframe = 0;

    series.forEach((s) => {
      if (s.seasons && Array.isArray(s.seasons)) {
        s.seasons.forEach((season) => {
          if (isSeasonCompleted(season)) {
            const completionTime = getSeasonCompletionTime(season);
            if (completionTime && completionTime >= cutoff) {
              completedSeasonsInTimeframe++;
            }
          }
        });
      }
    });

    if (completedSeasonsInTimeframe >= (badge.requirements.seasons ?? 0)) {
      return {
        earned: true,
        details:
          completedSeasonsInTimeframe > 1
            ? t('{n} Staffeln in {tf} komplett geschaut', {
                n: completedSeasonsInTimeframe,
                tf: badge.requirements.timeframe ?? '',
              })
            : t('{n} Staffel in {tf} komplett geschaut', {
                n: completedSeasonsInTimeframe,
                tf: badge.requirements.timeframe ?? '',
              }),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function checkBingeBadgeFromSeries(
  badge: Badge,
  _series: BadgeSeriesItem[],
  _activities: unknown[],
  cachedData: BadgeUserData | null
): { earned: boolean; details?: string } | null {
  if ((badge.requirements.episodes ?? 0) && badge.requirements.timeframe) {
    const timeframe = badge.requirements.timeframe;
    const badgeCounters = cachedData?.badgeCounters || {};

    const currentBinge = badgeCounters.bingeWindows?.[timeframe]?.count || 0;

    if (currentBinge >= (badge.requirements.episodes ?? 0)) {
      return {
        earned: true,
        details: t('{n} Episoden in {tf}', {
          n: currentBinge,
          tf: getTimeframeDescription(timeframe),
        }),
      };
    }
  }

  if ((badge.requirements.episodes ?? 0) && !badge.requirements.timeframe) {
    const maxBingeEpisodes = getCounterValue(cachedData, 'maxBingeEpisodes');
    if (maxBingeEpisodes >= (badge.requirements.episodes ?? 0)) {
      return {
        earned: true,
        details: t('{n} Episoden in einer Binge-Session', { n: maxBingeEpisodes }),
      };
    }
  }

  if (badge.requirements.seasons ?? 0) {
    return checkSeasonBadgeFromRealData(badge, _series);
  }

  return null;
}

export function getCounterValue(cachedData: BadgeUserData | null, counterName: string): number {
  if (cachedData && cachedData.badgeCounters) {
    const value = cachedData.badgeCounters[counterName];
    return typeof value === 'number' ? value : 0;
  }
  return 0;
}

export function checkMarathonBadgeFromSeries(
  badge: Badge,
  _series: BadgeSeriesItem[],
  _activities: unknown[],
  cachedData: BadgeUserData | null
): { earned: boolean; details?: string } | null {
  const marathonWeeks = cachedData?.badgeCounters?.marathonWeeks || {};
  let maxWeeklyEpisodes = 0;
  let bestWeek = '';

  Object.entries(marathonWeeks).forEach(([weekKey, episodes]) => {
    if (episodes > maxWeeklyEpisodes) {
      maxWeeklyEpisodes = episodes;
      bestWeek = weekKey;
    }
  });

  if (maxWeeklyEpisodes >= (badge.requirements.episodes ?? 0)) {
    return {
      earned: true,
      details: t('{n} Episoden in einer Woche ({week})', { n: maxWeeklyEpisodes, week: bestWeek }),
    };
  }
  return null;
}

export function checkStreakBadgeFromCounters(
  badge: Badge,
  badgeCounters: BadgeCounters
): { earned: boolean; details?: string } | null {
  const currentStreak = badgeCounters.currentStreak || 0;

  if (currentStreak >= (badge.requirements.days ?? 0)) {
    return {
      earned: true,
      details: t('{n} Tage Streak', { n: currentStreak }),
    };
  }
  return null;
}

export function checkQuickwatchBadgeFromCounters(
  badge: Badge,
  badgeCounters: BadgeCounters
): { earned: boolean; details?: string } | null {
  const quickwatchCount = badgeCounters.quickwatchEpisodes || 0;

  if (quickwatchCount >= (badge.requirements.episodes ?? 0)) {
    return {
      earned: true,
      details: t('{n} Quickwatch Episoden', { n: quickwatchCount }),
    };
  }
  return null;
}

export function checkRewatchBadgeFromSeries(
  badge: Badge,
  series: BadgeSeriesItem[]
): { earned: boolean; details?: string } | null {
  let rewatchEpisodes = 0;

  series.forEach((s) => {
    if (s.seasons && Array.isArray(s.seasons)) {
      s.seasons.forEach((season) => {
        if (season.episodes && Array.isArray(season.episodes)) {
          season.episodes.forEach((ep) => {
            if (ep.watched && ep.watchCount && ep.watchCount > 1) {
              rewatchEpisodes += ep.watchCount - 1;
            }
          });
        }
      });
    }
  });

  if (rewatchEpisodes >= (badge.requirements.episodes ?? 0)) {
    return {
      earned: true,
      details: t('{n} Rewatch Episoden', { n: rewatchEpisodes }),
    };
  }
  return null;
}

export function checkBadgeRequirement(
  badge: Badge,
  userData: BadgeUserData,
  userId: string,
  cachedData: BadgeUserData | null
):
  | Promise<{ earned: boolean; details?: string } | null>
  | { earned: boolean; details?: string }
  | null {
  const { series, movies, badgeCounters } = userData;

  switch (badge.category) {
    case 'series_explorer':
      return checkExplorerBadge(badge, series);

    case 'collector':
      return checkCollectorBadge(badge, series, movies);

    case 'social':
      return checkSocialBadgeFromCounters(badge, userId, badgeCounters, series, movies);

    case 'binge':
      return checkBingeBadgeFromSeries(badge, series, userData.activities, cachedData);

    case 'marathon':
      return checkMarathonBadgeFromSeries(badge, series, userData.activities, cachedData);

    case 'streak':
      return checkStreakBadgeFromCounters(badge, badgeCounters);

    case 'quickwatch':
      return checkQuickwatchBadgeFromCounters(badge, badgeCounters);

    case 'rewatch':
      return checkRewatchBadgeFromSeries(badge, series);

    default:
      return null;
  }
}
