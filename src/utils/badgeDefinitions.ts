/**
 * 🏆 Badge Definitions - Saubere Definition aller Badges
 */

export type BadgeCategory =
  | 'binge'
  | 'quickwatch'
  | 'marathon'
  | 'streak'
  | 'rewatch'
  | 'series_explorer'
  | 'collector'
  | 'social'
  | 'completion'
  | 'dedication';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Badge {
  id: string;
  category: BadgeCategory;
  tier: BadgeTier;
  name: string;
  description: string;
  emoji: string;
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
}

// 🏆 Badge-Definitionen (kompakt)
export const BADGE_DEFINITIONS: Badge[] = [
  // 🍿 BINGE BADGES
  {
    id: 'binge_bronze',
    category: 'binge',
    tier: 'bronze',
    name: 'Snack-Session',
    description: '3 Episoden hintereinander geschaut',
    emoji: '🍿',
    color: '#cd7f32',
    requirements: { episodes: 3, timeframe: '2hours' },
    rarity: 'common',
  },
  {
    id: 'binge_bronze_plus',
    category: 'binge',
    tier: 'bronze',
    name: 'Appetit-Anreger',
    description: '5 Episoden hintereinander geschaut',
    emoji: '🥨',
    color: '#cd7f32',
    requirements: { episodes: 5, timeframe: '2hours' },
    rarity: 'common',
  },
  {
    id: 'binge_silver',
    category: 'binge',
    tier: 'silver',
    name: 'Couch-Potato',
    description: '8 Episoden hintereinander geschaut',
    emoji: '🛋️',
    color: '#c0c0c0',
    requirements: { episodes: 8, timeframe: '4hours' },
    rarity: 'rare',
  },
  {
    id: 'binge_silver_plus',
    category: 'binge',
    tier: 'silver',
    name: 'Serien-Schnürer',
    description: '12 Episoden hintereinander geschaut',
    emoji: '📺',
    color: '#c0c0c0',
    requirements: { episodes: 12, timeframe: '4hours' },
    rarity: 'rare',
  },
  {
    id: 'binge_gold',
    category: 'binge',
    tier: 'gold',
    name: 'Binge-Meister',
    description: '15 Episoden an einem Tag geschaut',
    emoji: '🏆',
    color: '#ffd700',
    requirements: { episodes: 15, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_gold_plus',
    category: 'binge',
    tier: 'gold',
    name: 'Binge-König',
    description: '20 Episoden an einem Tag geschaut',
    emoji: '👑',
    color: '#ffd700',
    requirements: { episodes: 20, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_platinum',
    category: 'binge',
    tier: 'platinum',
    name: 'Binge-Monster',
    description: '25 Episoden an einem Tag verschlungen',
    emoji: '👹',
    color: '#e5e4e2',
    requirements: { episodes: 25, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_diamond',
    category: 'binge',
    tier: 'diamond',
    name: 'Binge-Gott',
    description: '35 Episoden an einem Wochenende beendet',
    emoji: '🔥',
    color: '#b9f2ff',
    requirements: { episodes: 35, timeframe: '2days' },
    rarity: 'legendary',
  },

  // ⚡ QUICKWATCH BADGES
  {
    id: 'quickwatch_bronze',
    category: 'quickwatch',
    tier: 'bronze',
    name: 'Früher Vogel',
    description: '3 Episoden am Veröffentlichungstag geschaut',
    emoji: '⚡',
    color: '#cd7f32',
    requirements: { episodes: 3 },
    rarity: 'common',
  },
  {
    id: 'quickwatch_silver',
    category: 'quickwatch',
    tier: 'silver',
    name: 'Day One Fan',
    description: '8 Episoden am Veröffentlichungstag geschaut',
    emoji: '🌅',
    color: '#c0c0c0',
    requirements: { episodes: 8 },
    rarity: 'rare',
  },
  {
    id: 'quickwatch_gold',
    category: 'quickwatch',
    tier: 'gold',
    name: 'Release Hunter',
    description: '15 Episoden am Veröffentlichungstag geschaut',
    emoji: '🎯',
    color: '#ffd700',
    requirements: { episodes: 15 },
    rarity: 'epic',
  },

  // 📺 MARATHON BADGES
  {
    id: 'marathon_bronze',
    category: 'marathon',
    tier: 'bronze',
    name: 'Serien-Fan',
    description: '15 Episoden in einer Woche geschaut',
    emoji: '📺',
    color: '#cd7f32',
    requirements: { episodes: 15, timeframe: '1week' },
    rarity: 'common',
  },
  {
    id: 'marathon_silver',
    category: 'marathon',
    tier: 'silver',
    name: 'Wochenend-Warrior',
    description: '25 Episoden in einer Woche geschaut',
    emoji: '⚔️',
    color: '#c0c0c0',
    requirements: { episodes: 25, timeframe: '1week' },
    rarity: 'rare',
  },
  {
    id: 'marathon_gold',
    category: 'marathon',
    tier: 'gold',
    name: 'Marathon-Meister',
    description: '40 Episoden in einer Woche geschaut',
    emoji: '🏃‍♂️',
    color: '#ffd700',
    requirements: { episodes: 40, timeframe: '1week' },
    rarity: 'epic',
  },

  // 🔥 STREAK BADGES
  {
    id: 'streak_bronze',
    category: 'streak',
    tier: 'bronze',
    name: 'Gewohnheitstier',
    description: '7 Tage in Folge Serien geschaut',
    emoji: '🔥',
    color: '#cd7f32',
    requirements: { days: 7 },
    rarity: 'common',
  },
  {
    id: 'streak_silver',
    category: 'streak',
    tier: 'silver',
    name: 'Serien-Routine',
    description: '14 Tage in Folge Serien geschaut',
    emoji: '⚡',
    color: '#c0c0c0',
    requirements: { days: 14 },
    rarity: 'rare',
  },
  {
    id: 'streak_gold',
    category: 'streak',
    tier: 'gold',
    name: 'Unaufhaltsam',
    description: '30 Tage in Folge Serien geschaut',
    emoji: '💎',
    color: '#ffd700',
    requirements: { days: 30 },
    rarity: 'epic',
  },

  // 🔄 REWATCH BADGES
  {
    id: 'rewatch_bronze',
    category: 'rewatch',
    tier: 'bronze',
    name: 'Zweiter Blick',
    description: '5 Episoden als Rewatch geschaut',
    emoji: '🔄',
    color: '#cd7f32',
    requirements: { episodes: 5 },
    rarity: 'common',
  },
  {
    id: 'rewatch_silver',
    category: 'rewatch',
    tier: 'silver',
    name: 'Nostalgie-Fan',
    description: '15 Episoden als Rewatch geschaut',
    emoji: '💫',
    color: '#c0c0c0',
    requirements: { episodes: 15 },
    rarity: 'rare',
  },
  {
    id: 'rewatch_gold',
    category: 'rewatch',
    tier: 'gold',
    name: 'Rewatch-König',
    description: '30 Episoden als Rewatch geschaut',
    emoji: '👑',
    color: '#ffd700',
    requirements: { episodes: 30 },
    rarity: 'epic',
  },

  // 🗺️ EXPLORER BADGES
  {
    id: 'explorer_bronze',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Entdecker',
    description: '25 verschiedene Serien angefangen',
    emoji: '🗺️',
    color: '#cd7f32',
    requirements: { series: 25 },
    rarity: 'common',
  },
  {
    id: 'explorer_silver',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Serien-Scout',
    description: '50 verschiedene Serien angefangen',
    emoji: '🔍',
    color: '#c0c0c0',
    requirements: { series: 50 },
    rarity: 'rare',
  },
  {
    id: 'explorer_gold',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Genre-Meister',
    description: '100 verschiedene Serien angefangen',
    emoji: '🌍',
    color: '#ffd700',
    requirements: { series: 100 },
    rarity: 'epic',
  },
  {
    id: 'explorer_platinum',
    category: 'series_explorer',
    tier: 'platinum',
    name: 'Serien-Weltreisender',
    description: '200 verschiedene Serien angefangen',
    emoji: '✈️',
    color: '#e5e4e2',
    requirements: { series: 200 },
    rarity: 'legendary',
  },

  // ⭐ COLLECTOR BADGES
  {
    id: 'collector_bronze',
    category: 'collector',
    tier: 'bronze',
    name: 'Kritiker',
    description: '10 Serien oder Filme bewertet',
    emoji: '⭐',
    color: '#cd7f32',
    requirements: { ratings: 10 },
    rarity: 'common',
  },
  {
    id: 'collector_silver',
    category: 'collector',
    tier: 'silver',
    name: 'Bewertungs-Experte',
    description: '25 Serien oder Filme bewertet',
    emoji: '🌟',
    color: '#c0c0c0',
    requirements: { ratings: 25 },
    rarity: 'rare',
  },
  {
    id: 'collector_gold',
    category: 'collector',
    tier: 'gold',
    name: 'Rating-Meister',
    description: '50 Serien oder Filme bewertet',
    emoji: '⭐',
    color: '#ffd700',
    requirements: { ratings: 50 },
    rarity: 'epic',
  },
  {
    id: 'collector_platinum',
    category: 'collector',
    tier: 'platinum',
    name: 'Bewertungs-Gott',
    description: '100 Serien oder Filme bewertet',
    emoji: '🏆',
    color: '#e5e4e2',
    requirements: { ratings: 100 },
    rarity: 'legendary',
  },

  // 🤝 SOCIAL BADGES
  {
    id: 'social_bronze',
    category: 'social',
    tier: 'bronze',
    name: 'Gesellig',
    description: '3 Freunde hinzugefügt',
    emoji: '🤝',
    color: '#cd7f32',
    requirements: { friends: 3 },
    rarity: 'common',
  },
  {
    id: 'social_silver',
    category: 'social',
    tier: 'silver',
    name: 'Serien-Buddy',
    description: '8 Freunde hinzugefügt',
    emoji: '👥',
    color: '#c0c0c0',
    requirements: { friends: 8 },
    rarity: 'rare',
  },
  {
    id: 'social_gold',
    category: 'social',
    tier: 'gold',
    name: 'Community-Leader',
    description: '15 Freunde hinzugefügt',
    emoji: '👑',
    color: '#ffd700',
    requirements: { friends: 15 },
    rarity: 'epic',
  },
];