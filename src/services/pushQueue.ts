/**
 * Warteschlange für native Push-Benachrichtigungen: Clients legen Einträge in
 * pushQueue ab, der Backend-Listener (hello.js) verschickt sie per FCM an die
 * Geräte-Tokens des Empfängers und löscht den Eintrag. Gleiche Vertrauensstufe
 * wie users/$uid/notifications (jeder Auth-User darf benachrichtigen).
 */
import { dbRef, serverTimestamp } from './db/ref';

export const queuePush = async (
  toUid: string,
  push: { title: string; body: string; url?: string }
): Promise<void> => {
  try {
    await dbRef('pushQueue').push({
      to: toUid,
      title: push.title.slice(0, 100),
      body: push.body.slice(0, 300),
      url: push.url && push.url.startsWith('/') ? push.url.slice(0, 200) : '/',
      ts: serverTimestamp(),
    });
  } catch {
    /* best effort — Push ist Zusatzkomfort */
  }
};
