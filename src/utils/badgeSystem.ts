import firebase from 'firebase/compat/app';

export type BadgeCategory = 'binge' | 'quickwatch' | 'marathon' | 'streak' | 'rewatch' | 'series_explorer';
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
    rarity: 'common'
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
    rarity: 'common'
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
    rarity: 'rare'
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
    rarity: 'rare'
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
    rarity: 'epic'
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
    rarity: 'epic'
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
    rarity: 'epic'
  },
  {
    id: 'binge_diamond',
    category: 'binge',
    tier: 'diamond',
    name: 'Binge-Gott',
    description: 'Eine komplette Serie (30+ Episoden) an einem Wochenende beendet',
    emoji: '🔥',
    color: '#b9f2ff',
    requirements: { episodes: 30, timeframe: '2days' },
    rarity: 'legendary'
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
    rarity: 'common'
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
    rarity: 'common'
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
    rarity: 'rare'
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
    rarity: 'rare'
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
    rarity: 'epic'
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
    rarity: 'epic'
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
    rarity: 'legendary'
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
    rarity: 'legendary'
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
    rarity: 'common'
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
    rarity: 'common'
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
    rarity: 'rare'
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
    rarity: 'rare'
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
    rarity: 'epic'
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
    rarity: 'epic'
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
    rarity: 'common'
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
    rarity: 'common'
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
    rarity: 'rare'
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
    rarity: 'rare'
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
    rarity: 'epic'
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
    rarity: 'legendary'
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
    rarity: 'common'
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
    rarity: 'common'
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
    rarity: 'rare'
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
    rarity: 'rare'
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
    rarity: 'epic'
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
    rarity: 'epic'
  },

  // SERIES EXPLORER BADGES 🗺️
  {
    id: 'explorer_bronze',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Entdecker',
    description: '10 verschiedene Serien angefangen',
    emoji: '🗺️',
    color: '#cd7f32',
    requirements: { series: 10 },
    rarity: 'common'
  },
  {
    id: 'explorer_bronze_plus',
    category: 'series_explorer',
    tier: 'bronze',
    name: 'Serien-Scout',
    description: '20 verschiedene Serien angefangen',
    emoji: '🔍',
    color: '#cd7f32',
    requirements: { series: 20 },
    rarity: 'common'
  },
  {
    id: 'explorer_silver',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Serien-Sammler',
    description: '35 verschiedene Serien angefangen',
    emoji: '📚',
    color: '#c0c0c0',
    requirements: { series: 35 },
    rarity: 'rare'
  },
  {
    id: 'explorer_silver_plus',
    category: 'series_explorer',
    tier: 'silver',
    name: 'Genre-Jäger',
    description: '55 verschiedene Serien angefangen',
    emoji: '🎯',
    color: '#c0c0c0',
    requirements: { series: 55 },
    rarity: 'rare'
  },
  {
    id: 'explorer_gold',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Genre-Meister',
    description: '80 verschiedene Serien angefangen',
    emoji: '🎬',
    color: '#ffd700',
    requirements: { series: 80 },
    rarity: 'epic'
  },
  {
    id: 'explorer_gold_plus',
    category: 'series_explorer',
    tier: 'gold',
    name: 'Serien-Universalist',
    description: '120 verschiedene Serien angefangen',
    emoji: '🌍',
    color: '#ffd700',
    requirements: { series: 120 },
    rarity: 'epic'
  }
];

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
    const currentBadgeIds = new Set(currentBadges.map(b => b.id));

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
          details: earned.details
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
  private async checkBadgeRequirements(badge: Badge, activityData: any): Promise<{ earned: boolean; details?: string } | null> {
    const now = Date.now();
    
    switch (badge.category) {
      case 'binge':
        // Binge-Badges können für alle Episode-Activities geprüft werden
        if (activityData.type === 'episode_watched' || activityData.type === 'episodes_watched' || activityData.type === 'rewatch') {
          return this.checkBingeBadge(badge, activityData, now);
        }
        return null;
      case 'quickwatch':
        // Quickwatch-Badges können für alle Episode-Activities geprüft werden
        if (activityData.type === 'episode_watched' || activityData.type === 'episodes_watched' || activityData.type === 'rewatch') {
          return this.checkQuickwatchBadge(badge, activityData, now);
        }
        return null;
      case 'marathon':
        // Marathon-Badges können für alle Episode-Activities geprüft werden
        if (activityData.type === 'episode_watched' || activityData.type === 'episodes_watched' || activityData.type === 'rewatch') {
          return this.checkMarathonBadge(badge, now);
        }
        return null;
      case 'streak':
        // Streak-Badges können für alle Activities geprüft werden
        return this.checkStreakBadge(badge, now);
      case 'rewatch':
        // Prüfe sowohl auf Activity-Typ 'rewatch' als auch auf isRewatch-Flag
        if (activityData.type === 'rewatch' || activityData.isRewatch) {
          return this.checkRewatchBadge(badge, now);
        }
        return null;
      case 'series_explorer':
        // Explorer-Badges können für alle Activities geprüft werden
        return this.checkExplorerBadge(badge, now);
      default:
        return null;
    }
  }

  private async checkBingeBadge(badge: Badge, activityData: any, now: number): Promise<{ earned: boolean; details?: string } | null> {
    
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
    activities.forEach(activity => {
      if (activity.tmdbId && (activity.type === 'episode_watched' || activity.type === 'episodes_watched')) {
        if (!seriesGroups.has(activity.tmdbId)) {
          seriesGroups.set(activity.tmdbId, []);
        }
        seriesGroups.get(activity.tmdbId)!.push(activity);
      }
    });
    
    // Prüfe ob eine Serie die Anforderungen erfüllt
    for (const [tmdbId, seriesActivities] of seriesGroups) {
      let episodeCount = 0;
      let seriesTitle = 'Unbekannte Serie';
      
      seriesActivities.forEach(activity => {
        if (activity.type === 'episodes_watched' && activity.episodeCount) {
          episodeCount += activity.episodeCount;
        } else if (activity.type === 'episode_watched') {
          episodeCount += 1;
        } else if (activity.type === 'rewatch') {
          episodeCount += 1; // Rewatch zählt auch als Episode
        }
        
        // Verbesserte Titel-Extraktion
        if (activity.itemTitle) {
          if (activity.itemTitle.includes(' - ')) {
            seriesTitle = activity.itemTitle.split(' - ')[0];
          } else {
            // Fallback für andere Title-Formate
            seriesTitle = activity.itemTitle;
          }
        }
      });
      
      // Episode-basierte Binge Badges (3, 5, 20 Episoden)
      if (badge.requirements.episodes && episodeCount >= badge.requirements.episodes) {
        return {
          earned: true,
          details: `${seriesTitle} - ${episodeCount} Episoden in ${badge.requirements.timeframe || 'kurzer Zeit'}`
        };
      }
      
      // Für Season-basierte Badges: PRÜFE ECHTE STAFFEL-COMPLETION
      if (badge.requirements.seasons) {
        // WICHTIGE KORREKTUR: Nicht einfach durch 8 teilen!
        // Schaue nach tatsächlichen "Staffel komplett" Activities
        let actualSeasonsCompleted = 0;
        
        seriesActivities.forEach(activity => {
          // Zähle nur echte "kompett" Staffel-Activities
          if (activity.itemTitle && 
              (activity.itemTitle.includes('komplett') || 
               activity.itemTitle.includes('Staffel') && activity.itemTitle.includes('komplett'))) {
            actualSeasonsCompleted++;
          }
        });
        
        if (actualSeasonsCompleted >= badge.requirements.seasons) {
          return {
            earned: true,
            details: `${seriesTitle} - ${actualSeasonsCompleted} Staffel${actualSeasonsCompleted > 1 ? 'n' : ''} komplett`
          };
        }
      }
    }
    
    return null;
  }

  private async checkQuickwatchBadge(badge: Badge, activityData: any, now: number): Promise<{ earned: boolean; details?: string } | null> {
    
    // Prüfe ob aktuelle Episode am Release Day geschaut wurde
    if (activityData.airDate && activityData.timestamp) {
      const airDate = new Date(activityData.airDate);
      const watchDate = new Date(activityData.timestamp);
      
      // Vergleiche nur das Datum (ohne Zeit)
      const airDateString = airDate.toDateString();
      const watchDateString = watchDate.toDateString();
      
      if (airDateString === watchDateString) {
        // Hole aktuellen Release Day Counter aus Firebase
        const counterRef = firebase.database().ref(`badges/${this.userId}/counters/release_day_episodes`);
        const counterSnapshot = await counterRef.once('value');
        const releaseDayCount = (counterSnapshot.val() || 0) + 1; // +1 für aktuelle Episode
        
        // Update Counter
        await counterRef.set(releaseDayCount);
        
        // Prüfe Badge-Anforderungen
        if (badge.requirements.episodes && releaseDayCount >= badge.requirements.episodes) {
          return {
            earned: true,
            details: `${activityData.seriesTitle} - ${releaseDayCount} Episoden am Veröffentlichungstag`
          };
        }
      }
    }
    
    return null;
  }

  private async checkMarathonBadge(badge: Badge, now: number): Promise<{ earned: boolean; details?: string } | null> {
    
    // Prüfe Episoden der letzten Woche
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const activities = await this.getActivitiesSince(weekAgo);
    
    // Zähle alle Episode-Activities
    let totalEpisodes = 0;
    
    activities.forEach(activity => {
      if (activity.type === 'episode_watched') {
        totalEpisodes += 1;
      } else if (activity.type === 'episodes_watched' && activity.episodeCount) {
        totalEpisodes += activity.episodeCount;
      } else if (activity.type === 'rewatch') {
        totalEpisodes += 1; // Rewatch zählt auch als Episode
      }
    });
    
    if (totalEpisodes >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${totalEpisodes} Episoden in einer Woche`
      };
    }
    return null;
  }

  private async checkStreakBadge(badge: Badge, _now: number): Promise<{ earned: boolean; details?: string } | null> {
    const streak = await this.calculateCurrentStreak();
    
    if (streak >= badge.requirements.days!) {
      return {
        earned: true,
        details: `${streak} Tage Streak`
      };
    }
    return null;
  }

  private async checkRewatchBadge(badge: Badge, _now: number): Promise<{ earned: boolean; details?: string } | null> {
    const rewatchCount = await this.getRewatchCount();
    
    if (rewatchCount >= badge.requirements.episodes!) {
      return {
        earned: true,
        details: `${rewatchCount} Rewatch-Episoden`
      };
    }
    return null;
  }

  private async checkExplorerBadge(badge: Badge, _now: number): Promise<{ earned: boolean; details?: string } | null> {
    const seriesCount = await this.getUniqueSeriesCount();
    
    if (seriesCount >= badge.requirements.series!) {
      return {
        earned: true,
        details: `${seriesCount} verschiedene Serien`
      };
    }
    return null;
  }

  /**
   * Hilfsmethoden für Datenabfragen
   */
  private async getActivitiesSince(timestamp: number): Promise<any[]> {
    try {
      const snapshot = await firebase
        .database()
        .ref(`activities/${this.userId}`)
        .orderByChild('timestamp')
        .startAt(timestamp)
        .once('value');
        
      if (!snapshot.exists()) {
        return [];
      }
      
      const activities = Object.values(snapshot.val() || {}) as any[];
      return activities;
    } catch (error) {
      return [];
    }
  }

  private async calculateCurrentStreak(): Promise<number> {
    try {
      const snapshot = await firebase
        .database()
        .ref(`activities/${this.userId}`)
        .orderByChild('timestamp')
        .once('value');
      
      if (!snapshot.exists()) {
        return 0;
      }
      
      const activities = Object.values(snapshot.val() || {}) as any[];
      
      // Gruppiere Activities nach Tagen
      const dayGroups = new Map<string, any[]>();
      activities.forEach(activity => {
        if (activity.timestamp) {
          const date = new Date(activity.timestamp);
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          
          if (!dayGroups.has(dayKey)) {
            dayGroups.set(dayKey, []);
          }
          dayGroups.get(dayKey)!.push(activity);
        }
      });
      
      // Sortiere Tage absteigend (neueste zuerst)
      const sortedDates = Array.from(dayGroups.keys()).sort().reverse();
      
      let streak = 0;
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Beginne mit heute oder gestern (falls heute noch keine Activity)
      let checkDate = new Date(today);
      if (!dayGroups.has(todayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Zähle aufeinanderfolgende Tage rückwärts
      while (true) {
        const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        
        if (dayGroups.has(checkKey)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
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
      
      activities.forEach(activity => {
        // KOMPLETT ERWEITERTE Rewatch-Erkennung - berücksichtige ALLE möglichen Rewatch-Szenarien
        const isRewatch = activity.type === 'rewatch' || 
                          activity.batchType === 'rewatch' ||
                          // Erkenne "(Nx gesehen)" Pattern
                          (activity.itemTitle && /\(\d+x gesehen\)/.test(activity.itemTitle)) ||
                          // Erkenne "(Nx)" Pattern (ohne "gesehen")
                          (activity.itemTitle && /\(\d+x\)/.test(activity.itemTitle)) ||
                          // Erkenne "komplett (Nx gesehen)" Pattern
                          (activity.itemTitle && /komplett \(\d+x gesehen\)/.test(activity.itemTitle)) ||
                          // Erkenne "(auf Nx reduziert)" Pattern
                          (activity.itemTitle && /\(auf \d+x reduziert\)/.test(activity.itemTitle)) ||
                          // NEUE: Erkenne Batch-Activities mit Rewatch-Inhalten
                          (activity.type === 'episodes_watched' && activity.itemTitle && 
                           (
                             activity.itemTitle.includes('komplett durchgebingt') || 
                             activity.itemTitle.includes('(') && activity.itemTitle.includes('x')
                           )
                          );
        
        if (isRewatch) {
          // Für Batch-Activities: Zähle alle Episoden in dem Batch
          if (activity.type === 'episodes_watched' && activity.episodeCount && activity.episodeCount > 0) {
            rewatchCount += activity.episodeCount;
          } else {
            // Für einzelne Episodes: +1
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
        earnedAt: firebase.database.ServerValue.TIMESTAMP
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
  async updateBadgeProgress(badgeId: string, current: number, total: number): Promise<void> {
    await firebase
      .database()
      .ref(`badgeProgress/${this.userId}/${badgeId}`)
      .set({
        badgeId,
        current,
        total,
        lastUpdated: firebase.database.ServerValue.TIMESTAMP
      });
  }
}

export default BadgeSystem;