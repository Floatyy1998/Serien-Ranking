import { describe, expect, it, vi } from 'vitest';

// watchActivity/* referenziert firebase nur innerhalb von Funktionen — für den
// reinen Fassaden-Import genügt ein leerer Compat-Mock.
vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: () => ({}) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import defaultExport, {
  WatchActivityService,
  logEpisodeWatch,
  logMovieWatch,
  getWatchStreak,
  getYearlyActivity,
  getEventsForYear,
  getBingeSessionsForYear,
  clearAllWrappedData,
} from './watchActivityService';

describe('watchActivityService (Re-Export-Fassade)', () => {
  it('re-exportiert alle Watch-Activity-Funktionen', () => {
    expect(typeof logEpisodeWatch).toBe('function');
    expect(typeof logMovieWatch).toBe('function');
    expect(typeof getWatchStreak).toBe('function');
    expect(typeof getYearlyActivity).toBe('function');
    expect(typeof getEventsForYear).toBe('function');
    expect(typeof getBingeSessionsForYear).toBe('function');
    expect(typeof clearAllWrappedData).toBe('function');
  });

  it('re-exportiert den WatchActivityService', () => {
    expect(WatchActivityService).toBeDefined();
  });

  it('hat einen Default-Export', () => {
    expect(defaultExport).toBeDefined();
  });
});
