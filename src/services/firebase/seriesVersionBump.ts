import { bumpSeriesVersion as bumpViaDb } from '../db/ref';

/**
 * Incrementiert den Versions-Counter für Serien-Daten eines Users.
 * Wird bei jedem Serien-Write aufgerufen, damit andere Geräte wissen
 * dass sich die Daten geändert haben und ein Full-Load nötig ist.
 *
 * Dünner Fire-and-forget-Wrapper um `services/db/ref.bumpSeriesVersion` (S1):
 * behält die `void`-Signatur, damit die ~vielen bestehenden Aufrufer ohne
 * `await` unverändert weiterlaufen.
 */
export function bumpSeriesVersion(uid: string): void {
  void bumpViaDb(uid);
}
