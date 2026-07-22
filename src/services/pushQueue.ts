/** Push-Queue: Clients legen Einträge ab, der Backend-Listener (hello.js) verschickt per FCM und löscht. */
import { dbRef, serverTimestamp } from './db/ref';

export const queuePush = async (
  toUid: string,
  push: { title: string; body: string; url?: string; titleEn?: string; bodyEn?: string }
): Promise<void> => {
  try {
    await dbRef('pushQueue').push({
      to: toUid,
      title: push.title.slice(0, 100),
      body: push.body.slice(0, 300),
      // Englische Variante — das Backend wählt nach users/$uid/language
      ...(push.titleEn && { titleEn: push.titleEn.slice(0, 100) }),
      ...(push.bodyEn && { bodyEn: push.bodyEn.slice(0, 300) }),
      url: push.url && push.url.startsWith('/') ? push.url.slice(0, 200) : '/',
      ts: serverTimestamp(),
    });
  } catch {
    /* best effort — Push ist Zusatzkomfort */
  }
};
