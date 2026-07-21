import { useCallback, useState } from 'react';
import { dbRef, dbUpdate, paths } from '../services/db/ref';
import { useAuth } from '../contexts/AuthContext';
import { trackEpisodeWatched } from '../services/firebase/analytics';
import { runEpisodeWatchFanout } from '../lib/episode/episodeWatchFanout';
import { requestEpisodeRating } from '../lib/episodeRatingPrompt';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../lib/episode/seriesMetrics';
import { hapticSuccess } from '../lib/haptics';
import { applyUserUpdate } from '../services/offline/queuedUpdate';
import { showToast, showUndoToast } from '../lib/toast';
import { t } from '../services/i18n';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useContinueWatching } from './useContinueWatching';
import { shouldTriggerQuickRate, useQuickSeasonRating } from './useQuickSeasonRating';
import type { Series } from '../types/Series';
import type { TodayEpisode } from './useWebWorkerTodayEpisodes';
import { useWebWorkerTodayEpisodes } from './useWebWorkerTodayEpisodes';
import { buildEpisodeWatchedUpdates, buildEpisodeUnwatchUpdates } from '../lib/compactWatch';

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
  showQuickRating: (series: Series, seasonNumber: number) => void;
}

/**
 * Markiert eine Episode in Firebase als gesehen und gibt den Watch-Count vor dem Update zurueck.
 * Schreibt watched, watchCount, lastWatchedAt und (beim Erstwatch) firstWatchedAt.
 */
interface EpisodeSnapshot {
  previousCount: number;
  hadFirstWatched: boolean;
  previousLastWatchedAt: string | null;
  previousWatched: boolean;
}

/**
 * Markiert eine Episode in Firebase als gesehen (ID-basiertes Format).
 * Gibt einen Snapshot des vorherigen Zustands zurueck, damit Undo moeglich ist.
 * Der Write laeuft ueber die persistente Offline-Queue (applyUserUpdate).
 */
async function markEpisodeWatchedInFirebase(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeId: number | string,
  queueLabel?: string
): Promise<EpisodeSnapshot> {
  const base = `${paths.seriesWatchItem(uid, seriesId)}/seasons/${seasonIndex}/eps/${episodeId}`;

  const snap = await dbRef(base).once('value');
  const val = (snap.val() as { w?: number; c?: number; f?: number; l?: number } | null) || {};
  const previousWatched = (val.w ?? 0) === 1;
  const previousCount: number = val.c ?? 0;
  const hadFirstWatched = !!(val.f && val.f > 0);
  const previousLastWatchedAt: string | null =
    val.l && val.l > 0 ? new Date(val.l * 1000).toISOString() : null;

  const nowIso = new Date().toISOString();
  const updates = buildEpisodeWatchedUpdates(
    uid,
    seriesId,
    seasonIndex,
    episodeId,
    previousCount + 1,
    nowIso,
    !hadFirstWatched
  );
  await applyUserUpdate(uid, updates, queueLabel);

  return { previousCount, hadFirstWatched, previousLastWatchedAt, previousWatched };
}

/**
 * Macht einen markEpisodeWatchedInFirebase-Aufruf rueckgaengig.
 */
async function revertEpisodeWatch(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeId: number | string,
  snapshot: EpisodeSnapshot
): Promise<void> {
  const firstIso = snapshot.hadFirstWatched ? null : null; // f wird unten nur geschrieben wenn reset
  void firstIso;
  const updates = buildEpisodeUnwatchUpdates(
    uid,
    seriesId,
    seasonIndex,
    episodeId,
    snapshot.previousWatched,
    snapshot.previousCount,
    null, // hadFirstWatched wird im compactWatch-Helper als "keep" behandelt wenn wir hier null geben
    snapshot.previousLastWatchedAt
  );
  // Wenn vorher ein firstWatchedAt existierte, nicht ueberschreiben — sonst 0 setzen
  const base = `${paths.seriesWatchItem(uid, seriesId)}/seasons/${seasonIndex}/eps/${episodeId}`;
  if (snapshot.hadFirstWatched) {
    delete (updates as Record<string, unknown>)[`${base}/f`];
  }
  await dbUpdate(updates);
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
  const { seriesList } = useSeriesList();
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
      scheduleEpisodeHide(episodeKey, setCompletingContinueEpisodes, setHiddenContinueEpisodes);

      if (!user) return;

      const label = `S${item.nextEpisode.seasonNumber}E${item.nextEpisode.episodeNumber}`;

      try {
        const snap = await markEpisodeWatchedInFirebase(
          user.uid,
          item.id,
          item.nextEpisode.seasonIndex,
          item.nextEpisode.episodeId,
          `${item.title} ${label} (Weiterschauen-Swipe)`
        );

        hapticSuccess();

        showUndoToast(t('{title} {label} als gesehen markiert', { title: item.title, label }), {
          onUndo: async () => {
            setHiddenContinueEpisodes((prev) => {
              const s = new Set(prev);
              s.delete(episodeKey);
              return s;
            });
            try {
              await revertEpisodeWatch(
                user.uid,
                item.id,
                item.nextEpisode.seasonIndex,
                item.nextEpisode.episodeId,
                snap
              );
            } catch {
              showToast('Undo fehlgeschlagen', 2000, 'error');
            }
          },
          onCommit: async () => {
            // Bewertungs-Prompt erst nach Ablauf des Undo-Fensters (Toast weg,
            // Mark bleibt bestehen); gedrosselt auf max. 1×/Minute.
            requestEpisodeRating({
              seriesId: item.id,
              seriesTitle: item.title,
              seasonIndex: item.nextEpisode.seasonIndex,
              episodeId: item.nextEpisode.episodeId,
              label,
            });
            trackEpisodeWatched(
              item.title,
              item.nextEpisode.seasonNumber,
              item.nextEpisode.episodeNumber,
              {
                tmdbId: item.id,
                genres: item.genre?.genres,
                runtime: item.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                isRewatch: snap.previousCount > 0,
                source: 'continue_watching_swipe',
              }
            );
            // Wrapped-Event nur beim Erstwatch (previousCount === 0) — dann ist
            // isRewatch ohnehin false, wie zuvor hart kodiert.
            await runEpisodeWatchFanout({
              userId: user.uid,
              seriesId: item.id,
              seriesTitle: item.title,
              seasonNumber: item.nextEpisode.seasonIndex + 1,
              episodeNumber: item.nextEpisode.episodeIndex + 1,
              runtimeMinutes: item.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES,
              isRewatch: snap.previousCount > 0,
              genres: item.genre?.genres,
              providers: item.provider?.provider?.map((p: { name: string }) => p.name),
              episodeAirDate: item.airDate,
              wrappedEvent: snap.previousCount === 0,
            });
          },
        });

        // Quick-Rate: Trigger wenn letzte Episode der letzten Staffel
        const fullSeries = seriesList.find((s) => s.id === item.id);
        if (fullSeries?.seasons) {
          if (
            shouldTriggerQuickRate(
              fullSeries,
              item.nextEpisode.seasonIndex,
              item.nextEpisode.episodeIndex
            )
          ) {
            setTimeout(() => {
              showQuickRating(fullSeries, item.nextEpisode.seasonNumber);
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error marking episode as watched:', error);
        showToast('Fehler beim Speichern', 3000, 'error');
      }
    },
    [user, showQuickRating, seriesList]
  );

  const handleEpisodeComplete = useCallback(
    async (episode: TodayEpisode, swipeDirection: 'left' | 'right' = 'right') => {
      const episodeKey = `${episode.seriesId}-${episode.seasonNumber}-${episode.episodeNumber}`;
      setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));
      setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));
      scheduleEpisodeHide(episodeKey, setCompletingEpisodes, setHiddenEpisodes);
      hapticSuccess();

      if (!user) return;

      const label = `S${episode.seasonNumber}E${episode.episodeNumber}`;

      try {
        const snap = await markEpisodeWatchedInFirebase(
          user.uid,
          episode.seriesId,
          episode.seasonIndex,
          episode.episodeId,
          `${episode.seriesTitle} ${label} (Heute-Swipe)`
        );

        showUndoToast(
          t('{title} {label} als gesehen markiert', { title: episode.seriesTitle, label }),
          {
            onUndo: async () => {
              setHiddenEpisodes((prev) => {
                const s = new Set(prev);
                s.delete(episodeKey);
                return s;
              });
              try {
                await revertEpisodeWatch(
                  user.uid,
                  episode.seriesId,
                  episode.seasonIndex,
                  episode.episodeId,
                  snap
                );
              } catch {
                showToast('Undo fehlgeschlagen', 2000, 'error');
              }
            },
            onCommit: async () => {
              // Bewertungs-Prompt erst nach Ablauf des Undo-Fensters (Toast weg,
              // Mark bleibt bestehen); gedrosselt auf max. 1×/Minute.
              requestEpisodeRating({
                seriesId: Number(episode.seriesId),
                seriesTitle: episode.seriesTitle,
                seasonIndex: episode.seasonIndex,
                episodeId: Number(episode.episodeId),
                label,
              });
              trackEpisodeWatched(
                episode.seriesTitle,
                episode.seasonNumber,
                episode.episodeNumber,
                {
                  tmdbId: episode.seriesId,
                  genres: episode.seriesGenre,
                  runtime: episode.runtime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                  isRewatch: snap.previousCount > 0,
                  source: 'today_episodes_swipe',
                }
              );
              // Wrapped-Event nur beim Erstwatch (previousCount === 0) — dann ist
              // isRewatch ohnehin false, wie zuvor hart kodiert. Kein airDate
              // (bestehendes Verhalten: updateEpisodeCounters ohne 3. Argument).
              await runEpisodeWatchFanout({
                userId: user.uid,
                seriesId: Number(episode.seriesId),
                seriesTitle: episode.seriesTitle,
                seasonNumber: episode.seasonNumber,
                episodeNumber: episode.episodeNumber,
                runtimeMinutes: episode.runtime || DEFAULT_EPISODE_RUNTIME_MINUTES,
                isRewatch: snap.previousCount > 0,
                genres: episode.seriesGenre,
                providers: episode.seriesProviders,
                wrappedEvent: snap.previousCount === 0,
              });
            },
          }
        );
      } catch (error) {
        console.error('Error marking episode as watched:', error);
        showToast('Fehler beim Speichern', 3000, 'error');
      }
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
    showQuickRating,
  };
};
