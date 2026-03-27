import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useState } from 'react';
import { useAuth } from '../AuthContext';
import { trackEpisodeWatched } from '../firebase/analytics';
import { petService } from '../services/petService';
import { WatchActivityService } from '../services/watchActivityService';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
import { useContinueWatching } from './useContinueWatching';
import { shouldTriggerQuickRate, useQuickSeasonRating } from './useQuickSeasonRating';
import type { Series } from '../types/Series';
import type { TodayEpisode } from './useWebWorkerTodayEpisodes';
import { useWebWorkerTodayEpisodes } from './useWebWorkerTodayEpisodes';

type ContinueWatchingItem = ReturnType<typeof useContinueWatching>[number];

interface EpisodeSwipeHandlersReturn {
  continueWatching: ContinueWatchingItem[];
  swipingContinueEpisodes: Set<string>;
  setSwipingContinueEpisodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  dragOffsetsContinue: Record<string, number>;
  setDragOffsetsContinue: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  completingContinueEpisodes: Set<string>;
  hiddenContinueEpisodes: Set<string>;
  handleContinueEpisodeComplete: (
    item: ContinueWatchingItem,
    swipeDirection?: 'left' | 'right'
  ) => Promise<void>;
  todayEpisodes: TodayEpisode[];
  swipingEpisodes: Set<string>;
  setSwipingEpisodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  dragOffsetsEpisodes: Record<string, number>;
  setDragOffsetsEpisodes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  completingEpisodes: Set<string>;
  hiddenEpisodes: Set<string>;
  handleEpisodeComplete: (
    episode: TodayEpisode,
    swipeDirection?: 'left' | 'right'
  ) => Promise<void>;
  swipeDirections: Record<string, 'left' | 'right'>;
  quickRatingOpen: boolean;
  quickRatingSeries: Series | null;
  quickRatingSeasonNumber: number;
  closeQuickRating: () => void;
  saveQuickRating: (rating: number) => Promise<void>;
}

/**
 * Markiert eine Episode in Firebase als gesehen und gibt den Watch-Count vor dem Update zurueck.
 * Schreibt watched, watchCount, lastWatchedAt und (beim Erstwatch) firstWatchedAt.
 */
async function markEpisodeWatchedInFirebase(
  uid: string,
  seriesNmr: number | string,
  seasonIndex: number,
  episodeIndex: number
): Promise<number> {
  const basePath = `${uid}/serien/${seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
  const db = firebase.database();

  await db.ref(`${basePath}/watched`).set(true);

  const watchCountRef = db.ref(`${basePath}/watchCount`);
  const snapshot = await watchCountRef.once('value');
  const currentCount: number = snapshot.val() || 0;
  await watchCountRef.set(currentCount + 1);

  const now = new Date().toISOString();
  await db.ref(`${basePath}/lastWatchedAt`).set(now);

  if (currentCount === 0) {
    await db.ref(`${basePath}/firstWatchedAt`).set(now);
  }

  return currentCount;
}

/**
 * Startet die Exit-Animation und blendet die Episode nach 300ms aus dem UI aus.
 */
function scheduleEpisodeHide(
  episodeKey: string,
  setCompleting: React.Dispatch<React.SetStateAction<Set<string>>>,
  setHidden: React.Dispatch<React.SetStateAction<Set<string>>>
): void {
  setTimeout(() => {
    setHidden((prev) => new Set(prev).add(episodeKey));
    setCompleting((prev) => {
      const next = new Set(prev);
      next.delete(episodeKey);
      return next;
    });
  }, 300);
}

export const useEpisodeSwipeHandlers = (): EpisodeSwipeHandlersReturn => {
  const authContext = useAuth();
  const user = authContext?.user ?? null;
  const continueWatching = useContinueWatching();
  const todayEpisodes = useWebWorkerTodayEpisodes();
  const {
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    showQuickRating,
    closeQuickRating,
    saveQuickRating,
  } = useQuickSeasonRating();

  // Today-episodes Swipe-State
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsetsEpisodes, setDragOffsetsEpisodes] = useState<Record<string, number>>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());

  // Continue-watching Swipe-State
  const [swipingContinueEpisodes, setSwipingContinueEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsetsContinue, setDragOffsetsContinue] = useState<Record<string, number>>({});
  const [completingContinueEpisodes, setCompletingContinueEpisodes] = useState<Set<string>>(
    new Set()
  );
  const [hiddenContinueEpisodes, setHiddenContinueEpisodes] = useState<Set<string>>(new Set());

  // Gemeinsame Swipe-Richtung fuer Exit-Animationen
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

  const handleContinueEpisodeComplete = useCallback(
    async (item: ContinueWatchingItem, swipeDirection: 'left' | 'right' = 'right') => {
      const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;
      setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));
      setCompletingContinueEpisodes((prev) => new Set(prev).add(episodeKey));

      if (user && item.nmr !== undefined) {
        try {
          const currentCount = await markEpisodeWatchedInFirebase(
            user.uid,
            item.nmr,
            item.nextEpisode.seasonIndex,
            item.nextEpisode.episodeIndex
          );
          trackEpisodeWatched(
            item.title,
            item.nextEpisode.seasonNumber,
            item.nextEpisode.episodeNumber,
            {
              tmdbId: item.id,
              genres: item.genre?.genres,
              runtime: item.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              isRewatch: currentCount > 0,
              source: 'continue_watching_swipe',
            }
          );
          await petService.watchedSeriesWithGenreAllPets(user.uid, item.genre?.genres || []);
          if (currentCount === 0) {
            const providers = item.provider?.provider?.map((p: { name: string }) => p.name);
            WatchActivityService.logEpisodeWatch(
              user.uid,
              item.id,
              item.title,
              item.nextEpisode.seasonIndex + 1,
              item.nextEpisode.episodeIndex + 1,
              item.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              false,
              item.genre?.genres,
              providers
            );
          }
        } catch (error) {
          console.error('Error marking episode as watched:', error);
        }

        // Quick-Rate: Trigger wenn letzte Episode der letzten Staffel
        if (item.seasons) {
          const seriesLike = {
            seasons: item.seasons,
            rating: {},
            rewatch: undefined,
            genre: item.genre,
            title: item.title,
            id: item.id,
            nmr: item.nmr,
          } as unknown as Series;
          if (
            shouldTriggerQuickRate(
              seriesLike,
              item.nextEpisode.seasonIndex,
              item.nextEpisode.episodeIndex
            )
          ) {
            setTimeout(() => {
              showQuickRating(seriesLike, item.nextEpisode.seasonNumber);
            }, 500);
          }
        }
      }
      scheduleEpisodeHide(episodeKey, setCompletingContinueEpisodes, setHiddenContinueEpisodes);
    },
    [user, showQuickRating]
  );

  const handleEpisodeComplete = useCallback(
    async (episode: TodayEpisode, swipeDirection: 'left' | 'right' = 'right') => {
      const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;
      setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));
      setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

      if (user) {
        try {
          const currentCount = await markEpisodeWatchedInFirebase(
            user.uid,
            episode.seriesNmr,
            episode.seasonIndex,
            episode.episodeIndex
          );
          trackEpisodeWatched(episode.seriesTitle, episode.seasonNumber, episode.episodeNumber, {
            tmdbId: episode.seriesId,
            genres: episode.seriesGenre,
            runtime: episode.runtime || DEFAULT_EPISODE_RUNTIME_MINUTES,
            isRewatch: currentCount > 0,
            source: 'today_episodes_swipe',
          });
          await petService.watchedSeriesWithGenreAllPets(user.uid, episode.seriesGenre || []);
          if (currentCount === 0) {
            WatchActivityService.logEpisodeWatch(
              user.uid,
              Number(episode.seriesId),
              episode.seriesTitle,
              episode.seasonNumber,
              episode.episodeNumber,
              episode.runtime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              false,
              episode.seriesGenre,
              episode.seriesProviders
            );
          }
        } catch (error) {
          console.error('Error marking episode as watched:', error);
        }
      }
      scheduleEpisodeHide(episodeKey, setCompletingEpisodes, setHiddenEpisodes);
    },
    [user]
  );

  return {
    // Continue-watching Daten & State
    continueWatching,
    swipingContinueEpisodes,
    setSwipingContinueEpisodes,
    dragOffsetsContinue,
    setDragOffsetsContinue,
    completingContinueEpisodes,
    hiddenContinueEpisodes,
    handleContinueEpisodeComplete,
    // Today-episodes Daten & State
    todayEpisodes,
    swipingEpisodes,
    setSwipingEpisodes,
    dragOffsetsEpisodes,
    setDragOffsetsEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    handleEpisodeComplete,
    // Gemeinsam
    swipeDirections,
    // Quick rating
    quickRatingOpen,
    quickRatingSeries,
    quickRatingSeasonNumber,
    closeQuickRating,
    saveQuickRating,
  };
};
