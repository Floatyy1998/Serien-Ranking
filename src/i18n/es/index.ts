/**
 * Spanisches Wörterbuch: deutscher Quelltext → Übersetzung.
 * Aufbau wie `i18n/en/` — pro App-Bereich eine Datei, hier zusammengeführt.
 *
 * Fehlende Einträge fallen über die Rückfallkette auf Englisch zurück
 * (siehe `i18n/locales.ts`), erst danach auf den deutschen Quelltext. Ein
 * unvollständiges Wörterbuch kann also nie etwas brechen.
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
import tour from './tour';
import social from './social';

const es: Record<string, string> = {
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
  ...tour,
  ...social,
};

export default es;
