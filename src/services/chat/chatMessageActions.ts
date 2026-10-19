/**
 * Aktionen auf einzelne Chat-Nachrichten (Long-Press-Menü).
 *
 *   chats/$pairId/messages/{id}            — „Für alle löschen" ersetzt die Nachricht durch { s, ts, del },
 *                                            Bearbeiten setzt t neu + ed (Zeitpunkt)
 *   chats/$pairId/pinned                   — eine fixierte Nachricht, Auszug beim Fixieren eingefroren
 *   chats/$pairId/read/$uid = ts           — Lesebestätigung (nur wer sie nicht abgeschaltet hat)
 *   users/$uid/chatHidden/$pairId/{id}     — „Für mich löschen"
 *   users/$uid/chatStars/$pairId/{id}      — markierte Nachrichten mit eingefrorenem Auszug
 *   users/$uid/chatPrefs/readReceipts      — false = Lesebestätigungen aus (gilt in beide Richtungen)
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { dbGet, dbRef, dbUpdate, userPath } from '../db/ref';
import { onValue } from '../db/subscribeValue';
import { localizedVariants } from '../i18n';
import { queuePush } from '../notifications/pushQueue';
import {
  canEditMessage,
  compactReply,
  DELETED_PREVIEW,
  MAX_MESSAGE_LENGTH,
  expandReply,
  otherUidFromPairId,
  replyFromMessage,
  sendImageMessage,
  sendMessage,
  type ChatMessage,
  type ChatReply,
  type ChatSummary,
  type CompactReply,
} from './chatService';

export interface PinnedMessage extends ChatReply {
  pinnedBy: string;
  pinnedAt: number;
}

export interface StarredMessage extends ChatReply {
  timestamp: number;
}

/** Text, der beim Kopieren in die Zwischenablage landet — null, wenn es nichts zu kopieren gibt. */
export function copyableText(m: ChatMessage): string | null {
  if (m.deleted || m.stickerId) return null;
  if (m.episode) {
    const head = `${m.episode.seriesTitle} S${m.episode.season}·E${m.episode.episode}`;
    return m.text ? `${head}\n${m.text}` : head;
  }
  return m.text || null;
}

const DELETED_PUSH = 'Diese Nachricht wurde gelöscht.';

/**
 * Tauscht den Push, der beim Empfänger zu dieser Nachricht liegt, leise aus —
 * wie bei WhatsApp. Ältere App-Versionen können das nicht; dort räumt das
 * Backend den Chat-Push beim Löschen wenigstens ganz weg.
 */
async function replaceDeliveredPush(
  myUid: string,
  pairId: string,
  msgId: string,
  op: 'edit' | 'delete',
  body: string,
  translate: boolean
): Promise<void> {
  const friendUid = otherUidFromPairId(pairId, myUid);
  if (!friendUid) return;
  await queuePush(friendUid, {
    title: 'TV-Rank',
    body: body.slice(0, 300),
    ...(translate && { bodyL: await localizedVariants(body) }),
    url: `/chat/${myUid}`,
    mid: msgId,
    op,
  });
}

export async function deleteMessageForAll(
  myUid: string,
  pairId: string,
  m: ChatMessage,
  summary: ChatSummary | null,
  pinnedId: string | null
): Promise<void> {
  if (m.senderId !== myUid || m.deleted) return;
  const updates: Record<string, unknown> = {
    [`chats/${pairId}/messages/${m.id}`]: { s: myUid, ts: m.timestamp, del: true },
    [`chats/${pairId}/reactions/${m.id}/${myUid}`]: null,
  };
  if (summary?.lastMessageAt === m.timestamp) {
    updates[`chats/${pairId}/summary/lastMessage`] = DELETED_PREVIEW;
  }
  if (pinnedId === m.id) updates[`chats/${pairId}/pinned`] = null;
  await dbUpdate(updates);
  void replaceDeliveredPush(myUid, pairId, m.id, 'delete', DELETED_PUSH, true);
  if (m.imageUrl) {
    await firebase
      .storage()
      .ref(`chat-images/${pairId}/${m.id}`)
      .delete()
      .catch(() => {});
  }
}

/**
 * Nur t und ed werden geschrieben — die Rules erlauben das bloß beim eigenen
 * reinen Text innerhalb von EDIT_WINDOW_MS und lassen alles andere unberührt.
 */
export async function editMessage(
  myUid: string,
  pairId: string,
  m: ChatMessage,
  text: string
): Promise<void> {
  const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!trimmed || trimmed === m.text || !canEditMessage(m, myUid)) return;
  const updates: Record<string, unknown> = {
    [`chats/${pairId}/messages/${m.id}/t`]: trimmed,
    [`chats/${pairId}/messages/${m.id}/ed`]: Date.now(),
  };
  const lastAt = await dbGet<number>(`chats/${pairId}/summary/lastMessageAt`).catch(() => null);
  if (lastAt === m.timestamp && !m.isSpoiler) {
    updates[`chats/${pairId}/summary/lastMessage`] = trimmed.slice(0, 300);
  }
  await dbUpdate(updates);
  const shown = m.isSpoiler ? 'Spoiler' : trimmed;
  void replaceDeliveredPush(myUid, pairId, m.id, 'edit', shown, m.isSpoiler === true);
}

export async function hideMessagesForMe(
  myUid: string,
  pairId: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  await dbUpdate(
    Object.fromEntries(ids.map((id) => [userPath(myUid, 'chatHidden', pairId, id), true]))
  );
}

export function subscribeHiddenMessages(
  myUid: string,
  pairId: string,
  cb: (ids: Set<string>) => void
): () => void {
  const ref = dbRef(userPath(myUid, 'chatHidden', pairId));
  const handler = onValue(ref, (snap) => cb(new Set(Object.keys(snap.val() || {}))));
  return () => ref.off('value', handler);
}

export async function setStarred(
  myUid: string,
  pairId: string,
  messages: ChatMessage[],
  starred: boolean
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const m of messages) {
    if (m.deleted) continue;
    updates[userPath(myUid, 'chatStars', pairId, m.id)] = starred
      ? { ...compactReply(replyFromMessage(m)), ts: m.timestamp }
      : null;
  }
  if (Object.keys(updates).length > 0) await dbUpdate(updates);
}

export function subscribeStarred(
  myUid: string,
  pairId: string,
  cb: (starred: StarredMessage[]) => void
): () => void {
  const ref = dbRef(userPath(myUid, 'chatStars', pairId));
  const handler = onValue(ref, (snap) => {
    const val = (snap.val() || {}) as Record<string, CompactReply & { ts?: number }>;
    const list = Object.values(val)
      .map((raw) => {
        const reply = expandReply(raw);
        return reply ? { ...reply, timestamp: typeof raw.ts === 'number' ? raw.ts : 0 } : null;
      })
      .filter((s): s is StarredMessage => s !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
    cb(list);
  });
  return () => ref.off('value', handler);
}

export async function setPinned(
  myUid: string,
  pairId: string,
  m: ChatMessage | null
): Promise<void> {
  await dbRef(`chats/${pairId}/pinned`).set(
    m && !m.deleted ? { ...compactReply(replyFromMessage(m)), by: myUid, at: Date.now() } : null
  );
}

export function subscribePinned(
  pairId: string,
  cb: (pinned: PinnedMessage | null) => void
): () => void {
  const ref = dbRef(`chats/${pairId}/pinned`);
  const handler = onValue(ref, (snap) => {
    const raw = snap.val() as (CompactReply & { by?: string; at?: number }) | null;
    const reply = expandReply(raw ?? undefined);
    cb(reply && raw ? { ...reply, pinnedBy: raw.by ?? '', pinnedAt: raw.at ?? 0 } : null);
  });
  return () => ref.off('value', handler);
}

export async function publishReadReceipt(myUid: string, pairId: string): Promise<void> {
  try {
    await dbRef(`chats/${pairId}/read/${myUid}`).set(Date.now());
  } catch {
    /* best-effort */
  }
}

export function subscribePartnerRead(
  pairId: string,
  partnerUid: string,
  cb: (readAt: number) => void
): () => void {
  const ref = dbRef(`chats/${pairId}/read/${partnerUid}`);
  const handler = onValue(ref, (snap) => cb(typeof snap.val() === 'number' ? snap.val() : 0));
  return () => ref.off('value', handler);
}

export function subscribeReadReceiptsEnabled(
  myUid: string,
  cb: (enabled: boolean) => void
): () => void {
  const ref = dbRef(userPath(myUid, 'chatPrefs', 'readReceipts'));
  const handler = onValue(ref, (snap) => cb(snap.val() !== false));
  return () => ref.off('value', handler);
}

/**
 * Abschalten nimmt auch die bereits veröffentlichten Lese-Stände zurück —
 * sonst sähe das Gegenüber weiter den letzten Stand vor dem Abschalten.
 */
export async function setReadReceiptsEnabled(myUid: string, enabled: boolean): Promise<void> {
  await dbRef(userPath(myUid, 'chatPrefs', 'readReceipts')).set(enabled ? null : false);
  if (enabled) return;
  const index = ((await dbGet(`chatIndex/${myUid}`).catch(() => null)) || {}) as Record<
    string,
    unknown
  >;
  await Promise.all(
    Object.keys(index).map((pairId) =>
      dbRef(`chats/${pairId}/read/${myUid}`)
        .set(null)
        .catch(() => {})
    )
  );
}

/** Bild erneut hochladen statt die URL zu teilen — sonst risse das Löschen des Originals es mit. */
async function refetchImage(url: string, id: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch-failed');
  const blob = await res.blob();
  return new File([blob], id, { type: blob.type || 'image/jpeg' });
}

export async function forwardMessages(
  myUid: string,
  friendUid: string,
  messages: ChatMessage[],
  myName: string
): Promise<void> {
  for (const m of messages) {
    if (m.deleted) continue;
    if (m.imageUrl) {
      const file = await refetchImage(m.imageUrl, m.id);
      await sendImageMessage(myUid, friendUid, file, myName, m.text, undefined, true);
    } else if (m.episode) {
      await sendMessage(
        myUid,
        friendUid,
        {
          kind: 'episode',
          episode: m.episode,
          text: m.text,
          spoiler: m.isSpoiler,
          forwarded: true,
        },
        myName
      );
    } else if (m.stickerId) {
      await sendMessage(
        myUid,
        friendUid,
        { kind: 'sticker', stickerId: m.stickerId, forwarded: true },
        myName
      );
    } else if (m.text) {
      await sendMessage(
        myUid,
        friendUid,
        { kind: 'text', text: m.text, spoiler: m.isSpoiler, forwarded: true },
        myName
      );
    }
  }
}
