/**
 * episodeWatchFanout — DER einzige Ort für die Nachwirkungen von
 * „Episode als gesehen markiert“: Pet-XP → Badge-Counter → Wrapped/Analytics-Event.
 *
 * Neue Nachwirkungen (weitere Subsysteme) hier ergänzen, NICHT an den
 * Call-Sites. Die Feature-Gates (petXp, badgeCounters, wrappedEvent)
 * defaulten auf true — Call-Sites setzen sie nur dort, wo das historische
 * Verhalten abweicht (z. B. kein Pet-XP im Kalender).
 *
 * Fehler werden bewusst NICHT geschluckt: Exceptions propagieren zu den
 * Call-Sites, die eigene try/catch- bzw. Undo-Toast-Behandlung haben.
 */
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';

export interface EpisodeWatchFanoutParams {
  userId: string;
  seriesId: number;
  seriesTitle: string;
  /** 1-basiert */
  seasonNumber: number;
  /** 1-basiert */
  episodeNumber: number;
  runtimeMinutes: number;
  isRewatch: boolean;
  genres?: string[];
  providers?: string[];
  episodeAirDate?: string;
  /** Feature-Gates — default true; nur setzen wo eine Call-Site abweicht. */
  petXp?: boolean;
  badgeCounters?: boolean;
  wrappedEvent?: boolean;
}

export async function runEpisodeWatchFanout(p: EpisodeWatchFanoutParams): Promise<void> {
  // 1. Pet-XP für alle lebenden Pets (genre-gewichtet)
  if (p.petXp !== false) {
    await petService.watchedSeriesWithGenreAllPets(p.userId, p.genres || []);
  }

  // 2. Badge-Counter (Streak, Quickwatch, …) — dynamic import bewusst
  //    beibehalten: Code-Splitting, der Badge-Chunk lädt erst beim ersten Watch.
  if (p.badgeCounters !== false) {
    const { updateEpisodeCounters } = await import('../../features/badges/minimalActivityLogger');
    await updateEpisodeCounters(p.userId, p.isRewatch, p.episodeAirDate);
  }

  // 3. Wrapped/Watch-Activity-Event — wie an allen bisherigen Call-Sites
  //    bewusst NICHT awaitet (Fire-and-forget).
  if (p.wrappedEvent !== false) {
    void WatchActivityService.logEpisodeWatch(
      p.userId,
      p.seriesId,
      p.seriesTitle,
      p.seasonNumber,
      p.episodeNumber,
      p.runtimeMinutes,
      p.isRewatch,
      p.genres,
      p.providers
    );
  }
}
