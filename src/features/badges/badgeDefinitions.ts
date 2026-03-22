/**
 * Badge Definitions - Saubere Definition aller Badges
 */

export type BadgeCategory =
  | 'binge'
  | 'quickwatch'
  | 'marathon'
  | 'streak'
  | 'rewatch'
  | 'series_explorer'
  | 'collector'
  | 'social';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Badge {
  id: string;
  category: BadgeCategory;
  tier: BadgeTier;
  name: string;
  description: string;
  emoji?: string; // Optional - now using BadgeIcons component instead
  color: string;
  requirements: {
    episodes?: number;
    seasons?: number;
    days?: number;
    series?: number;
    ratings?: number;
    friends?: number;
    timeframe?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface EarnedBadge extends Badge {
  earnedAt: number;
  progress?: {
    current: number;
    total: number;
  };
  details?: string;
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  total: number;
  lastUpdated: number;
  timeRemaining?: number; // Sekunden bis Session abläuft
  sessionActive?: boolean; // Ob gerade eine Session läuft
}

export { BADGE_DEFINITIONS } from './badgeDefinitionsData';
