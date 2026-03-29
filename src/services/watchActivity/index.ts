/**
 * Watch Activity Service - Zentrale Datensammlung für Wrapped
 *
 * Alle Daten werden unter wrapped/{year}/ gespeichert:
 * - wrapped/{year}/events/{eventId} - Alle Watch-Events
 * - wrapped/{year}/bingeSessions/{sessionId} - Binge-Sessions
 * - wrapped/{year}/streak - Streak für das Jahr
 *
 * Am Jahresanfang wird wrapped/{previousYear} automatisch gelöscht.
 */

export { logEpisodeWatch, logMovieWatch } from './watchActivityCore';
export {
  getActiveBingeSession,
  updateBingeSession,
  getBingeSessionsForYear,
} from './bingeSessionTracking';
export { updateWatchStreak, getWatchStreak } from './watchStreakTracking';
export { checkBulkMarkingAndGetTimestamp } from './bulkMarkingDetection';
export {
  getYearlyActivity,
  getEventsForYear,
  clearAllWrappedData,
  saveEvent,
  createBaseEventData,
  createEpisodeEventData,
  cleanObject,
  generateEventId,
  detectDeviceType,
  getEventsPath,
  getBingeSessionsPath,
  getStreakPath,
  getWrappedBasePath,
} from './shared';

import { logEpisodeWatch, logMovieWatch } from './watchActivityCore';
import { getWatchStreak } from './watchStreakTracking';
import { getYearlyActivity, getEventsForYear, clearAllWrappedData } from './shared';
import { getBingeSessionsForYear } from './bingeSessionTracking';

export const WatchActivityService = {
  logEpisodeWatch,
  logMovieWatch,
  getWatchStreak,
  getYearlyActivity,
  getEventsForYear,
  getBingeSessionsForYear,
  clearAllWrappedData,
};

export default WatchActivityService;
