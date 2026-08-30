/**
 * 1:1-Chats unter Freunden (Firebase RTDB).
 *
 * Datenmodell:
 *   chats/$pairId/participants/{uidA,uidB}   — einmalig beim Anlegen (Rules: create-once, nur Freunde)
 *   chats/$pairId/summary                    — lastMessage/lastMessageAt/lastSender/createdAt
 *   chats/$pairId/blocked/{uid}              — Blocker trägt sich selbst ein; solange gesetzt: kein Senden
 *   chats/$pairId/messages/{id}              — { s: senderUid, t: text, ts: ms }
 *   chatIndex/$uid/$pairId = lastMessageAt   — pro Nutzer die Chat-Liste (beide Seiten werden beim Senden gepflegt)
 *   users/$uid/chatState/$pairId/lastReadAt  — eigener Lese-Stand (Unread-Badges)
 *
 * Privatsphäre: Nachrichten werden NICHT proaktiv gescannt — Moderation nur
 * über die Melden-Funktion (chatReports + Admin-Benachrichtigung).
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { ADMIN_UID } from '../../config/admin';
import { prepareChatImage } from '../../lib/imageCompress';
import { dbGet, dbRef, dbUpdate, userPath } from '../db/ref';
import { localizedVariants, t } from '../i18n';
import { queuePush } from '../pushQueue';
import { onValue } from '../db/subscribeValue';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  stickerId?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  /** Als Spoiler markiert — Empfänger sieht den Text erst nach Tap. */
  isSpoiler?: boolean;
}

export type OutgoingMessage =
  { kind: 'text'; text: string; spoiler?: boolean } | { kind: 'sticker'; stickerId: string };

export interface ChatSummary {
  lastMessage?: string;
  lastMessageAt?: number;
  lastSender?: string;
  createdAt?: number;
}

export const MAX_MESSAGE_LENGTH = 2000;

/** Stabile Chat-ID für ein Nutzer-Paar (sortiert, unabhängig von der Richtung). */
export function chatPairId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/** Gegenstück aus einer pairId — null, wenn der Nutzer nicht Teil des Chats ist. */
export function otherUidFromPairId(pairId: string, myUid: string): string | null {
  if (pairId.startsWith(`${myUid}_`)) return pairId.slice(myUid.length + 1);
  if (pairId.endsWith(`_${myUid}`)) return pairId.slice(0, -(myUid.length + 1));
  return null;
}

/**
 * Chat anlegen, falls er noch nicht existiert (participants sind create-once).
 * Zwei getrennte Writes: die Summary-Rule verlangt existierende participants,
 * in einem Multi-Path-Update sieht sie aber nur den alten Datenstand.
 */
export async function ensureChat(myUid: string, friendUid: string): Promise<string> {
  const pairId = chatPairId(myUid, friendUid);
  let existing: unknown = null;
  try {
    existing = await dbGet(`chats/${pairId}/participants`);
  } catch {
    // Lese-Rule verlangt existierende participants — Fehler heißt: Chat gibt es noch nicht
  }
  if (!existing) {
    try {
      await dbRef(`chats/${pairId}/participants`).set({ [myUid]: true, [friendUid]: true });
    } catch (err) {
      const raced = await dbGet(`chats/${pairId}/participants`);
      if (!raced) throw err;
    }
    await dbRef(`chats/${pairId}/summary/createdAt`)
      .set(Date.now())
      .catch(() => {});
  }
  return pairId;
}

export async function sendMessage(
  myUid: string,
  friendUid: string,
  message: OutgoingMessage,
  myName: string
): Promise<void> {
  let payload: Record<string, unknown>;
  let preview: string;
  if (message.kind === 'text') {
    const trimmed = message.text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed) return;
    payload = message.spoiler ? { t: trimmed, sp: true } : { t: trimmed };
    // Spoiler dürfen weder über die Chat-Liste noch über den Push leaken
    preview = message.spoiler ? 'Spoiler' : trimmed.slice(0, 300);
  } else {
    payload = { st: message.stickerId.slice(0, 64) };
    preview = 'Sticker';
  }

  const pairId = await ensureChat(myUid, friendUid);
  const ts = Date.now();
  const msgId = dbRef(`chats/${pairId}/messages`).push().key;
  if (!msgId) return;

  await dbUpdate({
    [`chats/${pairId}/messages/${msgId}`]: { s: myUid, ts, ...payload },
    [`chats/${pairId}/summary/lastMessage`]: preview,
    [`chats/${pairId}/summary/lastMessageAt`]: ts,
    [`chats/${pairId}/summary/lastSender`]: myUid,
    [`chatIndex/${myUid}/${pairId}`]: ts,
    [`chatIndex/${friendUid}/${pairId}`]: ts,
    [userPath(myUid, 'chatState', pairId, 'lastReadAt')]: ts,
  });

  void queuePush(friendUid, {
    title: myName,
    body: preview,
    url: `/chat/${myUid}`,
  });
}

/**
 * Bild/GIF senden: komprimieren, nach Storage laden (Dateiname = Message-ID,
 * damit die Lösch-Crons den Storage-Pfad aus dem Message-Key ableiten können),
 * dann die Nachricht mit der Download-URL schreiben.
 */
export async function sendImageMessage(
  myUid: string,
  friendUid: string,
  file: File,
  myName: string,
  caption = ''
): Promise<void> {
  const prepared = await prepareChatImage(file);
  const pairId = await ensureChat(myUid, friendUid);
  const msgId = dbRef(`chats/${pairId}/messages`).push().key;
  if (!msgId) return;

  const storageRef = firebase.storage().ref(`chat-images/${pairId}/${msgId}`);
  await storageRef.put(prepared.blob, { contentType: prepared.contentType });
  const url: string = await storageRef.getDownloadURL();

  const ts = Date.now();
  const text = caption.trim().slice(0, 1000);
  const preview = text ? text.slice(0, 300) : prepared.isGif ? 'GIF' : 'Bild';
  await dbUpdate({
    [`chats/${pairId}/messages/${msgId}`]: {
      s: myUid,
      ts,
      img: url,
      w: prepared.width,
      h: prepared.height,
      ...(text && { t: text }),
    },
    [`chats/${pairId}/summary/lastMessage`]: preview,
    [`chats/${pairId}/summary/lastMessageAt`]: ts,
    [`chats/${pairId}/summary/lastSender`]: myUid,
    [`chatIndex/${myUid}/${pairId}`]: ts,
    [`chatIndex/${friendUid}/${pairId}`]: ts,
    [userPath(myUid, 'chatState', pairId, 'lastReadAt')]: ts,
  });

  void queuePush(friendUid, {
    title: myName,
    body: preview,
    // Bildnachrichten haben statt Text ein Token („Bild"/„GIF") — nur das
    // gehört übersetzt, eine echte Bildunterschrift bleibt wie geschrieben.
    ...(text ? {} : { bodyL: await localizedVariants(preview) }),
    url: `/chat/${myUid}`,
  });
}

/** Anzeige-Label für Vorschau-Tokens (lastMessage speichert DE-Quelle). */
export function previewLabel(preview: string | undefined): string {
  if (!preview) return '';
  if (preview === 'Bild') return t('Bild');
  return preview;
}

export async function markChatRead(myUid: string, pairId: string): Promise<void> {
  try {
    await dbRef(userPath(myUid, 'chatState', pairId, 'lastReadAt')).set(Date.now());
  } catch {
    /* best-effort */
  }
}

export function subscribeMessages(
  pairId: string,
  cb: (messages: ChatMessage[]) => void,
  limit = 200
): () => void {
  const query = dbRef(`chats/${pairId}/messages`).orderByChild('ts').limitToLast(limit);
  const handler = onValue(query, (snap) => {
    const val = (snap.val() || {}) as Record<
      string,
      {
        s: string;
        t?: string;
        st?: string;
        img?: string;
        w?: number;
        h?: number;
        sp?: boolean;
        ts: number;
      }
    >;
    const list = Object.entries(val)
      .map(([id, m]) => ({
        id,
        senderId: m.s,
        text: m.t || '',
        timestamp: m.ts,
        stickerId: m.st,
        imageUrl: m.img,
        imageWidth: m.w,
        imageHeight: m.h,
        isSpoiler: m.sp === true,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    cb(list);
  });
  return () => query.off('value', handler);
}

export function subscribeChatIndex(
  myUid: string,
  cb: (entries: Array<{ pairId: string; lastMessageAt: number }>) => void
): () => void {
  const ref = dbRef(`chatIndex/${myUid}`);
  const handler = onValue(ref, (snap) => {
    const val = (snap.val() || {}) as Record<string, number>;
    const list = Object.entries(val)
      .map(([pairId, ts]) => ({ pairId, lastMessageAt: typeof ts === 'number' ? ts : 0 }))
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    cb(list);
  });
  return () => ref.off('value', handler);
}

export function subscribeSummary(pairId: string, cb: (summary: ChatSummary) => void): () => void {
  const ref = dbRef(`chats/${pairId}/summary`);
  const handler = onValue(ref, (snap) => cb((snap.val() || {}) as ChatSummary));
  return () => ref.off('value', handler);
}

export function subscribeBlocked(pairId: string, cb: (blockedBy: string[]) => void): () => void {
  const ref = dbRef(`chats/${pairId}/blocked`);
  const handler = onValue(ref, (snap) => cb(Object.keys(snap.val() || {})));
  return () => ref.off('value', handler);
}

export function subscribeChatState(
  myUid: string,
  cb: (state: Record<string, { lastReadAt?: number }>) => void
): () => void {
  const ref = dbRef(userPath(myUid, 'chatState'));
  const handler = onValue(ref, (snap) =>
    cb((snap.val() || {}) as Record<string, { lastReadAt?: number }>)
  );
  return () => ref.off('value', handler);
}

/** Reaktion auf eine Nachricht setzen/entfernen (ein Emoji pro Nutzer und Nachricht). */
export async function setReaction(
  myUid: string,
  pairId: string,
  msgId: string,
  emoji: string | null
): Promise<void> {
  await dbRef(`chats/${pairId}/reactions/${msgId}/${myUid}`).set(emoji);
}

export function subscribeReactions(
  pairId: string,
  cb: (reactions: Record<string, Record<string, string>>) => void
): () => void {
  const ref = dbRef(`chats/${pairId}/reactions`);
  const handler = onValue(ref, (snap) =>
    cb((snap.val() || {}) as Record<string, Record<string, string>>)
  );
  return () => ref.off('value', handler);
}

/** Tipp-Status: eigener Timestamp unter typing/$uid (null = nicht am Tippen). */
export async function setTyping(myUid: string, pairId: string, active: boolean): Promise<void> {
  try {
    await dbRef(`chats/${pairId}/typing/${myUid}`).set(active ? Date.now() : null);
  } catch {
    /* best-effort */
  }
}

export function subscribeTyping(
  pairId: string,
  myUid: string,
  cb: (otherTypingAt: number | null) => void
): () => void {
  const ref = dbRef(`chats/${pairId}/typing`);
  const handler = onValue(ref, (snap) => {
    const val = (snap.val() || {}) as Record<string, number>;
    const other = Object.entries(val).find(([uid]) => uid !== myUid);
    cb(other ? other[1] : null);
  });
  return () => ref.off('value', handler);
}

export async function setChatBlocked(
  myUid: string,
  pairId: string,
  blocked: boolean
): Promise<void> {
  await dbRef(`chats/${pairId}/blocked/${myUid}`).set(blocked ? true : null);
}

/**
 * Chat vollständig löschen (beide Seiten verlieren den Verlauf).
 * Reihenfolge ist wichtig: die Index-Einträge brauchen laut Rules noch die
 * participants — deshalb erst Indizes, dann der Chat-Knoten selbst.
 */
export async function deleteChat(myUid: string, pairId: string): Promise<void> {
  const otherUid = otherUidFromPairId(pairId, myUid);
  if (otherUid) {
    await dbRef(`chatIndex/${otherUid}/${pairId}`)
      .set(null)
      .catch(() => {});
  }
  await dbRef(`chatIndex/${myUid}/${pairId}`)
    .set(null)
    .catch(() => {});
  await dbRef(`chats/${pairId}`).set(null);
  await dbRef(userPath(myUid, 'chatState', pairId))
    .set(null)
    .catch(() => {});
  // Bilder des Chats aus dem Storage entsorgen (DSGVO-Löschkette)
  try {
    const folder = firebase.storage().ref(`chat-images/${pairId}`);
    const listing = await folder.listAll();
    await Promise.all(listing.items.map((item) => item.delete().catch(() => {})));
  } catch {
    /* best-effort — der Backend-Cron räumt Reste ab */
  }
}

/**
 * Meldung an die Moderation: Auszug der Nachrichten des Gegenübers (+ eigener
 * Kontext) geht an chatReports und als Benachrichtigung an den Admin. Inhalte
 * privater Chats werden NUR auf diesem Weg — durch die meldende Person —
 * zugänglich gemacht.
 */
export async function reportChat(
  reporter: { uid: string; name: string },
  reportedUid: string,
  reportedName: string,
  pairId: string,
  messages: ChatMessage[]
): Promise<void> {
  const recent = messages.slice(-30);
  const excerpt = recent
    .map((m) => {
      const who = m.senderId === reporter.uid ? reporter.name : reportedName;
      const content = m.imageUrl
        ? `[Bild] ${m.imageUrl}`
        : m.stickerId
          ? `[Sticker ${m.stickerId}]`
          : m.text;
      return `${who}: ${content}`;
    })
    .join('\n')
    .slice(0, 5500);

  const ts = Date.now();
  await dbRef('chatReports').push({
    reporterId: reporter.uid,
    reporterName: reporter.name.slice(0, 200),
    reportedId: reportedUid,
    pairId,
    text: excerpt,
    ts,
  });

  await dbRef(userPath(ADMIN_UID, 'notifications'))
    .push({
      type: 'moderation_flag',
      title: 'Chat-Meldung',
      message: `${reporter.name} meldet ${reportedName}. Auszug:\n${excerpt.slice(0, 1800)}`,
      timestamp: ts,
      read: false,
    })
    .catch(() => {});

  void queuePush(ADMIN_UID, {
    title: 'Chat-Meldung',
    body: `${reporter.name} meldet ${reportedName}`,
    url: '/admin?tab=moderation',
  });
}
