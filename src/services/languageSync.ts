import { dbRef, userPath } from './db/ref';
import { appLocale } from './i18n';

/**
 * Spiegelt die aufgeloeste App-Sprache (de/en) nach users/$uid/language.
 * Der Backend-Push-Cron liest das, um Notifications in der Sprache des Nutzers
 * zu bauen (der Server kann navigator/localStorage nicht sehen). Best-effort,
 * schreibt nur bei Aenderung.
 */
export async function syncAppLanguageToProfile(uid: string): Promise<void> {
  try {
    const ref = dbRef(userPath(uid, 'language'));
    const current = (await ref.once('value')).val();
    if (current !== appLocale) await ref.set(appLocale);
  } catch {
    /* best effort — Push faellt sonst nur auf die Default-Sprache zurueck */
  }
}
