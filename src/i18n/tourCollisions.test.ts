import { describe, expect, it } from 'vitest';
import enTour from './en/tour';
import esTour from './es/tour';
import frTour from './fr/tour';
import ptTour from './pt/tour';

import enSettings from './en/settings';
import enBrowse from './en/browse';
import enBrowse2 from './en/browse2';
import enChat from './en/chat';
import enComponents from './en/components';
import enDetail from './en/detail';
import enHome from './en/home';
import enManga from './en/manga';
import enMisc from './en/misc';
import enSocial from './en/social';
import enAnalytics from './en/analytics';
import enBadges from './en/badges';
import enPets from './en/pets';
import enNative from './en/native';
import enOnboarding from './en/onboarding';
import enGuest from './en/guest';
import enGenres from './en/genres';
import enGapsActivity from './en/gaps-activity';
import enGapsDiscussions from './en/gaps-discussions';
import enGapsErrors from './en/gaps-errors';
import enGapsMisc from './en/gaps-misc';
import enGapsPatchnotes from './en/gaps-patchnotes';
import enGapsWrapped from './en/gaps-wrapped';

/**
 * `tour` wird in `<lang>/index.ts` zusammen mit allen anderen Bereichsdateien
 * in ein Objekt gespreadet. Ein Schlüssel, den es dort schon gibt, würde je
 * nach Spread-Reihenfolge eine bestehende Übersetzung still überschreiben oder
 * selbst überschrieben werden — beides fällt sonst niemandem auf.
 */
const OTHER_DICTIONARIES = {
  analytics: enAnalytics,
  badges: enBadges,
  browse: enBrowse,
  browse2: enBrowse2,
  chat: enChat,
  components: enComponents,
  detail: enDetail,
  'gaps-activity': enGapsActivity,
  'gaps-discussions': enGapsDiscussions,
  'gaps-errors': enGapsErrors,
  'gaps-misc': enGapsMisc,
  'gaps-patchnotes': enGapsPatchnotes,
  'gaps-wrapped': enGapsWrapped,
  genres: enGenres,
  guest: enGuest,
  home: enHome,
  manga: enManga,
  misc: enMisc,
  native: enNative,
  onboarding: enOnboarding,
  pets: enPets,
  settings: enSettings,
  social: enSocial,
};

describe('tour-Wörterbuch', () => {
  it('definiert keinen Schlüssel, den eine andere Bereichsdatei schon führt', () => {
    const clashes: string[] = [];
    for (const key of Object.keys(enTour)) {
      for (const [name, dict] of Object.entries(OTHER_DICTIONARIES)) {
        if (key in dict) clashes.push(`${key} (auch in ${name}.ts)`);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('führt in allen Sprachen dieselben Schlüssel', () => {
    const reference = Object.keys(enTour).sort();
    for (const [lang, dict] of Object.entries({ es: esTour, fr: frTour, pt: ptTour })) {
      expect({ lang, keys: Object.keys(dict).sort() }).toEqual({ lang, keys: reference });
    }
  });
});
