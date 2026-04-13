import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useState } from 'react';
import type { PanInfo } from 'framer-motion';
import type { Series } from '../../types/Series';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { trackEpisodeWatched } from '../../firebase/analytics';
import type { NextEpisode } from '../../hooks/useWatchNextEpisodes';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { showToast, showUndoToast } from '../../lib/toast';

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

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);

    if (!user) return;
    const series = seriesList.find((s) => s.id === episode.seriesId);
    if (!series) return;

    const ep = series.seasons?.[episode.seasonIndex]?.episodes?.[episode.episodeIndex];
    const epId = ep?.id;
    if (!epId) {
      showToast('Episode-ID fehlt', 2000, 'error');
      return;
    }
    const epPath = `users/${user.uid}/seriesWatch/${series.id}/seasons/${episode.seasonIndex}/eps/${epId}`;
    const db = firebase.database();
    const uid = user.uid;
    const label = `S${episode.seasonIndex + 1}E${episode.episodeIndex + 1}`;
    const nowUnix = Math.floor(Date.now() / 1000);

    try {
      const snap = await db.ref(epPath).once('value');
      const val = (snap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
      const prevCount: number = val.c || 0;
      const prevFirst: number = val.f || 0;
      const prevLast: number = val.l || 0;
      const prevWatched: number = val.w || 0;

      const updates: Record<string, unknown> = {
        [`${epPath}/w`]: 1,
        [`${epPath}/c`]: prevCount + 1,
        [`${epPath}/l`]: nowUnix,
      };
      if (!episode.isRewatch && !prevFirst) {
        updates[`${epPath}/f`] = nowUnix;
      }
      await db.ref().update(updates);

      showUndoToast(`${episode.seriesTitle} ${label} als gesehen markiert`, {
        onUndo: async () => {
          setHiddenEpisodes((prev) => {
            const s = new Set(prev);
            s.delete(episodeKey);
            return s;
          });
          try {
            if (!prevWatched && prevCount === 0 && !prevFirst && !prevLast) {
              await db.ref(epPath).remove();
            } else {
              await db.ref(epPath).set({
                ...(prevWatched ? { w: prevWatched } : {}),
                ...(prevCount ? { c: prevCount } : {}),
                ...(prevFirst ? { f: prevFirst } : {}),
                ...(prevLast ? { l: prevLast } : {}),
              });
            }
          } catch {
            showToast('Undo fehlgeschlagen', 2000, 'error');
          }
        },
        onCommit: async () => {
          // Side-Effects erst nach Ablauf des Undo-Fensters
          await petService.watchedSeriesWithGenreAllPets(uid, series.genre?.genres || []);
          const { updateEpisodeCounters } =
            await import('../../features/badges/minimalActivityLogger');
          await updateEpisodeCounters(uid, episode.isRewatch || false, episode.airDate);

          trackEpisodeWatched(
            series.title || series.name || 'Unbekannte Serie',
            episode.seasonIndex + 1,
            episode.episodeIndex + 1,
            {
              tmdbId: series.id,
              genres: series.genre?.genres,
              runtime: episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              isRewatch: episode.isRewatch || false,
              source: 'watch_next_swipe',
            }
          );

          WatchActivityService.logEpisodeWatch(
            uid,
            series.id,
            series.title || series.name || 'Unbekannte Serie',
            episode.seasonIndex + 1,
            episode.episodeIndex + 1,
            episode.runtime || series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
            episode.isRewatch || false,
            series.genre?.genres,
            series.provider?.provider?.map((p) => p.name)
          );
        },
      });
    } catch (error) {
      console.error('Failed to mark episode as watched:', error);
      showToast('Fehler beim Speichern', 3000, 'error');
    }
  };

  const handleSwipeCleanup = (episodeKey: string) => {
    setSwipingEpisodes((prev) => {
      const s = new Set(prev);
      s.delete(episodeKey);
      return s;
    });
    setDragOffsets((prev) => {
      const o = { ...prev };
      delete o[episodeKey];
      return o;
    });
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
    handleSwipeCleanup,
    handleEpisodeComplete,
  };
};
