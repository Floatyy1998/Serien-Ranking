/**
 * `.on('value')` mit Fehler-Callback.
 *
 * Ohne dritten Parameter meldet das Firebase-SDK einen `permission_denied` als
 * unbehandelten Fehler — und der haeufigste Fall dahinter ist keine echte
 * Regelverletzung, sondern die Sekunde, in der der ID-Token erneuert wird und
 * die Verbindung kurz ohne Auth dasteht. Der Listener bleibt danach tot, die
 * Ansicht friert bis zum Reload ein.
 *
 * Deshalb: Fehler abfangen, bei `permission_denied` genau einmal neu
 * anhaengen. Bleibt es dabei, ist es eine echte Regelverletzung — dann nur
 * noch eine Warnung, kein Absturz.
 */

import type firebase from 'firebase/compat/app';

type Snapshot = firebase.database.DataSnapshot;
type Ziel = firebase.database.Reference | firebase.database.Query;

const NEUVERSUCH_MS = 2500;

export function subscribeValue(
  ref: Ziel,
  handler: (snap: Snapshot) => void,
  options: { label?: string; retryMs?: number } = {}
): () => void {
  const { label = 'value', retryMs = NEUVERSUCH_MS } = options;
  let aktiv = true;
  let neuVersucht = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const anhaengen = () => {
    if (!aktiv) return;
    ref.on('value', handler, (error: Error) => {
      if (!aktiv) return;
      const abgelehnt = /permission[_ ]denied/i.test(error?.message ?? '');
      if (abgelehnt && !neuVersucht) {
        neuVersucht = true;
        timer = setTimeout(anhaengen, retryMs);
        return;
      }
      console.warn(`[db] ${label}: ${error?.message ?? 'unbekannter Listener-Fehler'}`);
    });
  };

  anhaengen();

  return () => {
    aktiv = false;
    if (timer) clearTimeout(timer);
    ref.off('value', handler);
  };
}

/**
 * Wie `ref.on('value', handler)` — inklusive Fehler-Callback und einmaligem
 * Neuversuch, gibt aber wie das Original den Handler zurueck. Damit bleiben
 * bestehende `ref.off('value', handler)`-Aufraeumpfade unveraendert; der
 * Umstieg ist eine Zeile je Aufrufstelle.
 */
export function onValue<H extends (snap: Snapshot) => void>(
  ref: Ziel,
  handler: H,
  labelOderOptionen?: string | { label?: string; onError?: (error: Error) => void }
): H {
  const optionen =
    typeof labelOderOptionen === 'string'
      ? { label: labelOderOptionen }
      : (labelOderOptionen ?? {});
  let neuVersucht = false;

  const anhaengen = () => {
    ref.on('value', handler, (error: Error) => {
      const abgelehnt = /permission[_ ]denied/i.test(error?.message ?? '');
      if (abgelehnt && !neuVersucht) {
        neuVersucht = true;
        setTimeout(anhaengen, NEUVERSUCH_MS);
        return;
      }
      // Eigene Fehlerbehandlung der Aufrufstelle hat Vorrang (Offline-Fallback,
      // Cache, leere Anzeige) — sonst bleibt es bei einer Warnung.
      if (optionen.onError) {
        optionen.onError(error);
        return;
      }
      console.warn(
        `[db] ${optionen.label ?? pfadVon(ref)}: ${error?.message ?? 'Listener-Fehler'}`
      );
    });
  };

  anhaengen();
  return handler;
}

/** Pfad statt voller URL — sonst steht der halbe Datenbank-Host im Log. */
function pfadVon(ref: Ziel): string {
  try {
    return new URL(ref.toString()).pathname || 'value';
  } catch {
    return 'value';
  }
}
