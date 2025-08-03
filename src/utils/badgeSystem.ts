import firebase from 'firebase/compat/app';
import { badgeActivityLogger } from './badgeActivityLogger';

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
    timeframe?: string; // '1day', '1week', '1month'
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface EarnedBadge extends Badge {
  earnedAt: number;
  progress?: {
    current: number;
    total: number;
  };
  details?: string; // Z.B. "Breaking Bad - 5 Episoden"
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  total: number;
  lastUpdated: number;
}

// Badge-Definitionen
export const BADGE_DEFINITIONS: Badge[] = [
  // BINGE BADGES 🍿
  {
    id: 'binge_bronze',
    category: 'binge',
    tier: 'bronze',
    name: 'Snack-Session',
    description: '3 Episoden einer Serie hintereinander geschaut',
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
    description: '5 Episoden einer Serie hintereinander geschaut',
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
    description: '8 Episoden einer Serie hintereinander geschaut',
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
    description: '12 Episoden einer Serie hintereinander geschaut',
    emoji: '📺',
    color: '#c0c0c0',
    requirements: { episodes: 12, timeframe: '4hours' },
    rarity: 'rare',
  },
  {
    id: 'binge_gold',
    category: 'binge',
    tier: 'gold',
    name: 'Staffel-Fresser',
    description: 'Eine komplette Staffel an einem Tag geschaut',
    emoji: '🏆',
    color: '#ffd700',
    requirements: { seasons: 1, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_gold_plus',
    category: 'binge',
    tier: 'gold',
    name: 'Staffel-Verschlinger',
    description: '2 komplette Staffeln an einem Tag geschaut',
    emoji: '👑',
    color: '#ffd700',
    requirements: { seasons: 2, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_platinum',
    category: 'binge',
    tier: 'platinum',
    name: 'Binge-Monster',
    description: '3+ Staffeln an einem Tag verschlungen',
    emoji: '👹',
    color: '#e5e4e2',
    requirements: { seasons: 3, timeframe: '1day' },
    rarity: 'epic',
  },
  {
    id: 'binge_diamond',
    category: 'binge',
    tier: 'diamond',
    name: 'Binge-Gott',
    description:
      'Eine komplette Serie (30+ Episoden) an einem Wochenende beendet',
    emoji: '🔥',
    color: '#b9f2ff',
    requirements: { episodes: 30, timeframe: '2days' },
    rarity: 'legendary',
  },

  // QUICKWATCH BADGES ⚡ (Release Day Watching)
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
    id: 'quickwatch_bronze_plus',
    category: 'quickwatch',
    tier: 'bronze',
    name: 'Release Day Fan',
    description: '8 Episoden am Veröffentlichungstag geschaut',
    emoji: '🌅',
    color: '#cd7f32',
    requirements: { episodes: 8 },
    rarity: 'common',
  },
  {
    id: 'quickwatch_silver',
    category: 'quickwatch',
    tier: 'silver',
    name: 'Day One Devotee',
    description: '15 Episoden am jeweiligen Veröffentlichungstag geschaut',
    emoji: '🎯',
    color: '#c0c0c0',
    requirements: { episodes: 15 },
    rarity: 'rare',
  },
  {
    id: 'quickwatch_silver_plus',
    category: 'quickwatch',
    tier: 'silver',
    name: 'Release Hunter',
    description: '25 Episoden am jeweiligen Veröffentlichungstag geschaut',
    emoji: '🏹',
    color: '#c0c0c0',
    requirements: { episodes: 25 },
    rarity: 'rare',
  },
  {
    id: 'quickwatch_gold',
    category: 'quickwatch',
    tier: 'gold',
    name: 'Release Perfectionist',
    description: '40 Episoden am jeweiligen Veröffentlichungstag geschaut',
    emoji: '👑',
    color: '#ffd700',
    requirements: { episodes: 40 },
    rarity: 'epic',
  },
  {
    id: 'quickwatch_gold_plus',
    category: 'quickwatch',
    tier: 'gold',
    name: 'Day Zero Hero',
    description: '60 Episoden am jeweiligen Veröffentlichungstag geschaut',
    emoji: '🏆',
    color: '#ffd700',
    requirements: { episodes: 60 },
    rarity: 'epic',
  },
  {
    id: 'quickwatch_platinum',
    category: 'quickwatch',
    tier: 'platinum',
    name: 'Release Champion',
    description: '85 Episoden am jeweiligen Veröffentlichungstag geschaut',
    emoji: '🚀',
    color: '#e5e4e2',
    requirements: { episodes: 85 },
    rarity: 'legendary',
  },
  {
    id: 'quickwatch_diamond',
    category: 'quickwatch',
    tier: 'diamond',
    name: 'Release Day Legend',
    description: '120 Episoden am jeweiligen Veröffentlichungstag geschaut',
    emoji: '💎',
    color: '#b9f2ff',
    requirements: { episodes: 120 },
    rarity: 'legendary',
  },

  // MARATHON BADGES 📺
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
    id: 'marathon_bronze_plus',
    category: 'marathon',
    tier: 'bronze',
    name: 'Wochenend-Warrior',
    description: '25 Episoden in einer Woche geschaut',
    emoji: '⚔️',
    color: '#cd7f32',
    requirements: { episodes: 25, timeframe: '1week' },
    rarity: 'common',
  },
  {
    id: 'marathon_silver',
    category: 'marathon',
    tier: 'silver',
    name: 'Serien-Liebhaber',
    description: '40 Episoden in einer Woche geschaut',
    emoji: '💝',
    color: '#c0c0c0',
    requirements: { episodes: 40, timeframe: '1week' },
    rarity: 'rare',
  },
  {
    id: 'marathon_silver_plus',
    category: 'marathon',
    tier: 'silver',
    name: 'Episoden-Sammler',
    description: '60 Episoden in einer Woche geschaut',
    emoji: '📚',
    color: '#c0c0c0',
    requirements: { episodes: 60, timeframe: '1week' },
    rarity: 'rare',
  },
  {
    id: 'marathon_gold',
    category: 'marathon',
    tier: 'gold',
    name: 'Serien-Süchtiger',
    description: '85 Episoden in einer Woche geschaut',
    emoji: '🎭',
    color: '#ffd700',
    requirements: { episodes: 85, timeframe: '1week' },
    rarity: 'epic',
  },
  {
    id: 'marathon_gold_plus',
    category: 'marathon',
    tier: 'gold',
    name: 'Marathon-Meister',
    description: '120 Episoden in einer Woche geschaut',
    emoji: '🏃‍♂️',
    color: '#ffd700',
    requirements: { episodes: 120, timeframe: '1week' },
    rarity: 'epic',
  },

  // STREAK BADGES 🔥
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
    id: 'streak_bronze_plus',
    category: 'streak',
    tier: 'bronze',
    name: 'Wochenend-Streaker',
    description: '14 Tage in Folge Serien geschaut',
    emoji: '📅',
    color: '#cd7f32',
    requirements: { days: 14 },
    rarity: 'common',
  },
  {
    id: 'streak_silver',
    category: 'streak',
    tier: 'silver',
    name: 'Serien-Routine',
    description: '30 Tage in Folge Serien geschaut',
    emoji: '⚡',
    color: '#c0c0c0',
    requirements: { days: 30 },
    rarity: 'rare',
  },
  {
    id: 'streak_silver_plus',
    category: 'streak',
    tier: 'silver',
    name: 'Monats-Marathon',
    description: '50 Tage in Folge Serien geschaut',
    emoji: '🗓️',
    color: '#c0c0c0',
    requirements: { days: 50 },
    rarity: 'rare',
  },
  {
    id: 'streak_gold',
    category: 'streak',
    tier: 'gold',
    name: 'Serien-Maschine',
    description: '75 Tage in Folge Serien geschaut',
    emoji: '🤖',
    color: '#ffd700',
    requirements: { days: 75 },
    rarity: 'epic',
  },
  {
    id: 'streak_gold_plus',
    category: 'streak',
    tier: 'gold',
    name: 'Unaufhaltsam',
    description: '100 Tage in Folge Serien geschaut',
    emoji: '💎',
    color: '#ffd700',
    requirements: { days: 100 },
    rarity: 'legendary',
  },

  // REWATCH BADGES 🔄
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
    id: 'rewatch_bronze_plus',
    category: 'rewatch',
    tier: 'bronze',
    name: 'Wiederholer',
    description: '15 Episoden als Rewatch geschaut',
    emoji: '♻️',
    color: '#cd7f32',
    requirements: { episodes: 15 },
    rarity: 'common',
  },
  {
    id: 'rewatch_silver',
    category: 'rewatch',
    tier: 'silver',
    name: 'Nostalgie-Fan',
    description: '30 Episoden als Rewatch geschaut',
    emoji: '💫',
    color: '#c0c0c0',
    requirements: { episodes: 30 },
    rarity: 'rare',
  },
  {
    id: 'rewatch_silver_plus',
    category: 'rewatch',
    tier: 'silver',
    name: 'Erinnerungs-Sammler',
    description: '50 Episoden als Rewatch geschaut',
    emoji: '📼',
    color: '#c0c0c0',
    requirements: { episodes: 50 },
    rarity: 'rare',
  },
  {
    id: 'rewatch_gold',
    category: 'rewatch',
    tier: 'gold',
    name: 'Nostalgie-König',
    description: '75 Episoden als Rewatch geschaut',
    emoji: '👑',
    color: '#ffd700',
    requirements: { episodes: 75 },
    rarity: 'epic',
  },
  {
    id: 'rewatch_gold_plus',
    category: 'rewatch',
    tier: 'gold',
    name: 'Rewatch-Legende',
    description: '120 Episoden als Rewatch geschaut',
    emoji: '🏆',
    color: '#ffd700',
    requirements: { episodes: 120 },
    rarity: 'epic',
  },

  // SERIES EXPLORER BADGES 🗺️
  {
    id: 'explorer_bronze',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Entdecker',
    description: '15 verschiedene Serien angefangen',
    emoji: '🗺️',
    color: '#cd7f32',
    requirements: { series: 15 },
    rarity: 'common',
  },
  {
    id: 'explorer_bronze_plus',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Serien-Scout',
    description: '30 verschiedene Serien angefangen',
    emoji: '🔍',
    color: '#cd7f32',
    requirements: { series: 30 },
    rarity: 'common',
  },
  {
    id: 'explorer_bronze_max',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Neuland-Erkunder',
    description: '50 verschiedene Serien angefangen',
    emoji: '🧭',
    color: '#cd7f32',
    requirements: { series: 50 },
    rarity: 'common',
  },
  {
    id: 'explorer_silver',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Serien-Sammler',
    description: '75 verschiedene Serien angefangen',
    emoji: '📚',
    color: '#c0c0c0',
    requirements: { series: 75 },
    rarity: 'rare',
  },
  {
    id: 'explorer_silver_plus',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Genre-Jäger',
    description: '100 verschiedene Serien angefangen',
    emoji: '🎯',
    color: '#c0c0c0',
    requirements: { series: 100 },
    rarity: 'rare',
  },
  {
    id: 'explorer_silver_max',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Vielfalt-Liebhaber',
    description: '130 verschiedene Serien angefangen',
    emoji: '🌈',
    color: '#c0c0c0',
    requirements: { series: 130 },
    rarity: 'rare',
  },
  {
    id: 'explorer_gold',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Genre-Meister',
    description: '160 verschiedene Serien angefangen',
    emoji: '🎬',
    color: '#ffd700',
    requirements: { series: 160 },
    rarity: 'epic',
  },
  {
    id: 'explorer_gold_plus',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Serien-Universalist',
    description: '200 verschiedene Serien angefangen',
    emoji: '🌍',
    color: '#ffd700',
    requirements: { series: 200 },
    rarity: 'epic',
  },
  {
    id: 'explorer_gold_max',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Entdecker-Legende',
    description: '250 verschiedene Serien angefangen',
    emoji: '🏛️',
    color: '#ffd700',
    requirements: { series: 250 },
    rarity: 'epic',
  },
  {
    id: 'explorer_platinum',
    category: 'series_explorer',
    tier: 'platinum',
    name: 'Serien-Weltreisender',
    description: '300 verschiedene Serien angefangen',
    emoji: '✈️',
    color: '#e5e4e2',
    requirements: { series: 300 },
    rarity: 'legendary',
  },
  {
    id: 'explorer_platinum_plus',
    category: 'series_explorer',
    tier: 'platinum',
    name: 'Kultureller Botschafter',
    description: '380 verschiedene Serien angefangen',
    emoji: '🏺',
    color: '#e5e4e2',
    requirements: { series: 380 },
    rarity: 'legendary',
  },
  {
    id: 'explorer_diamond',
    category: 'series_explorer',
    tier: 'diamond',
    name: 'Omnipräsenter Seher',
    description: '500 verschiedene Serien angefangen',
    emoji: '💎',
    color: '#b9f2ff',
    requirements: { series: 500 },
    rarity: 'legendary',
  },

  // COLLECTOR BADGES ⭐ (Bewertungen)
  {
    id: 'collector_bronze',
    category: 'collector',
    tier: 'bronze',
    name: 'Bewertungsanfang',
    description: '15 Serien/Filme bewertet',
    emoji: '⭐',
    color: '#cd7f32',
    requirements: { ratings: 15 },
    rarity: 'common',
  },
  {
    id: 'collector_bronze_plus',
    category: 'collector',
    tier: 'bronze',
    name: 'Geschmacksfinder',
    description: '35 Serien/Filme bewertet',
    emoji: '🎯',
    color: '#cd7f32',
    requirements: { ratings: 35 },
    rarity: 'common',
  },
  {
    id: 'collector_bronze_max',
    category: 'collector',
    tier: 'bronze',
    name: 'Meinungsbilder',
    description: '60 Serien/Filme bewertet',
    emoji: '💭',
    color: '#cd7f32',
    requirements: { ratings: 60 },
    rarity: 'common',
  },
  {
    id: 'collector_silver',
    category: 'collector',
    tier: 'silver',
    name: 'Kritiker',
    description: '90 Serien/Filme bewertet',
    emoji: '🎭',
    color: '#c0c0c0',
    requirements: { ratings: 90 },
    rarity: 'rare',
  },
  {
    id: 'collector_silver_plus',
    category: 'collector',
    tier: 'silver',
    name: 'Qualitätsprüfer',
    description: '130 Serien/Filme bewertet',
    emoji: '🔍',
    color: '#c0c0c0',
    requirements: { ratings: 130 },
    rarity: 'rare',
  },
  {
    id: 'collector_silver_max',
    category: 'collector',
    tier: 'silver',
    name: 'Bewertungsprofi',
    description: '180 Serien/Filme bewertet',
    emoji: '📊',
    color: '#c0c0c0',
    requirements: { ratings: 180 },
    rarity: 'rare',
  },
  {
    id: 'collector_gold',
    category: 'collector',
    tier: 'gold',
    name: 'Master-Kritiker',
    description: '240 Serien/Filme bewertet',
    emoji: '🏆',
    color: '#ffd700',
    requirements: { ratings: 240 },
    rarity: 'epic',
  },
  {
    id: 'collector_gold_plus',
    category: 'collector',
    tier: 'gold',
    name: 'Geschmacks-Experte',
    description: '320 Serien/Filme bewertet',
    emoji: '�',
    color: '#ffd700',
    requirements: { ratings: 320 },
    rarity: 'epic',
  },
  {
    id: 'collector_gold_max',
    category: 'collector',
    tier: 'gold',
    name: 'Kritik-Virtuose',
    description: '420 Serien/Filme bewertet',
    emoji: '🎨',
    color: '#ffd700',
    requirements: { ratings: 420 },
    rarity: 'epic',
  },
  {
    id: 'collector_platinum',
    category: 'collector',
    tier: 'platinum',
    name: 'Bewertungs-Titan',
    description: '550 Serien/Filme bewertet',
    emoji: '⚡',
    color: '#e5e4e2',
    requirements: { ratings: 550 },
    rarity: 'legendary',
  },
  {
    id: 'collector_platinum_plus',
    category: 'collector',
    tier: 'platinum',
    name: 'Geschmacks-Orakel',
    description: '700 Serien/Filme bewertet',
    emoji: '🔮',
    color: '#e5e4e2',
    requirements: { ratings: 700 },
    rarity: 'legendary',
  },
  {
    id: 'collector_diamond',
    category: 'collector',
    tier: 'diamond',
    name: 'Allwissender Kritiker',
    description: '1000 Serien/Filme bewertet',
    emoji: '🌟',
    color: '#b9f2ff',
    requirements: { ratings: 1000 },
    rarity: 'legendary',
  },

  // SOCIAL BADGES 🤝 (Watchlist-Management)
  {
    id: 'social_bronze',
    category: 'social',
    tier: 'bronze',
    name: 'Kontaktfreudig',
    description: '3 Freunde hinzugefügt',
    emoji: '👋',
    color: '#cd7f32',
    requirements: { friends: 3 },
    rarity: 'common',
  },
  {
    id: 'social_bronze_plus',
    category: 'social',
    tier: 'bronze',
    name: 'Gesellig',
    description: '5 Freunde hinzugefügt',
    emoji: '🤝',
    color: '#cd7f32',
    requirements: { friends: 5 },
    rarity: 'common',
  },
  {
    id: 'social_bronze_max',
    category: 'social',
    tier: 'bronze',
    name: 'Freundeskreis',
    description: '10 Freunde hinzugefügt',
    emoji: '👥',
    color: '#cd7f32',
    requirements: { friends: 10 },
    rarity: 'common',
  },
  {
    id: 'social_silver',
    category: 'social',
    tier: 'silver',
    name: 'Networker',
    description: '15 Freunde hinzugefügt',
    emoji: '🌐',
    color: '#c0c0c0',
    requirements: { friends: 15 },
    rarity: 'rare',
  },
  {
    id: 'social_silver_plus',
    category: 'social',
    tier: 'silver',
    name: 'Beliebte Person',
    description: '25 Freunde hinzugefügt',
    emoji: '⭐',
    color: '#c0c0c0',
    requirements: { friends: 25 },
    rarity: 'rare',
  },
  {
    id: 'social_silver_max',
    category: 'social',
    tier: 'silver',
    name: 'Sozialer Magnet',
    description: '35 Freunde hinzugefügt',
    emoji: '🧲',
    color: '#c0c0c0',
    requirements: { friends: 35 },
    rarity: 'rare',
  },
  {
    id: 'social_gold',
    category: 'social',
    tier: 'gold',
    name: 'Community-Legende',
    description: '200 Freunde hinzugefügt',
    emoji: '🌟',
    color: '#ffd700',
    requirements: { friends: 200 },
    rarity: 'epic',
  },
  {
    id: 'social_gold_plus',
    category: 'social',
    tier: 'gold',
    name: 'Influencer',
    description: '75 Freunde hinzugefügt',
    emoji: '📢',
    color: '#ffd700',
    requirements: { friends: 75 },
    rarity: 'epic',
  },
  {
    id: 'social_gold_max',
    category: 'social',
    tier: 'gold',
    name: 'Freunde-Magnet',
    description: '350 Freunde hinzugefügt',
    emoji: '🌊',
    color: '#ffd700',
    requirements: { friends: 350 },
    rarity: 'epic',
  },
  {
    id: 'social_platinum',
    category: 'social',
    tier: 'platinum',
    name: 'Soziales Genie',
    description: '500 Freunde hinzugefügt',
    emoji: '🗃️',
    color: '#e5e4e2',
    requirements: { friends: 500 },
    rarity: 'legendary',
  },
  {
    id: 'social_diamond',
    category: 'social',
    tier: 'diamond',
    name: 'Freundschafts-Universum',
    description: '750 Freunde hinzugefügt',
    emoji: '🌌',
    color: '#b9f2ff',
    requirements: { friends: 750 },
    rarity: 'legendary',
  },

  // COMPLETION BADGES 🏁 (Serien komplett geschaut)
  {
    id: 'completion_bronze',
    category: 'completion',
    tier: 'bronze',
    name: 'Erste Vollendung',
    description: '5 Serien komplett abgeschlossen',
    emoji: '🏁',
    color: '#cd7f32',
    requirements: { series: 5 },
    rarity: 'common',
  },
  {
    id: 'completion_bronze_plus',
    category: 'completion',
    tier: 'bronze',
    name: 'Abschluss-Sammler',
    description: '12 Serien komplett abgeschlossen',
    emoji: '📜',
    color: '#cd7f32',
    requirements: { series: 12 },
    rarity: 'common',
  },
  {
    id: 'completion_bronze_max',
    category: 'completion',
    tier: 'bronze',
    name: 'Durchhalter',
    description: '20 Serien komplett abgeschlossen',
    emoji: '💪',
    color: '#cd7f32',
    requirements: { series: 20 },
    rarity: 'common',
  },
  {
    id: 'completion_silver',
    category: 'completion',
    tier: 'silver',
    name: 'Serien-Beender',
    description: '35 Serien komplett abgeschlossen',
    emoji: '✅',
    color: '#c0c0c0',
    requirements: { series: 35 },
    rarity: 'rare',
  },
  {
    id: 'completion_silver_plus',
    category: 'completion',
    tier: 'silver',
    name: 'Vollendungs-Meister',
    description: '55 Serien komplett abgeschlossen',
    emoji: '🎯',
    color: '#c0c0c0',
    requirements: { series: 55 },
    rarity: 'rare',
  },
  {
    id: 'completion_silver_max',
    category: 'completion',
    tier: 'silver',
    name: 'Geschichten-Vollender',
    description: '80 Serien komplett abgeschlossen',
    emoji: '📖',
    color: '#c0c0c0',
    requirements: { series: 80 },
    rarity: 'rare',
  },
  {
    id: 'completion_gold',
    category: 'completion',
    tier: 'gold',
    name: 'Finale-Spezialist',
    description: '120 Serien komplett abgeschlossen',
    emoji: '🎬',
    color: '#ffd700',
    requirements: { series: 120 },
    rarity: 'epic',
  },
  {
    id: 'completion_gold_plus',
    category: 'completion',
    tier: 'gold',
    name: 'Ende-Enthusiast',
    description: '180 Serien komplett abgeschlossen',
    emoji: '🏆',
    color: '#ffd700',
    requirements: { series: 180 },
    rarity: 'epic',
  },
  {
    id: 'completion_platinum',
    category: 'completion',
    tier: 'platinum',
    name: 'Abschluss-Perfektionist',
    description: '250 Serien komplett abgeschlossen',
    emoji: '👑',
    color: '#e5e4e2',
    requirements: { series: 250 },
    rarity: 'legendary',
  },
  {
    id: 'completion_diamond',
    category: 'completion',
    tier: 'diamond',
    name: 'Legendärer Vollender',
    description: '350 Serien komplett abgeschlossen',
    emoji: '💎',
    color: '#b9f2ff',
    requirements: { series: 350 },
    rarity: 'legendary',
  },

  // DEDICATION BADGES ⏰ (Zeitbasierte Badges)
  {
    id: 'dedication_bronze',
    category: 'dedication',
    tier: 'bronze',
    name: 'Wochenend-Warrior',
    description: '50 Episoden in einer Woche geschaut',
    emoji: '⏰',
    color: '#cd7f32',
    requirements: { episodes: 50, timeframe: '1week' },
    rarity: 'common',
  },
  {
    id: 'dedication_bronze_plus',
    category: 'dedication',
    tier: 'bronze',
    name: 'Serien-Sprint',
    description: '100 Episoden in einer Woche geschaut',
    emoji: '🏃',
    color: '#cd7f32',
    requirements: { episodes: 100, timeframe: '1week' },
    rarity: 'common',
  },
  {
    id: 'dedication_silver',
    category: 'dedication',
    tier: 'silver',
    name: 'Monats-Marathonläufer',
    description: '300 Episoden in einem Monat geschaut',
    emoji: '📅',
    color: '#c0c0c0',
    requirements: { episodes: 300, timeframe: '1month' },
    rarity: 'rare',
  },
  {
    id: 'dedication_silver_plus',
    category: 'dedication',
    tier: 'silver',
    name: 'Unermüdlicher Seher',
    description: '500 Episoden in einem Monat geschaut',
    emoji: '👁️',
    color: '#c0c0c0',
    requirements: { episodes: 500, timeframe: '1month' },
    rarity: 'rare',
  },
  {
    id: 'dedication_gold',
    category: 'dedication',
    tier: 'gold',
    name: 'Jahres-Champion',
    description: '2000 Episoden in einem Jahr geschaut',
    emoji: '🗓️',
    color: '#ffd700',
    requirements: { episodes: 2000, timeframe: '1year' },
    rarity: 'epic',
  },
  {
    id: 'dedication_platinum',
    category: 'dedication',
    tier: 'platinum',
    name: 'Lebenszeit-Devotee',
    description: '5000 Episoden insgesamt geschaut',
    emoji: '⌛',
    color: '#e5e4e2',
    requirements: { episodes: 5000 },
    rarity: 'legendary',
  },
  {
    id: 'dedication_diamond',
    category: 'dedication',
    tier: 'diamond',
    name: 'Ewiger Zuschauer',
    description: '10000 Episoden insgesamt geschaut',
    emoji: '♾️',
    color: '#b9f2ff',
    requirements: { episodes: 10000 },
    rarity: 'legendary',
  },
];

// Das folgende Badge war ein Duplikat und wurde entfernt:
// social_gold mit 200 friends (Watchlist-Legende)
// Es gab bereits einen social_gold mit 250 friends (Watchlist-Gigant)

// Badge-System Klasse
export class BadgeSystem {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Prüft alle verfügbaren Badges und gibt neue Badges zurück
   */
  async checkForNewBadges(activityData: any): Promise<EarnedBadge[]> {
    const newBadges: EarnedBadge[] = [];
    const currentBadges = await this.getUserBadges();
    const currentBadgeIds = new Set(currentBadges.map((b) => b.id));

    for (const badge of BADGE_DEFINITIONS) {
      // Skip wenn Badge bereits verdient
      if (currentBadgeIds.has(badge.id)) {
        continue;
      }

      const earned = await this.checkBadgeRequirements(badge, activityData);
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
   * Prüft ob ein spezifisches Badge verdient wurde
   */
  private async checkBadgeRequirements(
    badge: Badge,
    activityData: any
  ): Promise<{ earned: boolean; details?: string } | null> {
    const now = Date.now();

    switch (badge.category) {
      case 'binge':
        // Binge-Badges für alle Episode-Activities
        if (
          activityData.type === 'episode_watched' ||
          activityData.type === 'episodes_watched' ||
          activityData.type === 'season_watched' ||
          activityData.type === 'season_rewatched'
        ) {
          return this.checkBingeBadge(badge, activityData, now);
        }
        return null;
      case 'quickwatch':
        // Quickwatch-Badges für alle Episode-Activities mit airDate
        if (
          (activityData.type === 'episode_watched' ||
            activityData.type === 'episodes_watched' ||
            activityData.type === 'season_watched') &&
          activityData.airDate
        ) {
          return this.checkQuickwatchBadge(badge, activityData, now);
        }
        return null;
      case 'marathon':
        // Marathon-Badges für alle Episode-Activities
        if (
          activityData.type === 'episode_watched' ||
          activityData.type === 'episodes_watched' ||
          activityData.type === 'season_watched' ||
          activityData.type === 'season_rewatched'
        ) {
          return this.checkMarathonBadge(badge, now);
        }
        return null;
      case 'streak':
        // Streak-Badges für alle Activities die "schauen" bedeuten
        if (
          activityData.type === 'episode_watched' ||
          activityData.type === 'episodes_watched' ||
          activityData.type === 'season_watched' ||
          activityData.type === 'season_rewatched'
        ) {
          return this.checkStreakBadge(badge, now);
        }
        return null;
      case 'rewatch':
        // Rewatch-Badges für alle Episode-Activities mit isRewatch=true oder watchCount>1
        if (
          (activityData.type === 'episode_watched' ||
            activityData.type === 'episodes_watched' ||
            activityData.type === 'season_watched' ||
            activityData.type === 'season_rewatched') &&
          (activityData.isRewatch ||
            (activityData.watchCount && activityData.watchCount > 1))
        ) {
          return this.checkRewatchBadge(badge, now);
        }
        return null;
      case 'series_explorer':
        // Explorer-Badges für neue Serien
        if (activityData.type === 'series_added') {
          return this.checkExplorerBadge(badge, now);
        }
        return null;
      case 'collector':
        // Collector-Badges für Rating-Activities
        if (
          activityData.type === 'rating_added' ||
          activityData.type === 'series_rated' ||
          activityData.type === 'movie_rated'
        ) {
          return this.checkCollectorBadge(badge, now);
        }
        return null;
      case 'social':
        // Social-Badges für Watchlist-Activities
        if (
          activityData.type === 'watchlist_added' ||
          activityData.type === 'series_added_to_watchlist' ||
          activityData.type === 'movie_added_to_watchlist'
        ) {
          return this.checkSocialBadge(badge, now);
        }
        return null;
      case 'completion':
        // Completion-Badges für komplette Serien
        if (
          activityData.type === 'series_completed' ||
          activityData.type === 'season_watched'
        ) {
          return this.checkCompletionBadge(badge, now);
        }
        return null;
      case 'dedication':
        // Dedication-Badges für zeitbasierte Episoden-Counts
        if (
          activityData.type === 'episode_watched' ||
          activityData.type === 'episodes_watched' ||
          activityData.type === 'season_watched'
        ) {
          return this.checkDedicationBadge(badge, now);
        }
        return null;
      default:
        return null;
    }
  }

  private async checkBingeBadge(
    badge: Badge,
    _activityData: any,
    now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Für Binge-Badges prüfen wir Activities der letzten Stunden basierend auf timeframe
    let timeWindowMs: number;
    if (badge.requirements.timeframe === '2hours') {
      timeWindowMs = 2 * 60 * 60 * 1000;
    } else if (badge.requirements.timeframe === '4hours') {
      timeWindowMs = 4 * 60 * 60 * 1000;
    } else if (badge.requirements.timeframe === '1day') {
      timeWindowMs = 24 * 60 * 60 * 1000;
    } else if (badge.requirements.timeframe === '2days') {
      timeWindowMs = 2 * 24 * 60 * 60 * 1000;
    } else {
      timeWindowMs = 24 * 60 * 60 * 1000; // Default: 1 Tag
    }

    const timeAgo = now - timeWindowMs;
    const activities = await this.getActivitiesSince(timeAgo);

    // Gruppiere nach Serie und zähle Episoden
    const seriesGroups = new Map<number, any[]>();
    activities.forEach((activity) => {
      if (
        activity.tmdbId &&
        (activity.type === 'episode_watched' ||
          activity.type === 'episodes_watched' ||
          activity.type === 'season_watched')
      ) {
        if (!seriesGroups.has(activity.tmdbId)) {
          seriesGroups.set(activity.tmdbId, []);
        }
        seriesGroups.get(activity.tmdbId)!.push(activity);
      }
    });

    // Prüfe ob eine Serie die Anforderungen erfüllt
    for (const [_, seriesActivities] of seriesGroups) {
      let episodeCount = 0;
      let seriesTitle = 'Unbekannte Serie';

      seriesActivities.forEach((activity) => {
        if (activity.type === 'episodes_watched' && activity.episodeCount) {
          episodeCount += activity.episodeCount;
        } else if (activity.type === 'episode_watched') {
          episodeCount += 1;
        }
        // 🚫 WICHTIG: season_watched wird NICHT für Episode-Zählung verwendet!
        // Es wird nur für Season-spezifische Badges benutzt.

        // Verbesserte Titel-Extraktion
        if (activity.itemTitle) {
          if (activity.itemTitle.includes(' - ')) {
            seriesTitle = activity.itemTitle.split(' - ')[0];
          } else {
            // Fallback für andere Title-Formate
            seriesTitle = activity.itemTitle;
          }
        } else if (activity.seriesTitle) {
          seriesTitle = activity.seriesTitle;
        }
      });

      // Episode-basierte Binge Badges (3, 5, 20 Episoden)
      if (
        badge.requirements.episodes &&
        episodeCount >= badge.requirements.episodes
      ) {
        return {
          earned: true,
          details: `${seriesTitle} - ${episodeCount} Episoden in ${
            badge.requirements.timeframe || 'kurzer Zeit'
          }`,
        };
      }

      // Für Season-basierte Badges: PRÜFE ECHTE STAFFEL-COMPLETION
      if (badge.requirements.seasons) {
        // WICHTIGE KORREKTUR: Nicht einfach durch 8 teilen!
        // Schaue nach tatsächlichen "Staffel komplett" Activities
        let actualSeasonsCompleted = 0;

        seriesActivities.forEach((activity) => {
          // Zähle echte Staffel-Completion Activities
          if (
            activity.type === 'season_watched' ||
            activity.type === 'season_rewatched'
          ) {
            actualSeasonsCompleted++;
          } else if (
            activity.itemTitle &&
            (activity.itemTitle.includes('komplett') ||
              (activity.itemTitle.includes('Staffel') &&
                activity.itemTitle.includes('komplett')))
          ) {
            actualSeasonsCompleted++;
          }
        });

        if (actualSeasonsCompleted >= badge.requirements.seasons) {
          return {
            earned: true,
            details: `${seriesTitle} - ${actualSeasonsCompleted} Staffel${
              actualSeasonsCompleted > 1 ? 'n' : ''
            } komplett`,
          };
        }
      }
    }

    return null;
  }

  private async checkQuickwatchBadge(
    badge: Badge,
    activityData: any,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Prüfe ob aktuelle Episode am Release Day geschaut wurde
    if (activityData.airDate && activityData.timestamp) {
      const airDate = new Date(activityData.airDate);
      const watchDate = new Date(activityData.timestamp);

      // Vergleiche nur das Datum (ohne Zeit)
      const airDateString = airDate.toDateString();
      const watchDateString = watchDate.toDateString();

      if (airDateString === watchDateString) {
        // 🎯 KORRIGIERT: Zähle ALLE Quickwatch Activities (nicht nur heute)

        // Hole alle Badge-Activities
        const activitiesRef = firebase
          .database()
          .ref(`badgeActivities/${this.userId}`);
        const activitiesSnapshot = await activitiesRef.once('value');
        const allActivities = Object.values(
          activitiesSnapshot.val() || {}
        ) as any[];

        // Zähle ALLE Quickwatch Activities (egal wann sie waren)
        const allQuickwatchActivities = allActivities.filter((activity) => {
          if (activity.type !== 'quickwatch') return false;

          return true;
        });

        // Prüfe ob aktuelle Episode auch eine Quickwatch ist
        let totalQuickwatchCount = allQuickwatchActivities.length;

        // +1 für aktuelle Episode wenn sie eine Quickwatch ist
        const currentAirDate = new Date(activityData.airDate)
          .toISOString()
          .split('T')[0];
        const currentWatchDate = new Date(activityData.timestamp)
          .toISOString()
          .split('T')[0];

        if (currentAirDate === currentWatchDate) {
          totalQuickwatchCount += 1; // +1 für aktuelle Quickwatch Episode
        }

        // Prüfe Badge-Anforderungen
        if (
          badge.requirements.episodes &&
          totalQuickwatchCount >= badge.requirements.episodes
        ) {
          return {
            earned: true,
            details: `${totalQuickwatchCount} Quickwatch Episoden insgesamt`,
          };
        }
      }
    }

    return null;
  }

  private async checkMarathonBadge(
    badge: Badge,
    now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Prüfe Episoden der letzten Woche
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const activities = await this.getActivitiesSince(weekAgo);

    // Zähle alle Episode-Activities
    let totalEpisodes = 0;

    activities.forEach((activity) => {
      if (activity.type === 'episode_watched') {
        totalEpisodes += 1;
      } else if (
        activity.type === 'episodes_watched' &&
        activity.episodeCount
      ) {
        totalEpisodes += activity.episodeCount;
      } else if (activity.type === 'season_watched' && activity.episodeCount) {
        totalEpisodes += activity.episodeCount;
      }
    });

    if (totalEpisodes >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${totalEpisodes} Episoden in einer Woche`,
      };
    }
    return null;
  }

  private async checkStreakBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    const streak = await this.calculateCurrentStreak();

    if (streak >= badge.requirements.days!) {
      return {
        earned: true,
        details: `${streak} Tage Streak`,
      };
    }
    return null;
  }

  private async checkRewatchBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    const rewatchCount = await this.getRewatchCount();

    if (rewatchCount >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${rewatchCount} Rewatch-Episoden`,
      };
    }
    return null;
  }

  private async checkExplorerBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    const seriesCount = await this.getUniqueSeriesCount();

    if (seriesCount >= badge.requirements.series!) {
      return {
        earned: true,
        details: `${seriesCount} verschiedene Serien`,
      };
    }
    return null;
  }

  private async checkCollectorBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Zähle ECHTE Bewertungen direkt aus Firebase (Serien + Filme)
    let totalRatings = 0;

    try {
      // Import der calculateOverallRating Funktion
      const { calculateOverallRating } = await import('./rating');

      // Zähle bewertete Serien
      const seriesSnapshot = await firebase
        .database()
        .ref(`${this.userId}/serien`)
        .once('value');

      if (seriesSnapshot.exists()) {
        const seriesData = seriesSnapshot.val();
        for (const series of Object.values(seriesData) as any[]) {
          // Verschiedene Rating-Strukturen unterstützen
          if (series.rating) {
            if (typeof series.rating === 'number' && series.rating > 0) {
              totalRatings++;
            } else if (typeof series.rating === 'object') {
              // Verwende calculateOverallRating für korrekte Bewertung
              const overallRating = calculateOverallRating(series);
              if (parseFloat(overallRating) > 0) {
                totalRatings++;
              }
            }
          }
        }
      }

      // Zähle bewertete Filme
      const moviesSnapshot = await firebase
        .database()
        .ref(`${this.userId}/filme`)
        .once('value');

      if (moviesSnapshot.exists()) {
        const moviesData = moviesSnapshot.val();
        for (const movie of Object.values(moviesData) as any[]) {
          // Verschiedene Rating-Strukturen unterstützen
          if (movie.rating) {
            if (typeof movie.rating === 'number' && movie.rating > 0) {
              totalRatings++;
            } else if (typeof movie.rating === 'object') {
              // Verwende calculateOverallRating für korrekte Bewertung
              const overallRating = calculateOverallRating(movie);
              if (parseFloat(overallRating) > 0) {
                totalRatings++;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Zählen der Bewertungen:', error);
      return null;
    }

    if (totalRatings >= badge.requirements.ratings!) {
      return {
        earned: true,
        details: `${totalRatings} Bewertungen abgegeben`,
      };
    }
    return null;
  }

  private async checkSocialBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    const watchlistCount = await badgeActivityLogger.getBadgeCounter(
      this.userId,
      'friends'
    );

    if (watchlistCount >= badge.requirements.friends!) {
      return {
        earned: true,
        details: `${watchlistCount} Serien zur Watchlist hinzugefügt`,
      };
    }
    return null;
  }

  private async checkCompletionBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Zähle komplette Serien über Firebase
    const seriesSnapshot = await firebase
      .database()
      .ref(`${this.userId}/serien`)
      .once('value');

    if (!seriesSnapshot.exists()) {
      return null;
    }

    const seriesData = seriesSnapshot.val();
    let completedSeriesCount = 0;

    // Prüfe jede Serie ob sie komplett ist
    for (const series of Object.values(seriesData) as any[]) {
      if (series.seasons && Array.isArray(series.seasons)) {
        let isSeriesComplete = true;

        // Prüfe ob alle Staffeln komplett sind
        for (const season of series.seasons) {
          if (season.episodes && Array.isArray(season.episodes)) {
            const hasUnwatchedEpisodes = season.episodes.some(
              (episode: any) => !episode.watched
            );
            if (hasUnwatchedEpisodes) {
              isSeriesComplete = false;
              break;
            }
          }
        }

        if (isSeriesComplete && series.seasons.length > 0) {
          completedSeriesCount++;
        }
      }
    }

    if (completedSeriesCount >= badge.requirements.series!) {
      return {
        earned: true,
        details: `${completedSeriesCount} Serien komplett abgeschlossen`,
      };
    }
    return null;
  }

  private async checkDedicationBadge(
    badge: Badge,
    _now: number
  ): Promise<{ earned: boolean; details?: string } | null> {
    // Hole alle Badge-Activities für Episode-Counts
    const allActivities = await badgeActivityLogger.getAllBadgeActivities(
      this.userId
    );

    // Zeitfenster bestimmen
    let timeWindowMs: number | null = null;
    let totalEpisodes = 0;

    if (badge.requirements.timeframe) {
      const now = Date.now();
      if (badge.requirements.timeframe === '1week') {
        timeWindowMs = 7 * 24 * 60 * 60 * 1000;
      } else if (badge.requirements.timeframe === '1month') {
        timeWindowMs = 30 * 24 * 60 * 60 * 1000;
      } else if (badge.requirements.timeframe === '1year') {
        timeWindowMs = 365 * 24 * 60 * 60 * 1000;
      }

      if (timeWindowMs) {
        const cutoffTime = now - timeWindowMs;

        // Filtere Activities im Zeitfenster
        const recentActivities = allActivities.filter(
          (activity) => activity.timestamp >= cutoffTime
        );

        // Zähle Episoden in den letzten X Zeitraum
        for (const activity of recentActivities) {
          if (activity.type === 'episode_watched') {
            totalEpisodes += 1;
          } else if (activity.type === 'episodes_watched') {
            totalEpisodes += (activity as any).episodeCount || 1;
          } else if (activity.type === 'season_watched') {
            totalEpisodes += (activity as any).episodeCount || 1;
          }
        }
      }
    } else {
      // Lebenszeitbadges - alle Episoden zählen
      for (const activity of allActivities) {
        if (activity.type === 'episode_watched') {
          totalEpisodes += 1;
        } else if (activity.type === 'episodes_watched') {
          totalEpisodes += (activity as any).episodeCount || 1;
        } else if (activity.type === 'season_watched') {
          totalEpisodes += (activity as any).episodeCount || 1;
        }
      }
    }

    if (totalEpisodes >= badge.requirements.episodes!) {
      const timeframeText = badge.requirements.timeframe
        ? ` (${badge.requirements.timeframe})`
        : ' (insgesamt)';
      return {
        earned: true,
        details: `${totalEpisodes} Episoden${timeframeText}`,
      };
    }
    return null;
  }

  /**
   * Hilfsmethoden für Datenabfragen - Nutzt Badge-Activity-System
   */
  private async getActivitiesSince(
    timestamp: number
  ): Promise<any[]> {
    try {
      return await badgeActivityLogger.getBadgeActivitiesSince(
        this.userId,
        timestamp
      );
    } catch (error) {
      console.error('❌ Fehler beim Laden der Badge-Activities:', error);
      return [];
    }
  }

  private async calculateCurrentStreak(): Promise<number> {
    try {
      const activities = await badgeActivityLogger.getAllBadgeActivities(
        this.userId
      );

      // Gruppiere Activities nach Tagen - nur "schauen"-Activities zählen
      const dayGroups = new Map<string, any[]>();
      activities.forEach((activity) => {
        if (
          activity.timestamp &&
          (activity.type === 'episode_watched' ||
            activity.type === 'episodes_watched' ||
            activity.type === 'season_watched')
        ) {
          const date = new Date(activity.timestamp);
          const dayKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

          if (!dayGroups.has(dayKey)) {
            dayGroups.set(dayKey, []);
          }
          dayGroups.get(dayKey)!.push(activity);
        }
      });

      let streak = 0;
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Beginne mit heute oder gestern (falls heute noch keine Activity)
      let checkDate = new Date(today);
      if (!dayGroups.has(todayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Zähle aufeinanderfolgende Tage rückwärts
      while (true) {
        const checkKey = `${checkDate.getFullYear()}-${String(
          checkDate.getMonth() + 1
        ).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        if (dayGroups.has(checkKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('❌ Fehler bei Streak-Berechnung:', error);
      return 0;
    }
  }

  private async getRewatchCount(): Promise<number> {
    try {
      // Hole alle Activities des Users
      const snapshot = await firebase
        .database()
        .ref(`activities/${this.userId}`)
        .once('value');

      if (!snapshot.exists()) {
        return 0;
      }

      const activities = Object.values(snapshot.val() || {}) as any[];

      // Zähle Rewatch-bezogene Activities
      let rewatchCount = 0;

      activities.forEach((activity) => {
        // KOMPLETT ERWEITERTE Rewatch-Erkennung
        const isRewatch =
          activity.type === 'season_rewatched' ||
          activity.batchType === 'rewatch' ||
          activity.isRewatch === true ||
          // Erkenne "(Nx gesehen)" Pattern
          (activity.itemTitle && /\(\d+x gesehen\)/.test(activity.itemTitle)) ||
          // Erkenne "(Nx)" Pattern (ohne "gesehen")
          (activity.itemTitle && /\(\d+x\)/.test(activity.itemTitle)) ||
          // Erkenne "komplett (Nx gesehen)" Pattern
          (activity.itemTitle &&
            /komplett \(\d+x gesehen\)/.test(activity.itemTitle)) ||
          // Erkenne "(auf Nx reduziert)" Pattern
          (activity.itemTitle &&
            /\(auf \d+x reduziert\)/.test(activity.itemTitle)) ||
          // Erkenne Rewatch in Titel
          (activity.itemTitle &&
            activity.itemTitle.toLowerCase().includes('rewatch'));

        if (isRewatch) {
          // Für Season-Activities: Nutze episodeCount
          if (
            activity.type === 'season_rewatched' &&
            activity.episodeCount &&
            activity.episodeCount > 0
          ) {
            rewatchCount += activity.episodeCount;
          }
          // Für Batch-Activities: Nutze episodeCount
          else if (
            activity.type === 'episodes_watched' &&
            activity.episodeCount &&
            activity.episodeCount > 0
          ) {
            rewatchCount += activity.episodeCount;
          }
          // Für einzelne Episodes: +1
          else {
            rewatchCount++;
          }
        }
      });

      return rewatchCount;
    } catch (error) {
      return 0;
    }
  }

  private async getUniqueSeriesCount(): Promise<number> {
    try {
      // Hole alle Serien des Users
      const snapshot = await firebase
        .database()
        .ref(`${this.userId}/serien`)
        .once('value');

      if (!snapshot.exists()) {
        return 0;
      }

      const series = Object.values(snapshot.val() || {}) as any[];
      const uniqueSeriesCount = series.length;

      return uniqueSeriesCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Speichert ein verdientes Badge in Firebase
   */
  private async saveBadge(badge: EarnedBadge): Promise<void> {
    await firebase
      .database()
      .ref(`badges/${this.userId}/${badge.id}`)
      .set({
        ...badge,
        earnedAt: firebase.database.ServerValue.TIMESTAMP,
      });
  }

  /**
   * Lädt alle Badges eines Users
   */
  async getUserBadges(): Promise<EarnedBadge[]> {
    const snapshot = await firebase
      .database()
      .ref(`badges/${this.userId}`)
      .once('value');

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    return Object.values(data) as EarnedBadge[];
  }

  /**
   * Lädt Badge-Progress für ein spezifisches Badge
   */
  async getBadgeProgress(badgeId: string): Promise<BadgeProgress | null> {
    const snapshot = await firebase
      .database()
      .ref(`badgeProgress/${this.userId}/${badgeId}`)
      .once('value');

    return snapshot.exists() ? snapshot.val() : null;
  }

  /**
   * Aktualisiert Badge-Progress
   */
  async updateBadgeProgress(
    badgeId: string,
    current: number,
    total: number
  ): Promise<void> {
    await firebase
      .database()
      .ref(`badgeProgress/${this.userId}/${badgeId}`)
      .set({
        badgeId,
        current,
        total,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP,
      });
  }

  /**
   * 🔄 Prüft ALLE Badges für einen User neu und vergibt fehlende Badges
   * Nützlich für Badge-System-Reparaturen oder wenn Badges nachträglich hinzugefügt werden
   */
  async recalculateAllBadges(): Promise<EarnedBadge[]> {
    const newBadges: EarnedBadge[] = [];
    const currentBadges = await this.getUserBadges();
    const currentBadgeIds = new Set(currentBadges.map((b) => b.id));

    // Durchlaufe alle verfügbaren Badge-Definitionen
    for (const badge of BADGE_DEFINITIONS) {
      // Skip wenn Badge bereits verdient
      if (currentBadgeIds.has(badge.id)) {
        continue;
      }

      // Prüfe Badge-Requirements basierend auf Kategorie
      let earned: { earned: boolean; details?: string } | null = null;
      const now = Date.now();

      switch (badge.category) {
        case 'social':
          earned = await this.checkSocialBadge(badge, now);
          break;
        case 'collector':
          earned = await this.checkCollectorBadge(badge, now);
          break;
        case 'series_explorer':
          earned = await this.checkExplorerBadge(badge, now);
          break;
        case 'binge':
          // Für Binge-Badges prüfen wir gegen letzte Activities
          const bingeMockActivity = { type: 'episode_watched', timestamp: now };
          earned = await this.checkBingeBadge(badge, bingeMockActivity, now);
          break;
        case 'quickwatch':
          // Für Quickwatch-Badges prüfen wir gegen letzte Activities
          const quickwatchMockActivity = { type: 'quickwatch', timestamp: now };
          earned = await this.checkQuickwatchBadge(
            badge,
            quickwatchMockActivity,
            now
          );
          break;
        case 'rewatch':
          // Für Rewatch-Badges prüfen wir gegen letzte Activities
          earned = await this.checkRewatchBadge(badge, now);
          break;
        case 'marathon':
          // Für Marathon-Badges prüfen wir gegen letzte Activities
          earned = await this.checkMarathonBadge(badge, now);
          break;
        case 'streak':
          // Für Streak-Badges prüfen wir gegen letzte Activities
          earned = await this.checkStreakBadge(badge, now);
          break;
        case 'completion':
          // Für Completion-Badges prüfen wir komplette Serien
          earned = await this.checkCompletionBadge(badge, now);
          break;
        case 'dedication':
          // Für Dedication-Badges prüfen wir zeitbasierte Episode-Counts
          earned = await this.checkDedicationBadge(badge, now);
          break;
        default:
          continue;
      }

      if (earned?.earned) {
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
}

export default BadgeSystem;

/**
 * 🛠️ Debug-Konsole: Badge-System-Funktionen für Browser-Konsole
 */
declare global {
  interface Window {
    debugBadges: {
      recalculateUserBadges: (userId: string) => Promise<void>;
      getUserBadges: (userId: string) => Promise<void>;
      getWatchlistCounter: (userId: string) => Promise<void>;
      getRatingsCount: (userId: string) => Promise<void>;
    };
  }
}
