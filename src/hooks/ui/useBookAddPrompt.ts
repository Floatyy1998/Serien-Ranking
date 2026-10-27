import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  readBookAddPromptCached,
  subscribeBookAddPrompt,
} from '../../services/settings/bookAddPrompt';

/** Beim Hinzufügen eines Buchs nach dem Lesestand fragen? Ohne Wahl: nein, direkt auf die Leseliste. */
export function useBookAddPrompt(): boolean {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<{ uid?: string; ask: boolean | null }>(() => ({
    uid,
    ask: uid ? readBookAddPromptCached(uid) : null,
  }));

  useEffect(() => {
    if (!uid) return;
    try {
      return subscribeBookAddPrompt(uid, (ask) => setState({ uid, ask }));
    } catch {
      return undefined;
    }
  }, [uid]);

  const ask = state.uid === uid ? state.ask : uid ? readBookAddPromptCached(uid) : null;
  return ask ?? false;
}
