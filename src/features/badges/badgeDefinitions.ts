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
  | 'social';

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
  timeRemaining?: number; // Sekunden bis Session abläuft
  sessionActive?: boolean; // Ob gerade eine Session läuft
}

// 🎨 Rarity-basierte Farben
const RARITY_COLORS = {
  common: '#8BC34A', // Frisches Grün
  rare: '#2196F3', // Lebendiges Blau
  epic: '#9C27B0', // Majestätisches Lila
  legendary: '#FF5722', // Kraftvolles Orange-Rot
};

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
    color: RARITY_COLORS.common,
    requirements: { episodes: 3, timeframe: '10hours' },
    rarity: 'common',
  },
  {
    id: 'binge_bronze_plus',
    category: 'binge',
    tier: 'bronze',
    name: 'Appetit-Anreger',
    description: '5 Episoden hintereinander geschaut',
    emoji: '🥨',
    color: RARITY_COLORS.common,
    requirements: { episodes: 5, timeframe: '10hours' },
    rarity: 'common',
  },
  {
    id: 'binge_silver',
    category: 'binge',
    tier: 'silver',
    name: 'Couch-Potato',
    description: '8 Episoden hintereinander geschaut',
    emoji: '🛋️',
    color: RARITY_COLORS.rare,
    requirements: { episodes: 8, timeframe: '10hours' },
    rarity: 'rare',
  },
  {
    id: 'binge_silver_plus',
    category: 'binge',
    tier: 'silver',
    name: 'Serien-Schnürer',
    description: '10 Episoden hintereinander geschaut',
    emoji: '📺',
    color: RARITY_COLORS.rare,
    requirements: { episodes: 10, timeframe: '10hours' },
    rarity: 'rare',
  },
  {
    id: 'binge_gold',
    category: 'binge',
    tier: 'gold',
    name: 'Binge-Meister',
    description: '15 Episoden an einem Tag geschaut',
    emoji: '🏆',
    color: RARITY_COLORS.epic,
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
    color: RARITY_COLORS.epic,
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
    color: RARITY_COLORS.epic,
    requirements: { episodes: 25, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_diamond',
    category: 'binge',
    tier: 'diamond',
    name: 'Binge-Gott',
    description: '35 Episoden in zwei Tagen geschaut',
    emoji: '🔥',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 35, timeframe: '2days' },
    rarity: 'legendary',
  },
  {
    id: 'binge_diamond_plus',
    category: 'binge',
    tier: 'diamond',
    name: 'Binge-Titan',
    description: '50 Episoden in zwei Tagen geschaut',
    emoji: '⚡',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 50, timeframe: '2days' },
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
    color: RARITY_COLORS.common,
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
    color: RARITY_COLORS.rare,
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
    color: RARITY_COLORS.epic,
    requirements: { episodes: 15 },
    rarity: 'epic',
  },
  {
    id: 'quickwatch_platinum',
    category: 'quickwatch',
    tier: 'platinum',
    name: 'Release Predator',
    description: '25 Episoden am Veröffentlichungstag geschaut',
    emoji: '🦅',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 25 },
    rarity: 'legendary',
  },
  {
    id: 'quickwatch_diamond',
    category: 'quickwatch',
    tier: 'diamond',
    name: 'Day Zero Destroyer',
    description: '40 Episoden am Veröffentlichungstag geschaut',
    emoji: '💀',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 40 },
    rarity: 'legendary',
  },

  // 📺 MARATHON BADGES
  {
    id: 'marathon_bronze',
    category: 'marathon',
    tier: 'bronze',
    name: 'Serien-Fan',
    description: '15 Episoden in einer Woche geschaut',
    emoji: '📺',
    color: RARITY_COLORS.common,
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
    color: RARITY_COLORS.rare,
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
    color: RARITY_COLORS.epic,
    requirements: { episodes: 40, timeframe: '1week' },
    rarity: 'epic',
  },
  {
    id: 'marathon_platinum',
    category: 'marathon',
    tier: 'platinum',
    name: 'Wochenend-Titan',
    description: '60 Episoden in einer Woche geschaut',
    emoji: '⚔️',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 60, timeframe: '1week' },
    rarity: 'legendary',
  },
  {
    id: 'marathon_diamond',
    category: 'marathon',
    tier: 'diamond',
    name: 'Serien-Vernichter',
    description: '80 Episoden in einer Woche geschaut',
    emoji: '💀',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 80, timeframe: '1week' },
    rarity: 'legendary',
  },

  // 🔥 STREAK BADGES
  {
    id: 'streak_bronze',
    category: 'streak',
    tier: 'bronze',
    name: 'Gewohnheitstier',
    description: '7 Tage in Folge Serien geschaut',
    emoji: '🔥',
    color: RARITY_COLORS.common,
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
    color: RARITY_COLORS.rare,
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
    color: RARITY_COLORS.epic,
    requirements: { days: 30 },
    rarity: 'epic',
  },
  {
    id: 'streak_platinum',
    category: 'streak',
    tier: 'platinum',
    name: 'Serien-Süchtig',
    description: '60 Tage in Folge Serien geschaut',
    emoji: '🔗',
    color: RARITY_COLORS.legendary,
    requirements: { days: 60 },
    rarity: 'legendary',
  },
  {
    id: 'streak_diamond',
    category: 'streak',
    tier: 'diamond',
    name: 'Ewige Flamme',
    description: '100 Tage in Folge Serien geschaut',
    emoji: '🔥',
    color: RARITY_COLORS.legendary,
    requirements: { days: 100 },
    rarity: 'legendary',
  },

  // 🔄 REWATCH BADGES
  {
    id: 'rewatch_bronze',
    category: 'rewatch',
    tier: 'bronze',
    name: 'Zweiter Blick',
    description: '5 Episoden als Rewatch geschaut',
    emoji: '🔄',
    color: RARITY_COLORS.common,
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
    color: RARITY_COLORS.rare,
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
    color: RARITY_COLORS.epic,
    requirements: { episodes: 30 },
    rarity: 'epic',
  },
  {
    id: 'rewatch_platinum',
    category: 'rewatch',
    tier: 'platinum',
    name: 'Nostalgie-Experte',
    description: '60 Episoden als Rewatch geschaut',
    emoji: '🎭',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 60 },
    rarity: 'legendary',
  },
  {
    id: 'rewatch_diamond',
    category: 'rewatch',
    tier: 'diamond',
    name: 'Zeitreisender',
    description: '100 Episoden als Rewatch geschaut',
    emoji: '⏰',
    color: RARITY_COLORS.legendary,
    requirements: { episodes: 100 },
    rarity: 'legendary',
  },

  // 🗺️ EXPLORER BADGES
  {
    id: 'explorer_bronze',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Entdecker',
    description: '50 verschiedene Serien angefangen',
    emoji: '🗺️',
    color: RARITY_COLORS.common,
    requirements: { series: 50 },
    rarity: 'common',
  },
  {
    id: 'explorer_silver',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Serien-Scout',
    description: '100 verschiedene Serien angefangen',
    emoji: '🔍',
    color: RARITY_COLORS.rare,
    requirements: { series: 100 },
    rarity: 'rare',
  },
  {
    id: 'explorer_gold',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Genre-Meister',
    description: '200 verschiedene Serien angefangen',
    emoji: '🌍',
    color: RARITY_COLORS.epic,
    requirements: { series: 200 },
    rarity: 'epic',
  },
  {
    id: 'explorer_platinum',
    category: 'series_explorer',
    tier: 'platinum',
    name: 'Serien-Weltreisender',
    description: '300 verschiedene Serien angefangen',
    emoji: '✈️',
    color: RARITY_COLORS.legendary,
    requirements: { series: 300 },
    rarity: 'legendary',
  },
  {
    id: 'explorer_diamond',
    category: 'series_explorer',
    tier: 'diamond',
    name: 'Serien-Universum',
    description: '500 verschiedene Serien angefangen',
    emoji: '🌌',
    color: RARITY_COLORS.legendary,
    requirements: { series: 500 },
    rarity: 'legendary',
  },
  {
    id: 'explorer_mythic',
    category: 'series_explorer',
    tier: 'diamond',
    name: 'Omnipräsenter Explorer',
    description: '750+ verschiedene Serien angefangen',
    emoji: '🚀',
    color: RARITY_COLORS.legendary,
    requirements: { series: 750 },
    rarity: 'legendary',
  },

  // ⭐ COLLECTOR BADGES
  {
    id: 'collector_bronze',
    category: 'collector',
    tier: 'bronze',
    name: 'Kritiker',
    description: '50 Serien oder Filme bewertet',
    emoji: '⭐',
    color: RARITY_COLORS.common,
    requirements: { ratings: 50 },
    rarity: 'common',
  },
  {
    id: 'collector_silver',
    category: 'collector',
    tier: 'silver',
    name: 'Bewertungs-Experte',
    description: '150 Serien oder Filme bewertet',
    emoji: '🌟',
    color: RARITY_COLORS.rare,
    requirements: { ratings: 150 },
    rarity: 'rare',
  },
  {
    id: 'collector_gold',
    category: 'collector',
    tier: 'gold',
    name: 'Rating-Meister',
    description: '300 Serien oder Filme bewertet',
    emoji: '🎯',
    color: RARITY_COLORS.epic,
    requirements: { ratings: 300 },
    rarity: 'epic',
  },
  {
    id: 'collector_platinum',
    category: 'collector',
    tier: 'platinum',
    name: 'Bewertungs-Gott',
    description: '500 Serien oder Filme bewertet',
    emoji: '🏆',
    color: RARITY_COLORS.legendary,
    requirements: { ratings: 500 },
    rarity: 'legendary',
  },
  {
    id: 'collector_diamond',
    category: 'collector',
    tier: 'diamond',
    name: 'Kritiker-Legende',
    description: '750 Serien oder Filme bewertet',
    emoji: '📝',
    color: RARITY_COLORS.legendary,
    requirements: { ratings: 750 },
    rarity: 'legendary',
  },
  {
    id: 'collector_mythic',
    category: 'collector',
    tier: 'diamond',
    name: 'Allmächtiger Kritiker',
    description: '1000+ Serien oder Filme bewertet',
    emoji: '🌟',
    color: RARITY_COLORS.legendary,
    requirements: { ratings: 1000 },
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
    color: RARITY_COLORS.common,
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
    color: RARITY_COLORS.rare,
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
    color: RARITY_COLORS.epic,
    requirements: { friends: 15 },
    rarity: 'epic',
  },
  {
    id: 'social_platinum',
    category: 'social',
    tier: 'platinum',
    name: 'Netzwerk-Guru',
    description: '25 Freunde hinzugefügt',
    emoji: '🌐',
    color: RARITY_COLORS.legendary,
    requirements: { friends: 25 },
    rarity: 'legendary',
  },
  {
    id: 'social_diamond',
    category: 'social',
    tier: 'diamond',
    name: 'Serien-Influencer',
    description: '50 Freunde hinzugefügt',
    emoji: '👨‍💼',
    color: RARITY_COLORS.legendary,
    requirements: { friends: 50 },
    rarity: 'legendary',
  },
];
