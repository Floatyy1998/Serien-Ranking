/**
 * Ungelesene Chats (live): chatIndex + eigener Lese-Stand + Chat-Summaries.
 * Gemeinsame Quelle für den Badge am Chat-Button und die Bell-Notifications.
 */
import { dbRef, userPath } from '../db/ref';
import { otherUidFromPairId, type ChatSummary } from './chatService';
import { onValue } from '../db/subscribeValue';

export interface UnreadChat {
  pairId: string;
  otherUid: string;
  lastMessage: string;
  lastMessageAt: number;
}

export function subscribeUnreadChats(
  myUid: string,
  cb: (unread: UnreadChat[]) => void
): () => void {
  let index: Record<string, number> = {};
  let readState: Record<string, { lastReadAt?: number }> = {};
  const summaries: Record<string, ChatSummary> = {};
  const summaryOffs = new Map<string, () => void>();

  const emit = () => {
    const list: UnreadChat[] = [];
    for (const pairId of Object.keys(index)) {
      const s = summaries[pairId];
      const otherUid = otherUidFromPairId(pairId, myUid);
      if (!s || !otherUid || !s.lastMessageAt || s.lastSender === myUid) continue;
      if (s.lastMessageAt <= (readState[pairId]?.lastReadAt || 0)) continue;
      list.push({
        pairId,
        otherUid,
        lastMessage: s.lastMessage || '',
        lastMessageAt: s.lastMessageAt,
      });
    }
    list.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    cb(list);
  };

  const syncSummaryListeners = () => {
    for (const pairId of Object.keys(index)) {
      if (summaryOffs.has(pairId)) continue;
      const ref = dbRef(`chats/${pairId}/summary`);
      const handler = onValue(
        ref,
        (snap) => {
          summaries[pairId] = (snap.val() || {}) as ChatSummary;
          emit();
        },
        {
          onError: () => {
            /* Chat evtl. gerade gelöscht — Eintrag bleibt einfach leer */
          },
        }
      );
      summaryOffs.set(pairId, () => ref.off('value', handler));
    }
    for (const [pairId, off] of summaryOffs) {
      if (!(pairId in index)) {
        off();
        summaryOffs.delete(pairId);
        delete summaries[pairId];
      }
    }
  };

  const indexRef = dbRef(`chatIndex/${myUid}`);
  const stateRef = dbRef(userPath(myUid, 'chatState'));
  const onIndex = onValue(indexRef, (snap) => {
    index = (snap.val() || {}) as Record<string, number>;
    syncSummaryListeners();
    emit();
  });
  const onState = onValue(stateRef, (snap) => {
    readState = (snap.val() || {}) as Record<string, { lastReadAt?: number }>;
    emit();
  });

  return () => {
    indexRef.off('value', onIndex);
    stateRef.off('value', onState);
    for (const off of summaryOffs.values()) off();
    summaryOffs.clear();
  };
}
