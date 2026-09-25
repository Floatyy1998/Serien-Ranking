import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { WatchPlanEntry } from '../../lib/watch/watchPlan';
import { subscribeWatchPlan } from '../../services/watchPlan/watchPlanService';

export function useWatchPlan(): { entries: WatchPlanEntry[]; loading: boolean } {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<{ uid?: string; entries: WatchPlanEntry[] }>({
    entries: [],
  });

  useEffect(() => {
    if (!uid) return;
    try {
      return subscribeWatchPlan(uid, (entries) => setState({ uid, entries }));
    } catch {
      return undefined;
    }
  }, [uid]);

  const current = state.uid === uid;
  return { entries: current ? state.entries : [], loading: !!uid && !current };
}
