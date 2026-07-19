/**
 * Englisches Wörterbuch: deutscher Quelltext → englische Übersetzung.
 * Pro App-Bereich eine Datei; hier zusammengeführt. Fehlende Einträge
 * fallen automatisch auf Deutsch zurück (services/i18n.ts).
 */

import analytics from './analytics';
import badges from './badges';
import browse from './browse';
import browse2 from './browse2';
import components from './components';
import detail from './detail';
import home from './home';
import manga from './manga';
import misc from './misc';
import native from './native';
import onboarding from './onboarding';
import pets from './pets';
import settings from './settings';
import social from './social';

const en: Record<string, string> = {
  ...analytics,
  ...badges,
  ...browse,
  ...browse2,
  ...components,
  ...detail,
  ...home,
  ...manga,
  ...misc,
  ...native,
  ...onboarding,
  ...pets,
  ...settings,
  ...social,
};

export default en;
