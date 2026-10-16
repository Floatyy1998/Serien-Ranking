import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  readAppFocusCached,
  subscribeAppFocus,
  type AppFocus,
} from '../../services/settings/appFocus';

interface AppFocusState {
  /** Gilt für Startseite und Dock — ohne gespeicherte Wahl „Serien & Filme". */
  focus: AppFocus;
  /** Die gespeicherte Wahl, `null` solange niemand gewählt hat. */
  chosen: AppFocus | null;
  /** Erster Wert aus der RTDB ist da (vorher nur der Gerätecache). */
  loaded: boolean;
}

/** Schwerpunkt des Kontos (Serien & Filme, Manga & Bücher, beides). Live aus der RTDB. */
export function useAppFocus(): AppFocusState {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<{ uid?: string; chosen: AppFocus | null; loaded: boolean }>(
    () => ({ uid, chosen: uid ? readAppFocusCached(uid) : null, loaded: false })
  );

  useEffect(() => {
    if (!uid) return;
    try {
      return subscribeAppFocus(uid, (chosen) => setState({ uid, chosen, loaded: true }));
    } catch {
      return undefined;
    }
  }, [uid]);

  const current =
    state.uid === uid ? state : { chosen: uid ? readAppFocusCached(uid) : null, loaded: false };
  return { focus: current.chosen ?? 'watch', chosen: current.chosen, loaded: current.loaded };
}
