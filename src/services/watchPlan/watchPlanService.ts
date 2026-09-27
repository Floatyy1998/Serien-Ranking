import { dbRef, dbUpdate, userPath } from '../db/ref';
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

/** Serientermin: alle Einträge in einem Write; Anlagezeit steigt, damit Folgen am selben Termin sortiert bleiben. */
export async function addWatchPlanSeries(uid: string, drafts: WatchPlanDraft[]): Promise<void> {
  const now = Date.now();
  const updates: Record<string, StoredWatchPlanEntry> = {};
  drafts.forEach((draft, i) => {
    const key = dbRef(planPath(uid)).push().key as string;
    updates[planPath(uid, key)] = compactWatchPlanDraft(draft, now + i);
  });
  await dbUpdate(updates);
}

export async function removeWatchPlanEntries(
  uid: string,
  entries: WatchPlanEntry[]
): Promise<void> {
  const updates: Record<string, null> = {};
  for (const entry of entries) updates[planPath(uid, entry.key)] = null;
  await dbUpdate(updates);
}

export async function restoreWatchPlanEntries(
  uid: string,
  entries: WatchPlanEntry[]
): Promise<void> {
  const updates: Record<string, StoredWatchPlanEntry> = {};
  for (const entry of entries) {
    updates[planPath(uid, entry.key)] = compactWatchPlanDraft(entry, entry.createdAt, entry);
  }
  await dbUpdate(updates);
}

export const newPlanGroupId = (uid: string): string => dbRef(planPath(uid)).push().key as string;

/** Mehrere Einträge in einem Write ersetzen bzw. entfernen (Reihen-Aktionen). */
export async function applyWatchPlanChanges(
  uid: string,
  changed: { previous: WatchPlanEntry; next: WatchPlanEntry }[],
  removed: WatchPlanEntry[] = []
): Promise<void> {
  const updates: Record<string, StoredWatchPlanEntry | null> = {};
  for (const { previous, next } of changed) {
    updates[planPath(uid, previous.key)] = compactWatchPlanDraft(
      next,
      previous.createdAt || Date.now(),
      previous
    );
  }
  for (const entry of removed) updates[planPath(uid, entry.key)] = null;
  await dbUpdate(updates);
}
