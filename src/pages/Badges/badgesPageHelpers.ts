import {
  EmojiEvents,
  Explore,
  Groups,
  LocalFireDepartment,
  Movie,
  Refresh,
  Speed,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { createElement } from 'react';
import {
  BADGE_DEFINITIONS,
  Badge,
  BadgeCategory,
  EarnedBadge,
} from '../../features/badges/badgeDefinitions';

export const categories: { key: BadgeCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Alle', icon: createElement(EmojiEvents) },
  { key: 'binge', label: 'Binge', icon: createElement(Movie) },
  { key: 'quickwatch', label: 'Quick', icon: createElement(Speed) },
  { key: 'marathon', label: 'Marathon', icon: createElement(LocalFireDepartment) },
  { key: 'streak', label: 'Streak', icon: createElement(TrendingUp) },
  { key: 'rewatch', label: 'Rewatch', icon: createElement(Refresh) },
  { key: 'series_explorer', label: 'Explorer', icon: createElement(Explore) },
  { key: 'collector', label: 'Collector', icon: createElement(Star) },
  { key: 'social', label: 'Social', icon: createElement(Groups) },
];

export function getEarnedCount(category: BadgeCategory | 'all', earnedBadges: EarnedBadge[]) {
  const categoryBadges =
    category === 'all'
      ? BADGE_DEFINITIONS
      : BADGE_DEFINITIONS.filter((b) => b.category === category);
  return categoryBadges.filter((b) => earnedBadges.some((eb) => eb.id === b.id)).length;
}

export function getTotalCount(category: BadgeCategory | 'all') {
  return category === 'all'
    ? BADGE_DEFINITIONS.length
    : BADGE_DEFINITIONS.filter((b) => b.category === category).length;
}

export function getCategoryBadges(category: BadgeCategory | 'all') {
  return category === 'all'
    ? BADGE_DEFINITIONS
    : BADGE_DEFINITIONS.filter((b) => b.category === category);
}

export function getNextTierInfo(
  badge: Badge,
  earned: boolean,
  isBadgeEarned: (badgeId: string) => boolean
) {
  if (earned) return null;

  const sameCategoryBadges = BADGE_DEFINITIONS.filter((b) => b.category === badge.category);
  const badgeGroups: Record<string, typeof sameCategoryBadges> = {};

  sameCategoryBadges.forEach((b) => {
    const reqKey = Object.keys(b.requirements)
      .filter((k) => k !== 'timeframe')
      .sort()
      .join('_');

    if (!badgeGroups[reqKey]) {
      badgeGroups[reqKey] = [];
    }
    badgeGroups[reqKey].push(b);
  });

  const myReqKey = Object.keys(badge.requirements)
    .filter((k) => k !== 'timeframe')
    .sort()
    .join('_');

  const myGroup = badgeGroups[myReqKey];
  if (!myGroup || myGroup.length <= 1) return null;

  const tierOrder: Record<string, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 4,
    diamond: 5,
  };

  myGroup.sort((a, b) => {
    const aValue = a.requirements.episodes || a.requirements.series || a.requirements.seasons || 0;
    const bValue = b.requirements.episodes || b.requirements.series || b.requirements.seasons || 0;
    if (aValue !== bValue) return aValue - bValue;
    return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
  });

  const currentIndex = myGroup.findIndex((b) => b.id === badge.id);
  if (currentIndex === -1 || currentIndex === 0) return null;

  const previousBadges = myGroup.slice(0, currentIndex);
  const earnedPreviousBadges = previousBadges.filter((b) => isBadgeEarned(b.id));

  if (earnedPreviousBadges.length === previousBadges.length) {
    return { isNextTier: true };
  }

  return null;
}
