/**
 * Watch Activity Core - Haupt-API für Episode und Movie Watch Logging
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { ActivityEvent, EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';
import { updateLeaderboardStats } from '../leaderboardService';
import { createBaseEventData, createEpisodeEventData, getEventsPath, saveEvent } from './shared';
import { getActiveBingeSession, updateBingeSession } from './bingeSessionTracking';
import { updateWatchStreak } from './watchStreakTracking';

// ============================================================================
// PUBLIC API - EPISODE WATCH
// ============================================================================

export async function logEpisodeWatch(
  userId: string,
  seriesId: number,
  seriesTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  episodeRuntime?: number,
  isRewatch: boolean = false,
  genres?: string[],
  providers?: string[]
): Promise<void> {
  // Verwende Episode-spezifische Event-Erstellung mit Bulk-Marking-Erkennung
  const { eventData: baseEvent, isBulkMarking } = createEpisodeEventData();
  const runtime = episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

  // Binge session handling - SKIP für Bulk-Marking
  let bingeSessionId: string | undefined;
  let isBingeSession = false;

  if (!isBulkMarking) {
    bingeSessionId = await updateBingeSession(
      userId,
      seriesId,
      seriesTitle,
      seasonNumber,
      episodeNumber,
      runtime
    );

    const activeSession = await getActiveBingeSession(userId, seriesId);
    isBingeSession = activeSession ? activeSession.episodes.length > 1 : false;
  }

  // Build event
  const event: EpisodeWatchEvent = {
    ...baseEvent,
    type: 'episode_watch',
    seriesId,
    seriesTitle,
    seasonNumber,
    episodeNumber,
    episodeRuntime: runtime,
    isRewatch,
  };

  // Optional fields
  if (genres && genres.length > 0) event.genres = genres;
  if (providers && providers.length > 0) {
    event.provider = providers[0];
    event.providers = providers;
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
  runtime?: number,
  rating?: number,
  genres?: string[],
  providers?: string[]
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

    const baseEvent = createBaseEventData();

    const event: MovieWatchEvent = {
      ...baseEvent,
      type: 'movie_watch',
      movieId,
      movieTitle,
      runtime: runtime || 120,
    };

    if (rating !== undefined) event.rating = rating;
    if (genres && genres.length > 0) event.genres = genres;
    if (providers && providers.length > 0) {
      event.provider = providers[0];
      event.providers = providers;
    }

    await saveEvent(userId, event);
    await updateWatchStreak(userId);

    // Leaderboard-Stats aktualisieren
    updateLeaderboardStats(userId, {
      moviesWatched: 1,
      watchtimeMinutes: runtime || 120,
    }).catch(() => {});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to log movie watch: ${message}`);
  }
}

async function findExistingMovieEvent(
  userId: string,
  movieId: number,
  year: number
): Promise<string | null> {
  try {
    const snapshot = await firebase
      .database()
      .ref(getEventsPath(userId, year))
      .orderByChild('movieId')
      .equalTo(movieId)
      .once('value');

    const events = snapshot.val() as Record<string, ActivityEvent> | null;
    if (!events) return null;

    for (const [eventId, event] of Object.entries(events)) {
      if (event.type === 'movie_watch' || event.type === 'movie_rating') {
        return eventId;
      }
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to find existing movie event: ${message}`);
    return null;
  }
}
