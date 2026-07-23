import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import type { EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';
import { updateLeaderboardStats } from '../leaderboardService';
import { createEpisodeEventData, createMovieEventData, getEventsPath, saveEvent } from './shared';
import { getActiveBingeSession, updateBingeSession } from './bingeSessionTracking';
import { updateWatchStreak } from './watchStreakTracking';
import { triggerPetReaction } from '../../hooks/usePetReactions';
import { bumpSeriesVersion, dbGet, dbRef, paths } from '../db/ref';

/** Einzel-Marks setzen die Serie auf die Watchlist („Weiterschauen"); Bulk-Abhaken bewusst nicht. */
async function ensureOnWatchlist(userId: string, seriesId: number): Promise<void> {
  const path = `${paths.seriesItem(userId, seriesId)}/watchlist`;
  const current = await dbGet<boolean>(path);
  if (current === true) return;
  await dbRef(path).set(true);
  await bumpSeriesVersion(userId);
}

// PUBLIC API - EPISODE WATCH

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
  const { eventData: baseEvent, isBulkMarking } = createEpisodeEventData();
  const runtime = episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

  // Einzel-Mark → „Weiterschauen"; Rewatch setzt die Watchlist schon beim Start. Best-effort.
  if (!isBulkMarking && !isRewatch) {
    ensureOnWatchlist(userId, seriesId).catch(() => {});
  }

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

  if (genres && genres.length > 0) event.genres = genres;
  if (providers && providers.length > 0) {
    event.provider = providers[0];
    event.providers = providers;
  }
  if (isBingeSession) event.isBingeSession = true;
  if (bingeSessionId) event.bingeSessionId = bingeSessionId;

  await saveEvent(userId, event);
  await updateWatchStreak(userId);

  // Bulk-Marking (Nachtragen alter Folgen) zählt nicht für die Rangliste —
  // sonst gewinnt, wer seine Bibliothek importiert statt schaut.
  if (!isBulkMarking) {
    updateLeaderboardStats(userId, {
      episodesWatched: 1,
      watchtimeMinutes: runtime,
    }).catch(() => {}); // bewusst still: Leaderboard ist Best-effort-Gamification
  }

  // Freunde-Feed nur bei Erstwatch (kein Bulk/Rewatch — Feed-Spam); bewusst nicht im Notification-Hub.
  if (!isBulkMarking && !isRewatch) {
    import('../../features/badges/minimalActivityLogger')
      .then((m) =>
        m.logEpisodeWatchedActivity(userId, seriesTitle, seriesId, seasonNumber, episodeNumber)
      )
      .catch(() => {});
  }

  // Pet-Reaktion: binge > rewatch > cheer; bei Bulk-Marking übersprungen (Bubble-Spam).
  if (!isBulkMarking) {
    if (isBingeSession) triggerPetReaction({ tone: 'binge' });
    else if (isRewatch) triggerPetReaction({ tone: 'rewatch' });
    else triggerPetReaction({ tone: 'cheer' });
  }
}

// PUBLIC API - MOVIE WATCH

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

    // Bulk-Erkennung wie bei Episoden: ab 3 Film-Marks in 60 s (Bibliothek
    // nachtragen) — Timestamps werden zurückverteilt, Rangliste/Pet skippen.
    const { eventData: baseEvent, isBulkMarking } = createMovieEventData();

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

    // Bulk-Marking zählt nicht für die Rangliste — sonst gewinnt, wer seine
    // Filmbibliothek importiert statt schaut (gleiche Regel wie Episoden).
    if (!isBulkMarking) {
      updateLeaderboardStats(userId, {
        moviesWatched: 1,
        watchtimeMinutes: runtime || 120,
      }).catch(() => {}); // bewusst still: Leaderboard ist Best-effort-Gamification
    }

    // Pet reaction – movie tone if no rating, rated tone if user also rated.
    // Bei Bulk-Marking übersprungen (Bubble-Spam).
    if (!isBulkMarking) {
      triggerPetReaction({ tone: rating !== undefined ? 'rated' : 'movie' });
    }
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
    // Kein orderByChild('movieId'): Compact-Events (t:'mv', s:movieId) haben das Child nicht — die alte Query traf nie und erzeugte Duplikate.
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
