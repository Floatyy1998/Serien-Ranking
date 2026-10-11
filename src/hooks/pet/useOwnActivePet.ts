import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { petService } from '../../services/pet/petService';
import type { Pet } from '../../types/pet.types';
import { usePetEnabled } from './usePetEnabled';

/** Das aktive Pet des eingeloggten Nutzers (einmal geladen), null wenn keins oder Pets aus. */
export function useOwnActivePet(): Pet | null {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const enabled = usePetEnabled();
  const [pet, setPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (!uid || !enabled) return;
    let cancelled = false;
    petService
      .getActivePetId(uid)
      .then((id) => (id ? petService.getUserPet(uid, id) : null))
      .then((p) => {
        if (!cancelled) setPet(p ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid, enabled]);

  return enabled ? pet : null;
}
