import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { PlanGuestStatus, PlanInvite } from '../../lib/watch/watchPlan';
import {
  subscribePlanGuests,
  subscribePlanInvites,
} from '../../services/watchPlan/watchPlanSharing';

interface SharingState {
  uid?: string;
  invites: PlanInvite[];
  guests: Map<string, Record<string, PlanGuestStatus>>;
}

const EMPTY: SharingState = { invites: [], guests: new Map() };

/** Offene Einladungen an mich + Gäste-Status meiner eigenen Termine. */
export function useWatchPlanSharing(): Omit<SharingState, 'uid'> {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<SharingState>(EMPTY);

  useEffect(() => {
    if (!uid) return;
    const offs: (() => void)[] = [];
    try {
      offs.push(
        subscribePlanInvites(uid, (invites) =>
          setState((s) => ({ ...(s.uid === uid ? s : EMPTY), uid, invites }))
        )
      );
      offs.push(
        subscribePlanGuests(uid, (guests) =>
          setState((s) => ({ ...(s.uid === uid ? s : EMPTY), uid, guests }))
        )
      );
    } catch {
      // Listener sind Zusatz — der Plan selbst funktioniert ohne
    }
    return () => offs.forEach((off) => off());
  }, [uid]);

  return state.uid === uid ? state : EMPTY;
}
