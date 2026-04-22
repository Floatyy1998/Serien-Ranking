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

    if (!user) {
      setCompletingRewatches((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
      return;
    }

    const label = `S${item.seasonNumber}E${item.episodeNumber}`;
    const itemSeries = seriesList.find((s) => s.id === item.id);
    const itemEp = itemSeries?.seasons?.[item.seasonIndex]?.episodes?.[item.episodeIndex];
    const epId = itemEp?.id;
    if (!epId) {
      showToast('Episode-ID fehlt', 2000, 'error');
      setCompletingRewatches((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
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
      const rewatchEpsPath = `users/${user.uid}/series/${item.id}/rewatch/rewatchedEps/${epId}`;
      const updates: Record<string, unknown> = {
        [`${epPath}/c`]: newWatchCount,
        [`${epPath}/l`]: nowUnix,
        [rewatchEpsPath]: true,
        [`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`]: nowIso,
        [`users/${user.uid}/meta/serienVersion`]: firebase.database.ServerValue.TIMESTAMP,
      };
      if (!prevWatched) {
        updates[`${epPath}/w`] = 1;
        if (!prevFirst) {
          updates[`${epPath}/f`] = nowUnix;
        }
      }
      await db.ref().update(updates);

      // Ep aus der UI ausblenden — jeder Swipe = Ep fertig fuer diese Runde
      // (rewatchedEps-Flag ist jetzt gesetzt, unabhaengig vom watchCount).
      setTimeout(() => {
        setHiddenRewatches((prev) => new Set(prev).add(key));
        setCompletingRewatches((prev) => {
          const s = new Set(prev);
          s.delete(key);
          return s;
        });
      }, 300);

      // Auto-complete rewatch check: alle gesehenen Eps als done markiert?
      // (entweder explizit in rewatchedEps ODER watchCount >= target)
      const series = itemSeries;
      let rewatchRemoved = false;
      if (series?.rewatch?.active) {
        const rewatchedEps = { ...(series.rewatch.rewatchedEps || {}), [String(epId)]: true };
        const targetCount = item.targetWatchCount;
        let allDone = true;
        for (const season of series.seasons || []) {
          if (!season || typeof season !== 'object') continue;
          const episodes = normalizeEpisodes(season.episodes);
          for (const ep of episodes) {
            if (!ep.watched) continue;
            if (!ep.id) continue;
            const explicit = !!rewatchedEps[String(ep.id)];
            const implied = (ep.watchCount || 1) >= targetCount;
            if (!explicit && !implied) {
              allDone = false;
              break;
            }
          }
          if (!allDone) break;
        }
        if (allDone) {
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
            if (rewatchRemoved && series?.rewatch) {
              // rewatch wurde komplett entfernt — original wiederherstellen
              await db.ref(`users/${user.uid}/series/${item.id}/rewatch`).set(series.rewatch);
            } else {
              // rewatchedEps-Flag fuer diese Episode zuruecknehmen
              await db.ref(rewatchEpsPath).remove();
              if (prevRewatchLastWatchedAt) {
                await db
                  .ref(`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`)
                  .set(prevRewatchLastWatchedAt);
              } else {
                await db.ref(`users/${user.uid}/series/${item.id}/rewatch/lastWatchedAt`).remove();
              }
            }
            await db
              .ref(`users/${user.uid}/meta/serienVersion`)
              .set(firebase.database.ServerValue.TIMESTAMP);
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
