import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useState } from 'react';
import { PanInfo } from 'framer-motion';
import { Series } from '../../types/Series';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { trackEpisodeSwipeCompleted, trackEpisodeWatched } from '../../firebase/analytics';
import { NextEpisode } from '../../hooks/useWatchNextEpisodes';

interface UseWatchNextSwipeOptions {
  user: { uid: string } | null;
  seriesList: Series[];
}

export const useWatchNextSwipe = ({ user, seriesList }: UseWatchNextSwipeOptions) => {
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

  const getEpisodeKey = (episode: NextEpisode) =>
    `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

  const handleSwipeDragStart = (episodeKey: string) => {
    setSwipingEpisodes((prev) => new Set(prev).add(episodeKey));
  };

  const handleSwipeDrag = (episodeKey: string, info: PanInfo) => {
    setDragOffsets((prev) => ({
      ...prev,
      [episodeKey]: info.offset.x,
    }));
  };

  const handleSwipeDragEnd = (
    episode: NextEpisode,
    episodeKey: string,
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    event.stopPropagation();
    setSwipingEpisodes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(episodeKey);
      return newSet;
    });
    setDragOffsets((prev) => {
      const newOffsets = { ...prev };
      delete newOffsets[episodeKey];
      return newOffsets;
    });

    if (Math.abs(info.offset.x) > 100 && Math.abs(info.velocity.x) > 50) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      handleEpisodeComplete(episode, direction);
    }
  };

  const handleEpisodeComplete = async (
    episode: NextEpisode,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = getEpisodeKey(episode);
    trackEpisodeSwipeCompleted(episode.seriesTitle || '', swipeDirection, 'watch_next');

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase
    if (user) {
      const series = seriesList.find((s) => s.id === episode.seriesId);
      if (!series) return;

      try {
        const watchedRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
          );
        await watchedRef.set(true);

        // Handle rewatch: increment watchCount
        if (episode.isRewatch) {
          const watchCountRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
            );
          const newCount = (episode.currentWatchCount || 0) + 1;
          await watchCountRef.set(newCount);

          // Update lastWatchedAt for rewatches
          const lastWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/lastWatchedAt`
            );
          await lastWatchedRef.set(new Date().toISOString());

          // Pet XP with genre bonus (rewatches count too)
          await petService.watchedSeriesWithGenreAllPets(user.uid, series.genre?.genres || []);

          // Badge-System for Rewatch
          const { updateEpisodeCounters } =
            await import('../../features/badges/minimalActivityLogger');
          await updateEpisodeCounters(user.uid, true, episode.airDate);
        } else {
          // Update firstWatchedAt if not set
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`
            );
          const snapshot = await firstWatchedRef.once('value');
          if (!snapshot.val()) {
            await firstWatchedRef.set(new Date().toISOString());
          }

          // Always update lastWatchedAt
          const lastWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/lastWatchedAt`
            );
          await lastWatchedRef.set(new Date().toISOString());

          // Pet XP with genre bonus
          await petService.watchedSeriesWithGenreAllPets(user.uid, series.genre?.genres || []);

          // Also update watchCount
          const watchCountRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
            );
          const watchCountSnapshot = await watchCountRef.once('value');
          const currentCount = watchCountSnapshot.val() || 0;
          await watchCountRef.set(currentCount + 1);

          // Badge-System for normal episode
          const { updateEpisodeCounters } =
            await import('../../features/badges/minimalActivityLogger');
          await updateEpisodeCounters(user.uid, false, episode.airDate);
        }

        // GA4 Analytics: episode watched with full data
        trackEpisodeWatched(
          series.title || series.name || 'Unbekannte Serie',
          episode.seasonIndex + 1,
          episode.episodeIndex + 1,
          {
            tmdbId: series.id,
            genres: series.genre?.genres,
            runtime: episode.runtime || series.episodeRuntime || 45,
            isRewatch: episode.isRewatch || false,
            source: 'watch_next_swipe',
          }
        );

        // Wrapped 2026: Episode-Watch logging
        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title || series.name || 'Unbekannte Serie',
          episode.seasonIndex + 1,
          episode.episodeIndex + 1,
          episode.runtime || series.episodeRuntime || 45,
          episode.isRewatch || false,
          series.genre?.genres,
          series.provider?.provider?.map((p) => p.name)
        );
      } catch (error) {
        console.error('Failed to mark episode as watched:', error);
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
    swipingEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    dragOffsets,
    swipeDirections,
    getEpisodeKey,
    handleSwipeDragStart,
    handleSwipeDrag,
    handleSwipeDragEnd,
    handleEpisodeComplete,
  };
};
