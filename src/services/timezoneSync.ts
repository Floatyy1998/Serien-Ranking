import { dbRef, userPath } from './db/ref';

/**
 * Spiegelt die IANA-Zeitzone des Geraets nach users/$uid/timezone. Der
 * Backend-Cron stellt die App-Icon-Zahl damit am lokalen Tageswechsel des
 * Nutzers um statt an Berlins. Laeuft bei jedem App-Start, damit ein Umzug
 * oder eine Reise mitgenommen wird. Best-effort, schreibt nur bei Aenderung.
 */
export async function syncTimezoneToProfile(uid: string): Promise<void> {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const ref = dbRef(userPath(uid, 'timezone'));
    const current = (await ref.once('value')).val();
    if (current !== tz) await ref.set(tz);
  } catch {
    /* best effort — der Cron faellt sonst auf Europe/Berlin zurueck */
  }
}
