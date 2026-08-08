/**
 * Portugiesisches Wörterbuch: deutscher Quelltext → portugiesische Übersetzung.
 * Brasilianisch geprägt (pt-BR), bedient über den Basis-Code auch Portugal.
 * Pro App-Bereich eine Datei; hier zusammengeführt. Fehlende Einträge fallen
 * über die Kette pt → es → en zurück (services/i18n.ts).
 */

import analytics from './analytics';
import badges from './badges';
import browse from './browse';
import browse2 from './browse2';
import chat from './chat';
import components from './components';
import detail from './detail';
import gapsActivity from './gaps-activity';
import gapsDiscussions from './gaps-discussions';
import gapsErrors from './gaps-errors';
import gapsMisc from './gaps-misc';
import gapsPatchnotes from './gaps-patchnotes';
import gapsWrapped from './gaps-wrapped';
import genres from './genres';
import guest from './guest';
import home from './home';
import manga from './manga';
import misc from './misc';
import native from './native';
import onboarding from './onboarding';
import pets from './pets';
import settings from './settings';
import social from './social';

const pt: Record<string, string> = {
  ...analytics,
  ...badges,
  ...browse,
  ...browse2,
  ...chat,
  ...components,
  ...detail,
  ...gapsActivity,
  ...gapsDiscussions,
  ...gapsErrors,
  ...gapsMisc,
  ...gapsPatchnotes,
  ...gapsWrapped,
  ...genres,
  ...guest,
  ...home,
  ...manga,
  ...misc,
  ...native,
  ...onboarding,
  ...pets,
  ...settings,
  ...social,
};

export default pt;
