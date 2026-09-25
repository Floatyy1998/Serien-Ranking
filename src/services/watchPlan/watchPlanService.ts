import { dbRef, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';
import {
  compactWatchPlanDraft,
  expandWatchPlan,
  type StoredWatchPlanEntry,
  type WatchPlanDraft,
  type WatchPlanEntry,
} from '../../lib/watch/watchPlan';

const planPath = (uid: string, key?: string) =>
  key ? userPath(uid, 'watchPlan', key) : userPath(uid, 'watchPlan');

export function subscribeWatchPlan(
  uid: string,
  onChange: (entries: WatchPlanEntry[]) => void
): () => void {
  return subscribeValue(dbRef(planPath(uid)), (snap) => onChange(expandWatchPlan(snap.val())), {
    label: 'watchPlan',
  });
}

export async function addWatchPlanEntry(uid: string, draft: WatchPlanDraft): Promise<string> {
  const ref = dbRef(planPath(uid)).push();
  await ref.set(compactWatchPlanDraft(draft, Date.now()));
  return ref.key as string;
}

export async function updateWatchPlanEntry(
  uid: string,
  previous: WatchPlanEntry,
  draft: WatchPlanDraft
): Promise<void> {
  await dbRef(planPath(uid, previous.key)).set(
    compactWatchPlanDraft(
      { ...draft, via: draft.via ?? previous.via },
      previous.createdAt || Date.now(),
      previous
    )
  );
}

export async function removeWatchPlanEntry(uid: string, key: string): Promise<void> {
  await dbRef(planPath(uid, key)).remove();
}

/** Für Rückgängig: exakt den alten Datensatz zurückschreiben. */
export async function restoreWatchPlanEntry(uid: string, entry: WatchPlanEntry): Promise<void> {
  const stored: StoredWatchPlanEntry = compactWatchPlanDraft(entry, entry.createdAt, entry);
  await dbRef(planPath(uid, entry.key)).set(stored);
}
