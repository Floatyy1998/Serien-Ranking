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

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  ActivityEvent,
  BingeSession,
  EpisodeWatchEvent,
  MovieWatchEvent,
  RatingEvent,
  SeriesAddedEvent,
  MovieAddedEvent,
  WatchStreak,
} from '../types/WatchActivity';
import { updateLeaderboardStats } from './leaderboardService';
import { toLocalDateString } from '../lib/date/date.utils';

// ============================================================================
// KONSTANTEN
// ============================================================================

const WRAPPED_BASE = 'wrapped';
const BINGE_BUFFER_MINUTES = 15;
const LAST_CLEANUP_KEY = 'wrapped_last_cleanup_year';

// Bulk-Marking Detection
const BULK_MARK_WINDOW_MS = 60000; // 60 Sekunden Zeitfenster
const BULK_MARK_THRESHOLD = 3; // Ab 3 Episoden gilt als Bulk-Marking
const EVENING_HOURS = [18, 19, 20, 21, 22, 23]; // Typische Abendstunden

// Tracker für Bulk-Marking-Erkennung
interface BulkMarkTracker {
  timestamps: number[];
  episodeCount: number;
  lastReset: number;
}

const bulkMarkTracker: BulkMarkTracker = {
  timestamps: [],
  episodeCount: 0,
  lastReset: Date.now(),
};

// ============================================================================
// PFAD-FUNKTIONEN
// ============================================================================

function getEventsPath(userId: string, year: number): string {
  return `${userId}/${WRAPPED_BASE}/${year}/events`;
}

function getBingeSessionsPath(userId: string, year: number): string {
  return `${userId}/${WRAPPED_BASE}/${year}/bingeSessions`;
}

function getStreakPath(userId: string, year: number): string {
  return `${userId}/${WRAPPED_BASE}/${year}/streak`;
}

function getWrappedBasePath(userId: string): string {
  return `${userId}/${WRAPPED_BASE}`;
}

// ============================================================================
// HILFSFUNKTIONEN
// ============================================================================

function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Prüft ob aktuell Bulk-Marking stattfindet und gibt verteilten Timestamp zurück
 */
function checkBulkMarkingAndGetTimestamp(): { isBulkMarking: boolean; distributedDate?: Date } {
  const now = Date.now();

  // Reset tracker wenn letzter Eintrag zu lange her
  if (bulkMarkTracker.timestamps.length > 0) {
    const oldestInWindow = bulkMarkTracker.timestamps.filter(t => now - t < BULK_MARK_WINDOW_MS);
    bulkMarkTracker.timestamps = oldestInWindow;
  }

  // Aktuellen Timestamp hinzufügen
  bulkMarkTracker.timestamps.push(now);
  bulkMarkTracker.episodeCount++;

  // Prüfen ob Bulk-Marking erkannt wurde
  const recentCount = bulkMarkTracker.timestamps.length;

  if (recentCount >= BULK_MARK_THRESHOLD) {
    // Bulk-Marking erkannt! Timestamp verteilen
    const positionInBulk = recentCount - 1; // 0-indexed

    // Verteile über die letzten Tage (max 7)
    const daysBack = Math.floor(positionInBulk / EVENING_HOURS.length);
    const hourIndex = positionInBulk % EVENING_HOURS.length;

    const distributedDate = new Date();
    distributedDate.setDate(distributedDate.getDate() - Math.min(daysBack, 7));
    distributedDate.setHours(EVENING_HOURS[hourIndex]);
    distributedDate.setMinutes(Math.floor(Math.random() * 45) + 5); // 5-50 Minuten
    distributedDate.setSeconds(Math.floor(Math.random() * 60));

    return { isBulkMarking: true, distributedDate };
  }

  return { isBulkMarking: false };
}

/**
 * Erstellt Basis-Metadaten für jedes Event
 */
function createBaseEventData(userId: string) {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    userId,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    week: getWeekNumber(now),
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
    deviceType: detectDeviceType(),
    platform: detectPlatform(),
  };
}

/**
 * Erstellt Basis-Metadaten für Episode-Events mit Bulk-Marking-Erkennung
 * Gibt auch zurück ob Bulk-Marking erkannt wurde (für Binge-Skipping)
 */
function createEpisodeEventData(userId: string): {
  eventData: ReturnType<typeof createBaseEventData>;
  isBulkMarking: boolean;
} {
  const { isBulkMarking, distributedDate } = checkBulkMarkingAndGetTimestamp();

  // Bei Bulk-Marking verwende verteilten Timestamp
  const dateToUse = isBulkMarking && distributedDate ? distributedDate : new Date();

  return {
    eventData: {
      timestamp: dateToUse.toISOString(),
      userId,
      year: dateToUse.getFullYear(),
      month: dateToUse.getMonth() + 1,
      week: getWeekNumber(dateToUse),
      dayOfWeek: dateToUse.getDay(),
      hour: dateToUse.getHours(),
      deviceType: detectDeviceType(),
      platform: detectPlatform(),
    },
    isBulkMarking,
  };
}

/**
 * Entfernt undefined und null Werte aus einem Objekt
 */
function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

// ============================================================================
// CLEANUP FUNKTION (DEAKTIVIERT - Daten werden für Journey behalten)
// ============================================================================

async function cleanupOldYearData(_userId: string): Promise<void> {
  // DEAKTIVIERT: Wir behalten alle historischen Daten für die Watch Journey
  // Die Daten werden jetzt jahresübergreifend für Trend-Analysen genutzt
  return;
}

// ============================================================================
// EVENT SPEICHERN
// ============================================================================

async function saveEvent(userId: string, event: ActivityEvent): Promise<boolean> {
  const eventId = generateEventId();
  const year = event.year;
  const eventPath = `${getEventsPath(userId, year)}/${eventId}`;

  try {
    await cleanupOldYearData(userId);

    const cleanEvent = cleanObject(event as unknown as Record<string, unknown>);

    await firebase.database().ref(eventPath).set(cleanEvent);

    return true;
  } catch (error) {
    console.error('[Wrapped] ❌ Failed to save event:', error);
    return false;
  }
}

// ============================================================================
// BINGE SESSION TRACKING
// ============================================================================

async function getActiveBingeSession(userId: string, seriesId: number): Promise<BingeSession | null> {
  try {
    const year = new Date().getFullYear();
    const snapshot = await firebase
      .database()
      .ref(getBingeSessionsPath(userId, year))
      .orderByChild('seriesId')
      .equalTo(seriesId)
      .once('value');

    const sessions = snapshot.val();
    if (!sessions) return null;

    for (const [id, session] of Object.entries(sessions)) {
      const s = session as BingeSession;
      if (s.isActive) {
        return { ...s, id };
      }
    }
    return null;
  } catch (error) {
    console.error('[Wrapped] Error getting binge session:', error);
    return null;
  }
}

async function updateBingeSession(
  userId: string,
  seriesId: number,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  episodeRuntime: number = 45
): Promise<string | undefined> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const activeSession = await getActiveBingeSession(userId, seriesId);
    const bingeSessionsPath = getBingeSessionsPath(userId, year);

    if (activeSession) {
      const lastEpisode = activeSession.episodes[activeSession.episodes.length - 1];
      const lastWatchTime = new Date(lastEpisode.watchedAt);
      const minutesSince = (now.getTime() - lastWatchTime.getTime()) / 60000;
      const avgEpisodeLength = activeSession.totalMinutes / activeSession.episodes.length;
      const bingeThreshold = avgEpisodeLength + BINGE_BUFFER_MINUTES;

      if (minutesSince < bingeThreshold) {
        // Continue session
        activeSession.episodes.push({
          seasonNumber,
          episodeNumber,
          watchedAt: now.toISOString(),
        });
        activeSession.totalMinutes += episodeRuntime;

        await firebase
          .database()
          .ref(`${bingeSessionsPath}/${activeSession.id}`)
          .update({
            episodes: activeSession.episodes,
            totalMinutes: activeSession.totalMinutes,
          });

        return activeSession.id;
      } else {
        // End session
        await firebase
          .database()
          .ref(`${bingeSessionsPath}/${activeSession.id}`)
          .update({
            isActive: false,
            endedAt: lastEpisode.watchedAt,
          });
      }
    }

    // Start new session
    const newSessionId = generateEventId();
    const newSession: BingeSession = {
      id: newSessionId,
      userId,
      startedAt: now.toISOString(),
      seriesId,
      seriesTitle,
      episodes: [{
        seasonNumber,
        episodeNumber,
        watchedAt: now.toISOString(),
      }],
      totalMinutes: episodeRuntime,
      isActive: true,
    };

    await firebase
      .database()
      .ref(`${bingeSessionsPath}/${newSessionId}`)
      .set(newSession);

    return newSessionId;
  } catch (error) {
    console.error('[Wrapped] Error updating binge session:', error);
    return undefined;
  }
}

// ============================================================================
// STREAK TRACKING
// ============================================================================

async function updateWatchStreak(userId: string): Promise<void> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const today = toLocalDateString(now);
    const streakRef = firebase.database().ref(getStreakPath(userId, year));
    const snapshot = await streakRef.once('value');

    const currentStreak: WatchStreak = snapshot.val() || {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastWatchDate: '',
      streaks: [],
    };

    const lastDate = currentStreak.lastWatchDate;

    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateString(yesterday);

    if (lastDate === yesterdayStr) {
      currentStreak.currentStreak += 1;
      if (currentStreak.currentStreak > currentStreak.longestStreak) {
        currentStreak.longestStreak = currentStreak.currentStreak;
      }
    } else if (lastDate) {
      if (currentStreak.currentStreak > 1) {
        const streakStart = new Date();
        streakStart.setDate(streakStart.getDate() - currentStreak.currentStreak);
        currentStreak.streaks.push({
          startDate: toLocalDateString(streakStart),
          endDate: lastDate,
          length: currentStreak.currentStreak,
        });
        if (currentStreak.streaks.length > 20) {
          currentStreak.streaks = currentStreak.streaks.slice(-20);
        }
      }
      currentStreak.currentStreak = 1;
    } else {
      currentStreak.currentStreak = 1;
    }

    currentStreak.lastWatchDate = today;
    await streakRef.set(currentStreak);
  } catch (error) {
    console.error('[Wrapped] Error updating streak:', error);
  }
}

// ============================================================================
// PUBLIC API - EPISODE WATCH
// ============================================================================

export async function logEpisodeWatch(
  userId: string,
  seriesId: number,
  seriesTitle: string,
  seriesNmr: number,
  seasonNumber: number,
  episodeNumber: number,
  episodeTitle?: string,
  episodeRuntime?: number,
  isRewatch: boolean = false,
  watchCount: number = 1,
  genres?: string[],
  providers?: string[]  // Changed: now accepts array of provider names
): Promise<void> {
  // Verwende Episode-spezifische Event-Erstellung mit Bulk-Marking-Erkennung
  const { eventData: baseEvent, isBulkMarking } = createEpisodeEventData(userId);
  const runtime = episodeRuntime || 45;

  // Binge session handling - SKIP für Bulk-Marking
  let bingeSessionId: string | undefined;
  let isBingeSession = false;

  if (!isBulkMarking) {
    bingeSessionId = await updateBingeSession(
      userId, seriesId, seriesTitle, seasonNumber, episodeNumber, runtime
    );

    const activeSession = await getActiveBingeSession(userId, seriesId);
    isBingeSession = activeSession ? activeSession.episodes.length > 1 : false;
  }

  // Build event - nur definierte Werte!
  const event: EpisodeWatchEvent = {
    ...baseEvent,
    type: 'episode_watch',
    seriesId,
    seriesTitle,
    seriesNmr,
    seasonNumber,
    episodeNumber,
    episodeRuntime: runtime,
    isRewatch,
    watchCount,
  };

  // Optional fields
  if (episodeTitle) event.episodeTitle = episodeTitle;
  if (genres && genres.length > 0) event.genres = genres;
  // Speichere alle Provider (für Wrapped-Statistiken)
  if (providers && providers.length > 0) {
    event.provider = providers[0];  // Hauptprovider für Abwärtskompatibilität
    event.providers = providers;     // Alle Provider
  }
  if (isBingeSession) event.isBingeSession = true;
  if (bingeSessionId) event.bingeSessionId = bingeSessionId;

  await saveEvent(userId, event);
  await updateWatchStreak(userId);

  // Leaderboard-Stats aktualisieren
  updateLeaderboardStats(userId, {
    episodesWatched: 1,
    watchtimeMinutes: runtime,
  }).catch(() => {});
}

// ============================================================================
// PUBLIC API - MOVIE WATCH
// ============================================================================

export async function logMovieWatch(
  userId: string,
  movieId: number,
  movieTitle: string,
  movieNmr: number,
  runtime?: number,
  rating?: number,
  genres?: string[],
  providers?: string[]  // Changed: now accepts array of provider names
): Promise<void> {
  const year = new Date().getFullYear();

  try {
    // Check for duplicate
    const existingEventId = await findExistingMovieEvent(userId, movieId, year);

    if (existingEventId) {
      if (rating !== undefined) {
        await firebase
          .database()
          .ref(`${getEventsPath(userId, year)}/${existingEventId}/rating`)
          .set(rating);
      }
      return;
    }

    const baseEvent = createBaseEventData(userId);

    const event: MovieWatchEvent = {
      ...baseEvent,
      type: 'movie_watch',
      movieId,
      movieTitle,
      movieNmr,
      runtime: runtime || 120,
    };

    if (rating !== undefined) event.rating = rating;
    if (genres && genres.length > 0) event.genres = genres;
    // Speichere alle Provider (für Wrapped-Statistiken)
    if (providers && providers.length > 0) {
      event.provider = providers[0];  // Hauptprovider für Abwärtskompatibilität
      event.providers = providers;     // Alle Provider
    }

    await saveEvent(userId, event);
    await updateWatchStreak(userId);

    // Leaderboard-Stats aktualisieren
    updateLeaderboardStats(userId, {
      moviesWatched: 1,
      watchtimeMinutes: runtime || 120,
    }).catch(() => {});
  } catch (error) {
    console.error('[Wrapped] Error logging movie watch:', error);
  }
}

async function findExistingMovieEvent(userId: string, movieId: number, year: number): Promise<string | null> {
  try {
    const snapshot = await firebase
      .database()
      .ref(getEventsPath(userId, year))
      .orderByChild('movieId')
      .equalTo(movieId)
      .once('value');

    const events = snapshot.val();
    if (!events) return null;

    for (const [eventId, event] of Object.entries(events)) {
      const e = event as ActivityEvent;
      if (e.type === 'movie_watch' || e.type === 'movie_rating') {
        return eventId;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// PUBLIC API - SERIES/MOVIE ADDED
// ============================================================================

export async function logSeriesAdded(
  userId: string,
  seriesId: number,
  seriesTitle: string,
  genres?: string[],
  provider?: string
): Promise<void> {
  const baseEvent = createBaseEventData(userId);

  const event: SeriesAddedEvent = {
    ...baseEvent,
    type: 'series_added',
    seriesId,
    seriesTitle,
  };

  if (genres && genres.length > 0) event.genres = genres;
  if (provider) event.provider = provider;

  await saveEvent(userId, event);
}

export async function logMovieAdded(
  userId: string,
  movieId: number,
  movieTitle: string,
  genres?: string[],
  provider?: string
): Promise<void> {
  const baseEvent = createBaseEventData(userId);

  const event: MovieAddedEvent = {
    ...baseEvent,
    type: 'movie_added',
    movieId,
    movieTitle,
  };

  if (genres && genres.length > 0) event.genres = genres;
  if (provider) event.provider = provider;

  await saveEvent(userId, event);
}

// ============================================================================
// PUBLIC API - RATING CHANGE
// ============================================================================

export async function logRatingChange(
  userId: string,
  itemType: 'series' | 'movie',
  itemId: number,
  itemTitle: string,
  rating: number,
  previousRating?: number
): Promise<void> {
  const baseEvent = createBaseEventData(userId);

  const eventType = previousRating
    ? rating === 0 ? 'rating_deleted' : 'rating_updated'
    : 'rating_added';

  const event: RatingEvent = {
    ...baseEvent,
    type: eventType,
    itemType,
    itemId,
    itemTitle,
    rating,
  };

  if (previousRating !== undefined) event.previousRating = previousRating;

  await saveEvent(userId, event);
}

// ============================================================================
// PUBLIC API - DATA RETRIEVAL
// ============================================================================

export async function getWatchStreak(userId: string, year: number): Promise<WatchStreak | null> {
  try {
    const snapshot = await firebase
      .database()
      .ref(getStreakPath(userId, year))
      .once('value');
    return snapshot.val();
  } catch (error) {
    console.error('[Wrapped] Error getting streak:', error);
    return null;
  }
}

export async function getYearlyActivity(userId: string, year: number): Promise<ActivityEvent[]> {
  const eventsPath = getEventsPath(userId, year);
  try {
    const snapshot = await firebase
      .database()
      .ref(eventsPath)
      .once('value');

    const data = snapshot.val();

    if (data) {
      const events = Object.values(data) as ActivityEvent[];
      return events;
    }

    return [];
  } catch (error) {
    console.error('[Wrapped] ❌ Error loading events:', error);
    return [];
  }
}

export async function getEventsForYear(userId: string, year: number): Promise<ActivityEvent[]> {
  return getYearlyActivity(userId, year);
}

export async function getBingeSessionsForYear(userId: string, year: number): Promise<BingeSession[]> {
  try {
    const snapshot = await firebase
      .database()
      .ref(getBingeSessionsPath(userId, year))
      .once('value');

    const data = snapshot.val();
    if (!data) return [];

    const sessions = Object.values(data) as BingeSession[];
    return sessions;
  } catch (error) {
    console.error('[Wrapped] Error getting binge sessions:', error);
    return [];
  }
}

// ============================================================================
// CLEANUP/ADMIN
// ============================================================================

export async function clearAllWrappedData(userId: string): Promise<void> {
  try {
    await firebase.database().ref(getWrappedBasePath(userId)).remove();
    localStorage.removeItem(LAST_CLEANUP_KEY);
  } catch (error) {
    console.error('[Wrapped] Error clearing data:', error);
    throw error;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const WatchActivityService = {
  logEpisodeWatch,
  logMovieWatch,
  logSeriesAdded,
  logMovieAdded,
  logRatingChange,
  getWatchStreak,
  getYearlyActivity,
  getEventsForYear,
  getBingeSessionsForYear,
  clearAllWrappedData,
};

export default WatchActivityService;
