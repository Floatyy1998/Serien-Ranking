/**
 * Globaler Bewertungs-Prompt: Abhak-Stellen (Weiterschauen, Als Nächstes …)
 * fordern nach dem Markieren ein Bewertungs-Sheet an; gerendert wird es vom
 * EpisodeRatingSheetHost in MobileApp. Entkoppelt über ein CustomEvent, damit
 * die Call-Sites keinerlei Sheet-State brauchen (Muster: triggerPetReaction).
 */

export interface EpisodeRatingRequest {
  seriesId: number;
  seriesTitle: string;
  /** Watch-Season-Index (Array-Position), für den r-Schreibpfad. */
  seasonIndex: number;
  episodeId: number;
  /** Anzeige-Label, z. B. „S1 E5 · Der lange Marsch". */
  label: string;
  /** Bisherige Bewertung (Vorbelegung der Sterne). */
  currentRating?: number;
}

export const EPISODE_RATING_EVENT = 'tvrank:rate-episode';

// Drossel: beim schnellen Durchklicken (Nachtragen/Bulk) keinen Prompt-Spam —
// maximal ein Sheet pro Minute. Bewusst nur für die AUTOMATISCHEN Prompts;
// explizites Bewerten (Long-Press-Sheet, Diskussion) läuft nicht hierüber.
const PROMPT_COOLDOWN_MS = 60_000;
let lastPromptAt = 0;

/** Fordert das Bewertungs-Sheet an. false = gedrosselt (kein Sheet). */
export function requestEpisodeRating(request: EpisodeRatingRequest): boolean {
  const now = Date.now();
  if (now - lastPromptAt < PROMPT_COOLDOWN_MS) return false;
  lastPromptAt = now;
  window.dispatchEvent(
    new CustomEvent<EpisodeRatingRequest>(EPISODE_RATING_EVENT, { detail: request })
  );
  return true;
}
