import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { ReadingAreas } from '../../lib/reading/readingMedium';
import {
  readReadingAreasCached,
  subscribeReadingAreas,
} from '../../services/settings/readingAreas';

/** Genutzte Lesebereiche des Kontos, live aus der RTDB. Ohne Wahl: beides. */
export function useReadingAreas(): ReadingAreas {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<{ uid?: string; areas: ReadingAreas | null }>(() => ({
    uid,
    areas: uid ? readReadingAreasCached(uid) : null,
  }));

  useEffect(() => {
    if (!uid) return;
    try {
      return subscribeReadingAreas(uid, (areas) => setState({ uid, areas }));
    } catch {
      return undefined;
    }
  }, [uid]);

  const areas = state.uid === uid ? state.areas : uid ? readReadingAreasCached(uid) : null;
  return areas ?? 'both';
}
