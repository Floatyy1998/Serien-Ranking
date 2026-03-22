import { useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useRewatchEpisodes } from '../../hooks/useRewatchEpisodes';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';

export function useRewatchHandler() {
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const rewatchEpisodes = useRewatchEpisodes();
  const [completingRewatches, setCompletingRewatches] = useState<Set<string>>(new Set());
  const [hiddenRewatches, setHiddenRewatches] = useState<Set<string>>(new Set());
  const [swipingRewatches, setSwipingRewatches] = useState<Set<string>>(new Set());
  const [dragOffsetsRewatches, setDragOffsetsRewatches] = useState<Record<string, number>>({});
  const [rewatchSwipeDirections, setRewatchSwipeDirections] = useState<
    Record<string, 'left' | 'right'>
  >({});

  const handleRewatchComplete = async (
    item: (typeof rewatchEpisodes)[number],
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const key = `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
    setRewatchSwipeDirections((prev) => ({ ...prev, [key]: swipeDirection }));
    setCompletingRewatches((prev) => new Set(prev).add(key));

    if (user) {
      try {
        const episodePath = `${user.uid}/serien/${item.nmr}/seasons/${item.seasonIndex}/episodes/${item.episodeIndex}`;
        const newWatchCount = (item.currentWatchCount || 0) + 1;

        const nowIso = new Date().toISOString();
        await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
        await firebase.database().ref(`${episodePath}/lastWatchedAt`).set(nowIso);
        // Stable sort key at series level — avoids relying on episode scan for ordering
        await firebase
          .database()
          .ref(`${user.uid}/serien/${item.nmr}/rewatch/lastWatchedAt`)
          .set(nowIso);

        // Pet XP with genre bonus (rewatches count too)
        await petService.watchedSeriesWithGenreAllPets(user.uid, item.genre?.genres || []);

        if (!item.currentWatchCount) {
          await firebase.database().ref(`${episodePath}/watched`).set(true);
          await firebase
            .database()
            .ref(`${episodePath}/firstWatchedAt`)
            .set(new Date().toISOString());
        }

        WatchActivityService.logEpisodeWatch(
          user.uid,
          item.id,
          item.title,
          item.seasonNumber,
          item.episodeNumber,
          item.episodeRuntime,
          true,
          item.genre?.genres,
          item.provider?.provider?.map((p: { name: string }) => p.name)
        );

        const { updateEpisodeCounters } =
          await import('../../features/badges/minimalActivityLogger');
        await updateEpisodeCounters(user.uid, true);

        // Auto-complete rewatch check
        const series = seriesList.find((s) => s.id === item.id);
        if (series?.rewatch?.active) {
          const targetCount = item.targetWatchCount;
          let allDone = true;
          for (const s of series.seasons || []) {
            for (const ep of s.episodes || []) {
              if (!ep.watched) continue;
              if (
                s.seasonNumber === item.seasonNumber - 1 &&
                s.episodes?.indexOf(ep) === item.episodeIndex
              )
                continue;
              if ((ep.watchCount || 1) < targetCount) {
                allDone = false;
                break;
              }
            }
            if (!allDone) break;
          }
          if (allDone && newWatchCount >= targetCount) {
            await firebase.database().ref(`${user.uid}/serien/${item.nmr}/rewatch`).remove();
          }
        }
      } catch (error) {
        console.error('Error completing rewatch episode:', error);
      }
    }

    setTimeout(() => {
      setHiddenRewatches((prev) => new Set(prev).add(key));
      setCompletingRewatches((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 300);
  };

  // Swipe helpers for rewatches
  const handleRewatchSwipeStart = (key: string) =>
    setSwipingRewatches((prev) => new Set(prev).add(key));
  const handleRewatchSwipeDrag = (key: string, offset: number) =>
    setDragOffsetsRewatches((prev) => ({ ...prev, [key]: offset }));
  const handleRewatchSwipeEnd = (key: string) => {
    setSwipingRewatches((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    setDragOffsetsRewatches((prev) => {
      const o = { ...prev };
      delete o[key];
      return o;
    });
  };

  return {
    rewatchEpisodes,
    completingRewatches,
    hiddenRewatches,
    swipingRewatches,
    dragOffsetsRewatches,
    rewatchSwipeDirections,
    handleRewatchComplete,
    handleRewatchSwipeStart,
    handleRewatchSwipeDrag,
    handleRewatchSwipeEnd,
  };
}
