import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useState } from 'react';
import { useAuth } from '../App';
import { petService } from '../services/petService';
import { WatchActivityService } from '../services/watchActivityService';
import { useContinueWatching } from './useContinueWatching';
import { useWebWorkerTodayEpisodes } from './useWebWorkerTodayEpisodes';

export const useEpisodeSwipeHandlers = () => {
  const authContext = useAuth();
  const user = authContext?.user ?? null;
  const continueWatching = useContinueWatching();
  const todayEpisodes = useWebWorkerTodayEpisodes();

  // Today-episodes swipe state
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsetsEpisodes, setDragOffsetsEpisodes] = useState<{
    [key: string]: number;
  }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());

  // Continue-watching swipe state
  const [swipingContinueEpisodes, setSwipingContinueEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsetsContinue, setDragOffsetsContinue] = useState<{
    [key: string]: number;
  }>({});
  const [completingContinueEpisodes, setCompletingContinueEpisodes] = useState<Set<string>>(
    new Set()
  );
  const [hiddenContinueEpisodes, setHiddenContinueEpisodes] = useState<Set<string>>(new Set());

  // Shared swipe direction state
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

  // Handle continue watching episode complete
  const handleContinueEpisodeComplete = async (
    item: (typeof continueWatching)[number],
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = `${item.id}-${item.nextEpisode.seasonNumber}-${item.nextEpisode.episodeNumber}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingContinueEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase
    if (user && item.nmr !== undefined) {
      try {
        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${item.nmr}/seasons/${item.nextEpisode.seasonIndex}/episodes/${item.nextEpisode.episodeIndex}/watched`
          );
        await ref.set(true);

        // Also update watchCount if needed
        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${item.nmr}/seasons/${item.nextEpisode.seasonIndex}/episodes/${item.nextEpisode.episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${item.nmr}/seasons/${item.nextEpisode.seasonIndex}/episodes/${item.nextEpisode.episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());

          // Pet XP geben mit Genre-Bonus (nur beim ersten Schauen)
          await petService.watchedSeriesWithGenreAllPets(user.uid, item.genre?.genres || []);

          // Wrapped 2026: Episode-Watch loggen
          const providers = item.provider?.provider?.map((p: { name: string }) => p.name);
          WatchActivityService.logEpisodeWatch(
            user.uid,
            item.id,
            item.title,
            item.nmr,
            item.nextEpisode.seasonIndex + 1,
            item.nextEpisode.episodeIndex + 1,
            item.nextEpisode.name,
            item.episodeRuntime || 45,
            false,
            1,
            item.genre?.genres,
            providers
          );
        }
      } catch (error) {
        console.error('Error marking episode as watched:', error);
      }
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenContinueEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingContinueEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  // Handle episode swipe to complete
  const handleEpisodeComplete = async (
    episode: (typeof todayEpisodes)[number] & { seriesGenre?: string[]; seriesProviders?: string[]; runtime?: number },
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase directly (like in MobileNewEpisodesPage)
    if (user) {
      try {
        // Use the pre-calculated 0-based indexes
        const seasonIndex = episode.seasonIndex;
        const episodeIndex = episode.episodeIndex;

        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/watched`
          );
        await ref.set(true);

        // Also update watchCount if needed
        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${episode.seriesNmr}/seasons/${seasonIndex}/episodes/${episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());

          // Pet XP geben mit Genre-Bonus (nur beim ersten Schauen)
          await petService.watchedSeriesWithGenreAllPets(user.uid, episode.seriesGenre || []);

          // Wrapped 2026: Episode-Watch loggen
          WatchActivityService.logEpisodeWatch(
            user.uid,
            Number(episode.seriesId),
            episode.seriesTitle,
            Number(episode.seriesNmr),
            episode.seasonNumber,
            episode.episodeNumber,
            episode.episodeName,
            episode.runtime || 45,
            false,
            1,
            episode.seriesGenre,
            episode.seriesProviders
          );
        }
      } catch (error) {
        console.error('Error marking episode as watched:', error);
      }
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  return {
    // Continue-watching data & state
    continueWatching,
    swipingContinueEpisodes,
    setSwipingContinueEpisodes,
    dragOffsetsContinue,
    setDragOffsetsContinue,
    completingContinueEpisodes,
    hiddenContinueEpisodes,
    handleContinueEpisodeComplete,

    // Today-episodes data & state
    todayEpisodes,
    swipingEpisodes,
    setSwipingEpisodes,
    dragOffsetsEpisodes,
    setDragOffsetsEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    handleEpisodeComplete,

    // Shared
    swipeDirections,
  };
};
