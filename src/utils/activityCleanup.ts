/**
 * 🧹 Activity Cleanup Utilities
 * 
 * Minimal utility functions for activity management
 */

import { FriendActivity } from '../interfaces/Friend';

/**
 * Limit activities to the most recent ones
 */
export const limitActivities = (activities: FriendActivity[], limit: number = 50): FriendActivity[] => {
  if (!activities || !Array.isArray(activities)) return [];
  
  return activities
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, limit);
};

/**
 * Clean up old activities (placeholder for now)
 */
export const cleanupOldActivities = async (_userId: string): Promise<void> => {
  // Placeholder - not implemented in minimal system
  console.log('Activity cleanup skipped in minimal system');
};