import { detectNewSeasons } from '../lib/validation/newSeasonDetection';
import {
  detectInactiveSeries,
  detectInactiveRewatches,
} from '../lib/validation/inactiveSeriesDetection';
import { detectCompletedSeries } from '../lib/validation/completedSeriesDetection';
import { detectUnratedSeries } from '../lib/validation/unratedSeriesDetection';
import {
  detectProviderChanges,
  type ProviderChangeInfo,
} from '../lib/validation/providerChangeDetection';
import type { Series } from '../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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
    const updates: Record<string, number> = {};
    let _totalUpdated = 0;
    let _totalWatchedEpisodes = 0;
    let _totalEpisodesWithFirstWatched = 0;

    Object.keys(seriesData).forEach((seriesKey) => {
      const series: Series = seriesData[seriesKey];

      if (!series.seasons) return;

      series.seasons.forEach((season, seasonIndex) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode) => {
          if (episode.watched) {
            _totalWatchedEpisodes++;

            if (episode.firstWatchedAt) {
              _totalEpisodesWithFirstWatched++;
            } else if (episode.id) {
              const firstPath = `users/${userId}/seriesWatch/${seriesKey}/seasons/${seasonIndex}/eps/${episode.id}/f`;
              updates[firstPath] = Math.floor(new Date(todayISO).getTime() / 1000);
              _totalUpdated++;
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

export type { ProviderChangeInfo };

export interface DetectionResults {
  seriesWithNewSeasons: Series[];
  inactiveSeries: Series[];
  inactiveRewatches: Series[];
  completedSeries: Series[];
  unratedSeries: Series[];
  providerChanges: ProviderChangeInfo[];
}

/**
 * Führt alle Detections sequentiell in Prioritätsreihenfolge aus.
 * Sobald eine Detection Ergebnisse findet, wird sie gesetzt und die nächste gestartet.
 * Alle laufen nacheinander, nicht parallel — kein "random" Timing mehr.
 */
export async function runSequentialDetections(
  seriesList: Series[],
  userId: string,
  onUpdate: (partial: Partial<DetectionResults>) => void,
  signal: AbortSignal
): Promise<void> {
  if (seriesList.length === 0) return;

  // 1. Neue Staffeln (höchste Priorität)
  if (signal.aborted) return;
  try {
    const newSeasons = await detectNewSeasons(seriesList, userId);
    if (signal.aborted) return;
    if (newSeasons.length > 0) {
      onUpdate({ seriesWithNewSeasons: newSeasons });
    }
  } catch (error) {
    console.error('Error detecting new seasons:', error);
  }

  // 2. Inaktive Serien + Rewatches
  if (signal.aborted) return;
  try {
    const [inactive, inactiveRew] = await Promise.all([
      detectInactiveSeries(seriesList, userId),
      detectInactiveRewatches(seriesList, userId),
    ]);
    if (signal.aborted) return;
    if (inactive.length > 0 || inactiveRew.length > 0) {
      onUpdate({
        ...(inactive.length > 0 ? { inactiveSeries: inactive } : {}),
        ...(inactiveRew.length > 0 ? { inactiveRewatches: inactiveRew } : {}),
      });
    }
  } catch (error) {
    console.error('Error detecting inactive series:', error);
  }

  // 3. Abgeschlossene Serien
  if (signal.aborted) return;
  try {
    const completed = await detectCompletedSeries(seriesList, userId);
    if (signal.aborted) return;
    if (completed.length > 0) {
      onUpdate({ completedSeries: completed });
    }
  } catch (error) {
    console.error('Error detecting completed series:', error);
  }

  // 4. Unbewertete Serien
  if (signal.aborted) return;
  try {
    const unrated = await detectUnratedSeries(seriesList, userId);
    if (signal.aborted) return;
    if (unrated.length > 0) {
      onUpdate({ unratedSeries: unrated });
    }
  } catch (error) {
    console.error('Error detecting unrated series:', error);
  }

  // 5. Provider-Änderungen (niedrigste Priorität, TMDB API calls)
  if (signal.aborted) return;
  try {
    const changes = await detectProviderChanges(seriesList, userId);
    if (signal.aborted) return;
    if (changes.length > 0) {
      onUpdate({ providerChanges: changes });
    }
  } catch (error) {
    console.error('Error detecting provider changes:', error);
  }
}
