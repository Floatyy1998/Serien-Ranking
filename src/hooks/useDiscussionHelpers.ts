import { ADMIN_UID } from '../config/admin';
import type { LocalizedMap } from '../services/i18n';
import { dbRef, userPath } from '../services/db/ref';
import { queuePush } from '../services/pushQueue';
import type { DiscussionItemType } from '../types/Discussion';

// Helper to generate a unique path for discussions
export const getDiscussionPath = (
  itemType: DiscussionItemType,
  itemId: number,
  seasonNumber?: number,
  episodeNumber?: number
): string => {
  if (itemType === 'episode' && seasonNumber !== undefined && episodeNumber !== undefined) {
    return `discussions/episode/${itemId}_s${seasonNumber}_e${episodeNumber}`;
  }
  return `discussions/${itemType}/${itemId}`;
};

// Helper to send notification to another user.
// title/message sind die deutschen Quelltexte, titleL/messageL die Übersetzungen
// je Sprache — Anzeige und Push-Versand wählen nach Empfänger-Sprache.
// Nie t() benutzen: das wäre die Sprache des ABSENDERS.
export const sendNotificationToUser = async (
  targetUserId: string,
  notification: {
    type:
      | 'discussion_reply'
      | 'discussion_like'
      | 'spoiler_flag'
      | 'bug_ticket_reply'
      | 'bug_ticket_status'
      | 'moderation_ban';
    title: string;
    message: string;
    titleL?: LocalizedMap;
    messageL?: LocalizedMap;
    data?: Record<string, unknown>;
  }
) => {
  try {
    const { titleL, messageL, ...base } = notification;
    // Firebase lehnt JEDEN Push ab, der irgendwo `undefined` enthaelt — und
    // zwar den ganzen, nicht nur das Feld. Die Aufrufer reichen optionale
    // Felder wie seasonNumber/episodeNumber unbesehen durch; bei einer
    // Serien- oder Film-Diskussion sind die undefined. Das hat hier jede
    // Diskussions-Benachrichtigung verschluckt: kein Eintrag in der Glocke,
    // kein nativer Push, nur ein console.error im catch unten.
    const ohneUndefined = <T>(wert: T): T => {
      if (Array.isArray(wert)) {
        return wert.filter((e) => e !== undefined).map((e) => ohneUndefined(e)) as unknown as T;
      }
      if (wert && typeof wert === 'object') {
        const raus: Record<string, unknown> = {};
        for (const [schluessel, v] of Object.entries(wert as Record<string, unknown>)) {
          if (v === undefined) continue;
          raus[schluessel] = ohneUndefined(v);
        }
        return raus as T;
      }
      return wert;
    };
    const cap = (map: LocalizedMap | undefined, max: number): LocalizedMap | undefined => {
      if (!map) return undefined;
      const out: LocalizedMap = {};
      for (const [locale, value] of Object.entries(map)) {
        if (value) out[locale as keyof LocalizedMap] = value.slice(0, max);
      }
      return Object.keys(out).length ? out : undefined;
    };
    const cappedTitle = cap(titleL, 500);
    const cappedMessage = cap(messageL, 2000);
    // Rules capen title≤500 / message≤2000 — vorher kürzen, sonst wird der
    // ganze Push mit PERMISSION_DENIED verworfen
    const notificationRef = dbRef(userPath(targetUserId, 'notifications'));
    await notificationRef.push(
      ohneUndefined({
        ...base,
        title: base.title.slice(0, 500),
        message: base.message.slice(0, 2000),
        ...(cappedTitle && { titleL: cappedTitle }),
        ...(cappedMessage && { messageL: cappedMessage }),
        timestamp: Date.now(),
        read: false,
      })
    );
    // Zusätzlich als nativen Push ausliefern (Backend verschickt an die Geräte)
    const url = notification.type.startsWith('bug_ticket')
      ? targetUserId === ADMIN_UID
        ? '/admin'
        : '/bug-report'
      : notification.type === 'moderation_ban'
        ? '/'
        : '/discussions';
    await queuePush(
      targetUserId,
      ohneUndefined({
        title: notification.title,
        body: notification.message,
        ...(cappedTitle && { titleL: cappedTitle }),
        ...(cappedMessage && { bodyL: cappedMessage }),
        url,
      })
    );
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
