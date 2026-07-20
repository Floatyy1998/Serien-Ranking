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
import gapsActivity from './gaps-activity';
import gapsDiscussions from './gaps-discussions';
import gapsErrors from './gaps-errors';
import gapsMisc from './gaps-misc';
import gapsPatchnotes from './gaps-patchnotes';
import gapsWrapped from './gaps-wrapped';
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
  ...gapsActivity,
  ...gapsDiscussions,
  ...gapsErrors,
  ...gapsMisc,
  ...gapsPatchnotes,
  ...gapsWrapped,
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
