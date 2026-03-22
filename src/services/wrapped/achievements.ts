/**
 * Wrapped Achievements - Achievement-Berechnungslogik
 */

import { BingeSession } from '../../types/WatchActivity';
import {
  TopGenreEntry,
  TimeOfDayStats,
  DayOfWeekStats,
  WrappedAchievement,
  WRAPPED_ACHIEVEMENTS,
} from '../../types/Wrapped';

export interface AchievementContext {
  totalEpisodes: number;
  totalMovies: number;
  totalMinutes: number;
  favoriteTimeOfDay: TimeOfDayStats;
  favoriteDayOfWeek: DayOfWeekStats;
  topGenres: TopGenreEntry[];
  longestStreak: number;
  yearBingeSessions: BingeSession[];
}

export function calculateAchievements(ctx: AchievementContext): WrappedAchievement[] {
  const achievements: WrappedAchievement[] = [];

  for (const template of WRAPPED_ACHIEVEMENTS) {
    let unlocked = false;
    let value: string | number | undefined;

    switch (template.id) {
      case 'night_owl':
        unlocked =
          ctx.favoriteTimeOfDay.timeOfDay === 'night' && ctx.favoriteTimeOfDay.percentage >= 30;
        value = `${ctx.favoriteTimeOfDay.percentage}%`;
        break;

      case 'early_bird':
        unlocked =
          ctx.favoriteTimeOfDay.timeOfDay === 'morning' && ctx.favoriteTimeOfDay.percentage >= 30;
        value = `${ctx.favoriteTimeOfDay.percentage}%`;
        break;

      case 'binge_king':
        const maxBinge = ctx.yearBingeSessions.reduce(
          (max, s) => Math.max(max, s.episodes.length),
          0
        );
        unlocked = maxBinge >= 10;
        value = maxBinge;
        break;

      case 'movie_lover':
        unlocked = ctx.totalMovies >= 20;
        value = ctx.totalMovies;
        break;

      case 'series_addict':
        unlocked = ctx.totalEpisodes >= 500;
        value = ctx.totalEpisodes;
        break;

      case 'genre_explorer':
        unlocked = ctx.topGenres.length >= 5;
        value = ctx.topGenres.length;
        break;

      case 'weekend_warrior':
        const isWeekend =
          ctx.favoriteDayOfWeek.dayOfWeek === 0 || ctx.favoriteDayOfWeek.dayOfWeek === 6;
        unlocked = isWeekend && ctx.favoriteDayOfWeek.percentage >= 50;
        value = `${ctx.favoriteDayOfWeek.percentage}%`;
        break;

      case 'consistent':
        unlocked = ctx.longestStreak >= 30;
        value = ctx.longestStreak;
        break;

      case 'marathon_runner':
        const hours = Math.round(ctx.totalMinutes / 60);
        unlocked = hours >= 100;
        value = `${hours}h`;
        break;
    }

    achievements.push({ ...template, unlocked, value });
  }

  // Sortiere: Freigeschaltete zuerst
  return achievements.sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
}
