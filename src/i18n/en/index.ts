/**
 * Englisches Wörterbuch: deutscher Quelltext → englische Übersetzung.
 * Pro App-Bereich eine Datei; hier zusammengeführt. Fehlende Einträge
 * fallen automatisch auf Deutsch zurück (services/i18n.ts).
 */

import settings from './settings';

const en: Record<string, string> = {
  ...settings,
};

export default en;
