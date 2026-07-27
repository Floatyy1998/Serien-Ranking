/**
 * Dismiss-Queue: meldet dem Backend, dass ein Deep-Link auf DIESEM Gerät
 * gelesen wurde. Der Backend-Listener (hello.js) schickt daraufhin einen
 * stillen Push an die übrigen Geräte des Nutzers, die die zugestellte
 * Notification vom Sperrbildschirm räumen. Das eigene Gerät räumt schon
 * lokal auf (services/pushNotifications.clearDeliveredChatPushes).
 *
 * Nur für eigene Einträge — die Rules erzwingen uid === auth.uid.
 */
import { dbRef, serverTimestamp } from './db/ref';

export const queueDismiss = async (uid: string, url: string): Promise<void> => {
  if (!uid || !url.startsWith('/')) return;
  try {
    await dbRef('dismissQueue').push({
      uid,
      url: url.slice(0, 200),
      ts: serverTimestamp(),
    });
  } catch {
    /* best effort — der Push verschwindet sonst erst beim Antippen */
  }
};
