/**
 * Watch Activity Service - Re-Export aus modularer Struktur
 *
 * Dieser Re-Export stellt sicher, dass bestehende Imports weiterhin funktionieren:
 *   import { WatchActivityService } from '../services/watchActivityService'
 *   import { getYearlyActivity } from './watchActivityService'
 */

export {
  WatchActivityService,
  logEpisodeWatch,
  logMovieWatch,
  getWatchStreak,
  getYearlyActivity,
  getEventsForYear,
  getBingeSessionsForYear,
  clearAllWrappedData,
} from './watchActivity';

export { default } from './watchActivity';
