/**
 * Wrapped Module - Re-exports aller Wrapped-Berechnungen
 */

export { calculateWrappedStats } from './aggregations';
export {
  calculateTopSeries,
  calculateTopMovies,
  calculateTopGenres,
  calculateTopProviders,
} from './rankings';
export {
  calculateMonthlyBreakdown,
  findMostActiveMonth,
  findMostActiveDay,
  calculateFavoriteTimeOfDay,
  calculateFavoriteDayOfWeek,
  findFirstWatch,
  findLastWatch,
  calculateLateNightStats,
  calculateHeatmapData,
} from './temporal';
export { calculateAchievements } from './achievements';
export type { AchievementContext } from './achievements';
export { generateFunFacts } from './funFacts';
export type { FunFactContext } from './funFacts';
