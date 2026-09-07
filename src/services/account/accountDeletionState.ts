/**
 * Merker für eine laufende Konto-Löschung.
 *
 * `users/$uid` zu entfernen reicht nicht: die App läuft während der Löschung
 * weiter, und selbstheilende `value`-Listener feuern durch das Entfernen mit
 * `null` — worauf sie ihren Default zurückschreiben und den Knoten neu anlegen
 * (so blieb `users/$uid/readTimes` stehen). Wer solche Defaults schreibt, muss
 * hier vorher fragen.
 */

let deletingUid: string | null = null;

export function beginAccountDeletion(uid: string): void {
  deletingUid = uid;
}

/** Nur im Fehlerfall aufrufen — nach erfolgreicher Löschung bleibt gesperrt. */
export function endAccountDeletion(): void {
  deletingUid = null;
}

export function isDeletingAccount(uid?: string): boolean {
  if (deletingUid === null) return false;
  return uid === undefined || uid === deletingUid;
}
