import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { readPetEnabledCached, subscribePetEnabled } from '../services/pet/petPreferences';

/** Ob das Pet-Feature an ist (Widget, Reaktionen, Home-Karten, Geschenke). Live aus der RTDB. */
export function usePetEnabled(): boolean {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [enabled, setEnabled] = useState<boolean>(() => (uid ? readPetEnabledCached(uid) : true));

  useEffect(() => {
    if (!uid) return;
    try {
      return subscribePetEnabled(uid, setEnabled);
    } catch {
      return undefined;
    }
  }, [uid]);

  return enabled;
}
