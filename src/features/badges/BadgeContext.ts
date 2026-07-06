import { createContext, useContext } from 'react';
import type { EarnedBadge } from './badgeDefinitions';

export interface BadgeContextType {
  showBadgeOverview: () => void;
  newBadges: EarnedBadge[];
  clearNewBadges: () => void;
  unreadBadgesCount: number;
}

export const BadgeContext = createContext<BadgeContextType | null>(null);

export const useBadges = (): BadgeContextType => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadges must be used within a BadgeProvider');
  }
  return context;
};
