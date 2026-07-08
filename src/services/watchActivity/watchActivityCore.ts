/**
 * Watch Activity Core - Haupt-API für Episode und Movie Watch Logging
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import type { EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';
import { updateLeaderboardStats } from '../leaderboardService';
import { createBaseEventData, createEpisodeEventData, getEventsPath, saveEvent } from './shared';
import { getActiveBingeSession, updateBingeSession } from './bingeSessionTracking';
import { updateWatchStreak } from './watchStreakTracking';
import { triggerPetReaction } from '../../hooks/usePetReactions';

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
  }).catch(() => {}); // bewusst still: Leaderboard ist Best-effort-Gamification

  // Freunde-Feed „gesehen"-Aktivität – NUR Erstwatch, kein Bulk-Marking (Catch-up
  // soll den Feed nicht zuspammen), kein Rewatch. Erscheint bewusst NICHT im
  // Notification-Hub/Badge (dort ausgeschlossen). Best-effort, dynamisch geladen.
  if (!isBulkMarking && !isRewatch) {
    import('../../features/badges/minimalActivityLogger')
      .then((m) =>
        m.logEpisodeWatchedActivity(userId, seriesTitle, seriesId, seasonNumber, episodeNumber)
      )
      .catch(() => {});
  }

  // Pet reaction – binge takes priority over rewatch over plain cheer.
  // Skipped for bulk-marking (catch-up) so the bubble doesn't spam.
  if (!isBulkMarking) {
    if (isBingeSession) triggerPetReaction({ tone: 'binge' });
    else if (isRewatch) triggerPetReaction({ tone: 'rewatch' });
    else triggerPetReaction({ tone: 'cheer' });
  }
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
    const existing = await findExistingMovieEvent(userId, movieId, year);

    if (existing) {
      if (rating !== undefined) {
        // Compact-Events speichern das Rating unter `rat`, Legacy unter `rating`.
        const ratingKey = existing.isCompact ? 'rat' : 'rating';
        await firebase
          .database()
          .ref(`${getEventsPath(userId, year)}/${existing.eventId}/${ratingKey}`)
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
    }).catch(() => {}); // bewusst still: Leaderboard ist Best-effort-Gamification

    // Pet reaction – movie tone if no rating, rated tone if user also rated.
    triggerPetReaction({ tone: rating !== undefined ? 'rated' : 'movie' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to log movie watch: ${message}`);
  }
}

async function findExistingMovieEvent(
  userId: string,
  movieId: number,
  year: number
): Promise<{ eventId: string; isCompact: boolean } | null> {
  try {
    // Kein orderByChild('movieId') mehr: Events werden im Compact-Format
    // gespeichert (t:'mv', s:movieId) — ein movieId-Child existiert dort nicht,
    // die alte Query traf also nie und jedes Re-Log/Re-Rating erzeugte ein
    // Duplikat (Wrapped zählte Filme + Laufzeit doppelt). Wir lesen den Knoten
    // einmal und erkennen beide Formate.
    const snapshot = await firebase.database().ref(getEventsPath(userId, year)).once('value');

    const events = snapshot.val() as Record<string, Record<string, unknown>> | null;
    if (!events) return null;

    for (const [eventId, raw] of Object.entries(events)) {
      // Compact: {t:'mv'|'mr', s:movieId}. Legacy: {type:'movie_*', movieId}.
      const isCompactMovie = (raw.t === 'mv' || raw.t === 'mr') && raw.s === movieId;
      const isLegacyMovie =
        (raw.type === 'movie_watch' || raw.type === 'movie_rating') && raw.movieId === movieId;
      if (isCompactMovie) return { eventId, isCompact: true };
      if (isLegacyMovie) return { eventId, isCompact: false };
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WatchActivity] Failed to find existing movie event: ${message}`);
    return null;
  }
}
