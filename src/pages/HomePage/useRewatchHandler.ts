import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { dbRef, dbUpdate, paths, serverTimestamp } from '../../services/db/ref';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useRewatchEpisodes } from '../../hooks/useRewatchEpisodes';
import { runEpisodeWatchFanout } from '../../lib/episode/episodeWatchFanout';
import { normalizeEpisodes } from '../../lib/episode/seriesMetrics';
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
    const epPath = `${paths.seriesWatchItem(user.uid, item.id)}/seasons/${item.seasonIndex}/eps/${epId}`;
    const rewatchPath = `${paths.seriesItem(user.uid, item.id)}/rewatch`;
    const rewatchLastWatchedAtPath = `${rewatchPath}/lastWatchedAt`;
    const nowIso = new Date().toISOString();
    const nowUnix = Math.floor(Date.now() / 1000);

    try {
      // Snapshot vorher lesen
      const [epSnap, rewatchLastSnap] = await Promise.all([
        dbRef(epPath).once('value'),
        dbRef(rewatchLastWatchedAtPath).once('value'),
      ]);

      const val = (epSnap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
      const prevWatched: number = val.w || 0;
      // Legacy-Eps haben `{w:1, f:...}` ohne `c`. Default auf 1 (statt 0)
      // wenn die Folge schon gewatcht war, damit der Counter beim Rewatch-
      // Swipe auch sichtbar von 1 auf 2 hochgeht — sonst bleibt die Anzeige
      // bei "1x gesehen" haengen.
      const prevCount: number = val.c && val.c >= 1 ? val.c : prevWatched ? 1 : 0;
      const prevFirst: number = val.f || 0;
      const prevLast: number = val.l || 0;
      const prevRewatchLastWatchedAt: string | null = rewatchLastSnap.val() || null;

      const newWatchCount = prevCount + 1;
      const rewatchEpsPath = `${rewatchPath}/rewatchedEps/${epId}`;
      const updates: Record<string, unknown> = {
        [`${epPath}/c`]: newWatchCount,
        [`${epPath}/l`]: nowUnix,
        [rewatchEpsPath]: true,
        [rewatchLastWatchedAtPath]: nowIso,
        [paths.serienVersion(user.uid)]: serverTimestamp(),
      };
      if (!prevWatched) {
        updates[`${epPath}/w`] = 1;
        if (!prevFirst) {
          updates[`${epPath}/f`] = nowUnix;
        }
      }
      await dbUpdate(updates);

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
          await dbRef(rewatchPath).remove();
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
              await dbRef(epPath).remove();
            } else {
              await dbRef(epPath).set({
                ...(prevWatched ? { w: prevWatched } : {}),
                ...(prevCount ? { c: prevCount } : {}),
                ...(prevFirst ? { f: prevFirst } : {}),
                ...(prevLast ? { l: prevLast } : {}),
              });
            }
            if (rewatchRemoved && series?.rewatch) {
              // rewatch wurde komplett entfernt — original wiederherstellen
              await dbRef(rewatchPath).set(series.rewatch);
            } else {
              // rewatchedEps-Flag fuer diese Episode zuruecknehmen
              await dbRef(rewatchEpsPath).remove();
              if (prevRewatchLastWatchedAt) {
                await dbRef(rewatchLastWatchedAtPath).set(prevRewatchLastWatchedAt);
              } else {
                await dbRef(rewatchLastWatchedAtPath).remove();
              }
            }
            await dbRef(paths.serienVersion(user.uid)).set(serverTimestamp());
          } catch {
            showToast('Undo fehlgeschlagen', 2000, 'error');
          }
        },
        onCommit: async () => {
          // Kein airDate (bestehendes Verhalten: updateEpisodeCounters ohne 3. Argument).
          await runEpisodeWatchFanout({
            userId: user.uid,
            seriesId: item.id,
            seriesTitle: item.title,
            seasonNumber: item.seasonNumber,
            episodeNumber: item.episodeNumber,
            runtimeMinutes: item.episodeRuntime,
            isRewatch: true,
            genres: item.genre?.genres,
            providers: item.provider?.provider?.map((p: { name: string }) => p.name),
          });
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
