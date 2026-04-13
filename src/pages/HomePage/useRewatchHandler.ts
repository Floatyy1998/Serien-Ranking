import { useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useRewatchEpisodes } from '../../hooks/useRewatchEpisodes';
import { normalizeEpisodes } from '../../lib/episode/seriesMetrics';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { showToast, showUndoToast } from '../../lib/toast';

export function useRewatchHandler() {
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const rewatchEpisodes = useRewatchEpisodes();
  const [completingRewatches, setCompletingRewatches] = useState<Set<string>>(new Set());
  const [hiddenRewatches, setHiddenRewatches] = useState<Set<string>>(new Set());
  const [swipingRewatches, setSwipingRewatches] = useState<Set<string>>(new Set());
  const [dragOffsetsRewatches, setDragOffsetsRewatches] = useState<Record<string, number>>({});
  const [rewatchSwipeDirections, setRewatchSwipeDirections] = useState<
    Record<string, 'left' | 'right'>
  >({});

  // Aufräumen: stale Keys aus hiddenRewatches entfernen wenn sich die Episode-Liste ändert
  useEffect(() => {
    if (hiddenRewatches.size === 0) return;
    const currentKeys = new Set(
      rewatchEpisodes.map((ep) => `rewatch-${ep.id}-${ep.seasonNumber}-${ep.episodeNumber}`)
    );
    setHiddenRewatches((prev) => {
      let hasStale = false;
      for (const key of prev) {
        if (!currentKeys.has(key)) {
          hasStale = true;
          break;
        }
      }
      if (!hasStale) return prev;
      const cleaned = new Set<string>();
      for (const key of prev) {
        if (currentKeys.has(key)) cleaned.add(key);
      }
      return cleaned;
    });
  }, [rewatchEpisodes, hiddenRewatches.size]);

  const handleRewatchComplete = async (
    item: (typeof rewatchEpisodes)[number],
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const key = `rewatch-${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
    setRewatchSwipeDirections((prev) => ({ ...prev, [key]: swipeDirection }));
    setCompletingRewatches((prev) => new Set(prev).add(key));

    setTimeout(() => {
      setHiddenRewatches((prev) => new Set(prev).add(key));
      setCompletingRewatches((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 300);

    if (!user) return;

    const label = `S${item.seasonNumber}E${item.episodeNumber}`;
    const itemSeries = seriesList.find((s) => s.id === item.id);
    const itemEp = itemSeries?.seasons?.[item.seasonIndex]?.episodes?.[item.episodeIndex];
    const epId = itemEp?.id;
    if (!epId) {
      showToast('Episode-ID fehlt', 2000, 'error');
      return;
    }
    const epPath = `users/${user.uid}/seriesWatch/${item.id}/seasons/${item.seasonIndex}/eps/${epId}`;
    const db = firebase.database();
    const nowIso = new Date().toISOString();
    const nowUnix = Math.floor(Date.now() / 1000);

    try {
      // Snapshot vorher lesen
      const [epSnap, rewatchLastSnap] = await Promise.all([
        db.ref(epPath).once('value'),
        db.ref(`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`).once('value'),
      ]);

      const val = (epSnap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
      const prevCount: number = val.c || 0;
      const prevFirst: number = val.f || 0;
      const prevLast: number = val.l || 0;
      const prevWatched: number = val.w || 0;
      const prevRewatchLastWatchedAt: string | null = rewatchLastSnap.val() || null;

      const newWatchCount = prevCount + 1;
      const updates: Record<string, unknown> = {
        [`${epPath}/c`]: newWatchCount,
        [`${epPath}/l`]: nowUnix,
        [`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`]: nowIso,
      };
      if (!prevWatched) {
        updates[`${epPath}/w`] = 1;
        if (!prevFirst) {
          updates[`${epPath}/f`] = nowUnix;
        }
      }
      await db.ref().update(updates);

      // Auto-complete rewatch check (muss sofort passieren, da es Episode-Daten ändert)
      const series = itemSeries;
      let rewatchRemoved = false;
      if (series?.rewatch?.active) {
        const targetCount = item.targetWatchCount;
        let allDone = true;
        for (let sIdx = 0; sIdx < (series.seasons?.length || 0); sIdx++) {
          const s = series.seasons[sIdx];
          if (!s || typeof s !== 'object') continue;
          const episodes = normalizeEpisodes(s.episodes);
          for (let i = 0; i < episodes.length; i++) {
            const ep = episodes[i];
            if (!ep.watched) continue;
            if (sIdx === item.seasonIndex && i === item.episodeIndex) continue;
            if ((ep.watchCount || 1) < targetCount) {
              allDone = false;
              break;
            }
          }
          if (!allDone) break;
        }
        if (allDone && newWatchCount >= targetCount) {
          await db.ref(`users/${user.uid}/series/${item.id}/rewatch`).remove();
          rewatchRemoved = true;
        }
      }

      showUndoToast(`${item.title} ${label} Rewatch als gesehen markiert`, {
        onUndo: async () => {
          setHiddenRewatches((prev) => {
            const s = new Set(prev);
            s.delete(key);
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
            if (prevRewatchLastWatchedAt) {
              await db
                .ref(`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`)
                .set(prevRewatchLastWatchedAt);
            } else {
              await db.ref(`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`).remove();
            }
            if (rewatchRemoved && series?.rewatch) {
              await db.ref(`users/${user.uid}/series/${item.id}/rewatch`).set(series.rewatch);
            }
          } catch {
            showToast('Undo fehlgeschlagen', 2000, 'error');
          }
        },
        onCommit: async () => {
          await petService.watchedSeriesWithGenreAllPets(user.uid, item.genre?.genres || []);
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
        },
      });
    } catch (error) {
      console.error('Error completing rewatch episode:', error);
      showToast('Fehler beim Speichern', 3000, 'error');
    }
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
