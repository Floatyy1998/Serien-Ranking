import { detectNewSeasons } from '../lib/validation/newSeasonDetection';
import {
  detectInactiveSeries,
  detectInactiveRewatches,
} from '../lib/validation/inactiveSeriesDetection';
import { detectCompletedSeries } from '../lib/validation/completedSeriesDetection';
import { detectUnratedSeries } from '../lib/validation/unratedSeriesDetection';
import { Series } from '../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

/** Read and JSON-parse a sessionStorage key, returning `fallback` on any failure. */
export function getSessionStorageJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const stored = sessionStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch {
    return fallback;
  }
}

// ⚠️ LEGACY FUNCTION - NUR FÜR MIGRATION, NICHT FÜR WRAPPED 2026!
export async function fixMissingFirstWatchedAt(
  userId: string,
  seriesData: Record<string, Series>
): Promise<void> {
  console.warn('⚠️ WARNUNG: Diese Funktion setzt das HEUTIGE Datum für alle alten Episoden!');
  console.warn('⚠️ Für Wrapped 2026 werden Daten automatisch korrekt gesammelt.');
  console.warn('⚠️ Nur verwenden wenn du weißt was du tust!');
  try {
    const todayISO = new Date().toISOString();
    const updates: Record<string, string | null> = {};
    let totalUpdated = 0;
    let totalWatchedEpisodes = 0;
    let totalEpisodesWithFirstWatched = 0;

    Object.keys(seriesData).forEach((seriesKey) => {
      const series: Series = seriesData[seriesKey];

      if (!series.seasons) return;

      series.seasons.forEach((season, seasonIndex) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode, episodeIndex) => {
          if (episode.watched) {
            totalWatchedEpisodes++;

            if (episode.firstWatchedAt) {
              totalEpisodesWithFirstWatched++;
            } else {
              const episodePath = `${userId}/serien/${seriesKey}/seasons/${seasonIndex}/episodes/${episodeIndex}/firstWatchedAt`;
              updates[episodePath] = todayISO;
              totalUpdated++;
            }
          }
        });
      });
    });

    if (Object.keys(updates).length > 0) {
      await firebase.database().ref().update(updates);
    }
  } catch (error) {
    console.error('❌ Error fixing firstWatchedAt dates:', error);
  }
}

export interface DetectionRefs {
  detectionRunRef: React.MutableRefObject<boolean>;
  inactiveDetectionRunRef: React.MutableRefObject<boolean>;
  completedDetectionRunRef: React.MutableRefObject<boolean>;
  unratedDetectionRunRef: React.MutableRefObject<boolean>;
  detectionTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  inactiveDetectionTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  completedDetectionTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  unratedDetectionTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function createNewSeasonDetectionRunner(
  refs: Pick<DetectionRefs, 'detectionRunRef' | 'detectionTimeoutRef'>,
  setSeriesWithNewSeasons: React.Dispatch<React.SetStateAction<Series[]>>,
  setHasCheckedForNewSeasons: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (seriesList: Series[], userId: string) => {
    if (refs.detectionTimeoutRef.current) {
      clearTimeout(refs.detectionTimeoutRef.current);
      refs.detectionTimeoutRef.current = null;
    }

    if (refs.detectionRunRef.current) {
      return;
    }

    refs.detectionTimeoutRef.current = setTimeout(async () => {
      if (refs.detectionRunRef.current || seriesList.length === 0) {
        return;
      }

      refs.detectionRunRef.current = true;

      try {
        const newSeasons = await detectNewSeasons(seriesList, userId);

        if (newSeasons.length > 0) {
          if (typeof window !== 'undefined') {
            const dataToStore = JSON.stringify(newSeasons);
            sessionStorage.setItem('seriesWithNewSeasons', dataToStore);
          }
          setSeriesWithNewSeasons(newSeasons);
          setTimeout(() => {
            setSeriesWithNewSeasons([...newSeasons]);
          }, 100);
        } else {
          setHasCheckedForNewSeasons(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForNewSeasons', 'true');
          }
        }
      } catch (error) {
        setHasCheckedForNewSeasons(true);
      } finally {
        refs.detectionRunRef.current = false;
      }
    }, 500);
  };
}

export function createInactiveSeriesDetectionRunner(
  refs: Pick<DetectionRefs, 'inactiveDetectionRunRef' | 'inactiveDetectionTimeoutRef'>,
  setInactiveSeries: React.Dispatch<React.SetStateAction<Series[]>>,
  setInactiveRewatches: React.Dispatch<React.SetStateAction<Series[]>>,
  setHasCheckedForInactive: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (seriesList: Series[], userId: string) => {
    if (refs.inactiveDetectionTimeoutRef.current) {
      clearTimeout(refs.inactiveDetectionTimeoutRef.current);
      refs.inactiveDetectionTimeoutRef.current = null;
    }

    if (refs.inactiveDetectionRunRef.current) {
      return;
    }

    refs.inactiveDetectionTimeoutRef.current = setTimeout(async () => {
      if (refs.inactiveDetectionRunRef.current || seriesList.length === 0) {
        return;
      }

      refs.inactiveDetectionRunRef.current = true;

      try {
        const [inactive, inactiveRew] = await Promise.all([
          detectInactiveSeries(seriesList, userId),
          detectInactiveRewatches(seriesList, userId),
        ]);

        if (inactiveRew.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('inactiveRewatches', JSON.stringify(inactiveRew));
          }
          setInactiveRewatches(inactiveRew);
        }

        if (inactive.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('inactiveSeries', JSON.stringify(inactive));
          }
          setInactiveSeries(inactive);
          setTimeout(() => {
            setInactiveSeries([...inactive]);
          }, 100);
        } else if (inactiveRew.length === 0) {
          setHasCheckedForInactive(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForInactive', 'true');
          }
        }
      } catch (error) {
        console.error('Error detecting inactive series:', error);
        setHasCheckedForInactive(true);
      } finally {
        refs.inactiveDetectionRunRef.current = false;
      }
    }, 500);
  };
}

export function createCompletedSeriesDetectionRunner(
  refs: Pick<DetectionRefs, 'completedDetectionRunRef' | 'completedDetectionTimeoutRef'>,
  setCompletedSeries: React.Dispatch<React.SetStateAction<Series[]>>,
  setHasCheckedForCompleted: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (seriesList: Series[], userId: string) => {
    if (refs.completedDetectionTimeoutRef.current) {
      clearTimeout(refs.completedDetectionTimeoutRef.current);
      refs.completedDetectionTimeoutRef.current = null;
    }

    if (refs.completedDetectionRunRef.current) {
      return;
    }

    refs.completedDetectionTimeoutRef.current = setTimeout(async () => {
      if (refs.completedDetectionRunRef.current || seriesList.length === 0) {
        return;
      }

      refs.completedDetectionRunRef.current = true;

      try {
        const completed = await detectCompletedSeries(seriesList, userId);

        if (completed.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('completedSeries', JSON.stringify(completed));
          }
          setCompletedSeries(completed);
          setTimeout(() => {
            setCompletedSeries([...completed]);
          }, 100);
        } else {
          setHasCheckedForCompleted(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForCompleted', 'true');
          }
        }
      } catch (error) {
        console.error('Error detecting completed series:', error);
        setHasCheckedForCompleted(true);
      } finally {
        refs.completedDetectionRunRef.current = false;
      }
    }, 500);
  };
}

export function createUnratedSeriesDetectionRunner(
  refs: Pick<DetectionRefs, 'unratedDetectionRunRef' | 'unratedDetectionTimeoutRef'>,
  setUnratedSeries: React.Dispatch<React.SetStateAction<Series[]>>,
  setHasCheckedForUnrated: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (seriesList: Series[], userId: string) => {
    if (refs.unratedDetectionTimeoutRef.current) {
      clearTimeout(refs.unratedDetectionTimeoutRef.current);
      refs.unratedDetectionTimeoutRef.current = null;
    }

    if (refs.unratedDetectionRunRef.current) {
      return;
    }

    refs.unratedDetectionTimeoutRef.current = setTimeout(async () => {
      if (refs.unratedDetectionRunRef.current || seriesList.length === 0) {
        return;
      }

      refs.unratedDetectionRunRef.current = true;

      try {
        const unrated = await detectUnratedSeries(seriesList, userId);

        if (unrated.length > 0) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('unratedSeries', JSON.stringify(unrated));
          }
          setUnratedSeries(unrated);
          setTimeout(() => {
            setUnratedSeries([...unrated]);
          }, 100);
        } else {
          setHasCheckedForUnrated(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hasCheckedForUnrated', 'true');
          }
        }
      } catch (error) {
        console.error('Error detecting unrated series:', error);
        setHasCheckedForUnrated(true);
      } finally {
        refs.unratedDetectionRunRef.current = false;
      }
    }, 500);
  };
}
