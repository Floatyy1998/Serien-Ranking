/**
 * KI-Moderation: neue Community-Inhalte landen als Scan-Auftrag in der
 * moderationQueue; der Backend-Listener (hello.js) lässt Haiku urteilen und
 * legt Verdachtsfälle als Flag ins Admin-Dashboard. Best-effort — ein
 * fehlgeschlagener Scan blockiert nie das Posten.
 */
import { dbRef, serverTimestamp } from '../db/ref';

export type ModerationKind = 'discussion' | 'reply' | 'ticket' | 'ticket_comment';

export const queueModerationScan = async (scan: {
  kind: ModerationKind;
  /** Voller RTDB-Pfad des Inhalts (für Löschen aus dem Admin-Dashboard). */
  path: string;
  /** Bei Antworten: Pfad der zugehörigen Diskussion (für den Kontext-Sprung). */
  contextPath?: string;
  text: string;
  title?: string;
  userId: string;
  username: string;
}): Promise<void> => {
  try {
    await dbRef('moderationQueue').push({
      kind: scan.kind,
      path: scan.path.slice(0, 500),
      ...(scan.contextPath && { contextPath: scan.contextPath.slice(0, 500) }),
      text: scan.text.slice(0, 6000),
      ...(scan.title && { title: scan.title.slice(0, 500) }),
      userId: scan.userId,
      username: scan.username.slice(0, 200),
      ts: serverTimestamp(),
    });
  } catch {
    /* best effort */
  }
};
