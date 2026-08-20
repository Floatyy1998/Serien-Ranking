import { useCallback, useEffect, useState } from 'react';
import { fetchPublicUserFields } from '../services/firebase/userDisplayData';

/**
 * Liefert die anzuzeigende Profilbild-URL und meldet, wenn sie nicht lädt.
 *
 * Freundeslisten, Rangliste und Aktivitäten speichern die Bild-URL als Kopie.
 * Lädt der Nutzer ein neues Bild hoch, vergibt Storage ein neues Download-Token
 * und jede alte Kopie liefert 403 — sichtbar als leerer Kreis. Schlägt das Laden
 * fehl, wird deshalb einmal die aktuelle URL aus `users/<uid>/photoURL` geholt;
 * hilft auch die nicht, bleibt es beim Initial-Rückfall.
 */
const resolved = new Map<string, string | null>();

export function useAvatarSource(userId: string, photoURL?: string) {
  const [src, setSrc] = useState<string | undefined>(photoURL);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const healed = resolved.get(userId);
    if (photoURL && healed !== undefined && healed !== photoURL) {
      setSrc(healed ?? undefined);
      setFailed(healed === null);
      return;
    }
    setSrc(photoURL);
    setFailed(false);
  }, [userId, photoURL]);

  const handleError = useCallback(async () => {
    if (!userId || resolved.has(userId)) {
      setFailed(true);
      return;
    }
    const { photoURL: live } = await fetchPublicUserFields(userId);
    if (live && live !== src) {
      resolved.set(userId, live);
      setSrc(live);
      return;
    }
    resolved.set(userId, null);
    setFailed(true);
  }, [userId, src]);

  return { src: failed ? undefined : src, onError: handleError };
}
