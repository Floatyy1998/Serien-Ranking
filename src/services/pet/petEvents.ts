/** Ereignisbus fürs laufende Pet: gesehene Folgen mit Serien-Kontext (für Finale-Partys). */
export interface PetEpisodeEvent {
  seriesId: number;
  /** 1-basiert */
  seasonNumber: number;
  /** 1-basiert */
  episodeNumber: number;
  isRewatch: boolean;
}

const EPISODE_EVENT = 'pet-episode';

export function emitPetEpisode(detail: PetEpisodeEvent): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EPISODE_EVENT, { detail }));
}

export function onPetEpisode(handler: (detail: PetEpisodeEvent) => void): () => void {
  const listener = (e: Event) => {
    const detail = (e as CustomEvent<PetEpisodeEvent>).detail;
    if (detail) handler(detail);
  };
  window.addEventListener(EPISODE_EVENT, listener);
  return () => window.removeEventListener(EPISODE_EVENT, listener);
}
