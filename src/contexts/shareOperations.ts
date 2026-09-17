/**
 * Freigabe der eigenen Serien an einzelne Freunde. Freund sein reicht seit
 * 17.09.2026 nicht mehr aus, um Serienliste, Fortschritt, Kalender und
 * Bewertungen zu sehen — das hängt an `users/$uid/shares/$freundUid`.
 *
 * Der Ablauf spiegelt bewusst die Freundschaftsanfragen: eine Anfrage liegt
 * unter `shareRequests`, der Empfänger nimmt sie an und setzt damit den
 * Freigabe-Eintrag in seinem eigenen Knoten.
 */
import { dbGet, dbRef, dbUpdate, serverTimestamp, userPath } from '../services/db/ref';
import { paths } from '../services/db/paths';
import type { ShareRequest } from '../types/Friend';

/**
 * Offene Anfrage an denselben Empfänger, falls vorhanden. Bewusst als Query
 * über `fromUserId` — der Wurzelknoten ist ohne Query nicht lesbar (Rules).
 */
async function findPending(fromUserId: string, toUserId: string): Promise<string | null> {
  const snap = await dbRef('shareRequests')
    .orderByChild('fromUserId')
    .equalTo(fromUserId)
    .once('value')
    .catch(() => null);
  const all = (snap?.val() ?? null) as Record<string, ShareRequest> | null;
  if (!all) return null;
  for (const [id, req] of Object.entries(all)) {
    if (req?.toUserId === toUserId && req?.status === 'pending') return id;
  }
  return null;
}

/**
 * Bittet einen Freund um Einblick. Doppelte Anfragen werden zusammengefasst,
 * damit ein zweiter Tipp keine zweite Karte beim Empfänger erzeugt.
 */
export async function requestShareOp(
  user: { uid: string; displayName: string | null; email: string | null },
  toUserId: string
): Promise<boolean> {
  if (!toUserId || toUserId === user.uid) return false;

  // Schon freigegeben? Dann ist die Anfrage gegenstandslos.
  const already = await dbGet<boolean>(paths.share(toUserId, user.uid)).catch(() => null);
  if (already === true) return true;

  if (await findPending(user.uid, toUserId)) return true;

  const ownUsername = await dbGet<string>(userPath(user.uid, 'username')).catch(() => null);
  const ref = dbRef('shareRequests').push();
  await ref.set({
    fromUserId: user.uid,
    toUserId,
    fromUsername: ownUsername || user.displayName || user.email?.split('@')[0] || 'Unbekannt',
    status: 'pending',
    sentAt: serverTimestamp(),
  });
  return true;
}

/**
 * Annehmen: Freigabe setzen und die Anfrage abhaken — beides in einem Schreib-
 * vorgang, damit kein halber Zustand entsteht (Freigabe ohne erledigte Anfrage
 * oder umgekehrt).
 */
export async function acceptShareOp(
  ownUid: string,
  requestId: string,
  fromUserId: string
): Promise<void> {
  await dbUpdate({
    [paths.share(ownUid, fromUserId)]: true,
    [`shareRequests/${requestId}/status`]: 'accepted',
  });
}

export async function declineShareOp(requestId: string): Promise<void> {
  await dbRef(`shareRequests/${requestId}/status`).set('declined');
}

/**
 * Zieht eine noch offene eigene Anfrage zurück. Nötig, wenn der Stern wieder
 * ausgeht: sonst landet beim anderen später eine Bitte, die niemand mehr meint.
 */
export async function withdrawShareRequestOp(fromUserId: string, toUserId: string): Promise<void> {
  const id = await findPending(fromUserId, toUserId);
  if (!id) return;
  await dbRef(`shareRequests/${id}`).remove();
}

/** Entzug. Die Anfrage bleibt abgehakt — erneutes Fragen ist wieder möglich. */
export async function revokeShareOp(ownUid: string, friendId: string): Promise<void> {
  await dbRef(paths.share(ownUid, friendId)).remove();
}

/** „Allen bestehenden Freunden freigeben" — ein Tipp statt N Bestätigungen. */
export async function shareWithAllOp(ownUid: string, friendIds: string[]): Promise<void> {
  if (friendIds.length === 0) return;
  const updates: Record<string, unknown> = {};
  for (const id of friendIds) updates[paths.share(ownUid, id)] = true;
  await dbUpdate(updates);
}
