/**
 * Reine Guard-Funktionen des Enhanced-Firebase-Cache-Hooks.
 *
 * Kernidee: transiente Zustände (Netzwerk-Glitch, leerer Snapshot beim
 * Reconnect) dürfen niemals echten User-State überschreiben — Listen dürfen
 * nie kurz "leer" wirken.
 */

/**
 * Klassifiziert eine Fehlermeldung als Netzwerkfehler.
 * Nur bei Netzwerkfehlern fällt der Hook auf den Offline-Cache zurück.
 */
export function isNetworkErrorMessage(errorMessage: string): boolean {
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('NETWORK') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED')
  );
}

/**
 * Ein Snapshot gilt als leer, wenn er nicht existiert ODER keine Kinder hat.
 * (snapshot.val() || {} liefert bei !exists ein leeres Objekt.)
 */
export function isEmptySnapshot(exists: boolean, data: object): boolean {
  return !exists || Object.keys(data).length === 0;
}

/**
 * Bei einem Reconnect-Glitch kann snapshot.val() null sein obwohl der User
 * echte Daten hat → bestehenden State NICHT durch leeres Object ersetzen,
 * sonst wirken alle Episoden plötzlich "ungesehen".
 */
export function shouldKeepPreviousData(isEmpty: boolean, prev: unknown): boolean {
  return Boolean(isEmpty && prev && Object.keys(prev as object).length > 0);
}
