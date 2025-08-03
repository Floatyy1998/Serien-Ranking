/**
 * 🚫 Legacy Activity Logger - Deprecated Functions
 * 
 * These functions are no longer used in the new minimal system.
 * Deletion activities are not logged as friend activities.
 */

import type { EarnedBadge } from './badgeDefinitions';

/**
 * @deprecated Movie deletion not logged in minimal system
 */
export const logMovieDeleted = async (
  userId: string,
  movieTitle: string,
  movieId?: number
): Promise<EarnedBadge[]> => {
  console.log('🚫 Movie deletion not logged in minimal system:', { userId, movieTitle, movieId });
  return [];
};

/**
 * @deprecated Series deletion not logged in minimal system
 */
export const logSeriesDeleted = async (
  userId: string,
  seriesTitle: string,
  seriesId?: number
): Promise<EarnedBadge[]> => {
  console.log('🚫 Series deletion not logged in minimal system:', { userId, seriesTitle, seriesId });
  return [];
};