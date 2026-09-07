/**
 * Profilbild groß ansehen. Angefordert von überall dort, wo ein Avatar steht
 * (Freundesprofil, Rangliste, öffentliches Profil); gerendert wird es vom
 * AvatarViewerHost in MobileApp. Entkoppelt über ein CustomEvent, damit die
 * Aufrufer keinen Overlay-State brauchen (Muster: requestEpisodeRating).
 */

export interface AvatarViewRequest {
  url: string;
  /** Für Beschriftung und Alternativtext. */
  name: string;
}

export const AVATAR_VIEW_EVENT = 'tvrank:view-avatar';

/** `false`, wenn es gar kein Bild gibt — dann bleibt der Avatar nicht klickbar. */
export function showAvatar(url: string | null | undefined, name: string): boolean {
  if (!url) return false;
  window.dispatchEvent(
    new CustomEvent<AvatarViewRequest>(AVATAR_VIEW_EVENT, { detail: { url, name } })
  );
  return true;
}
