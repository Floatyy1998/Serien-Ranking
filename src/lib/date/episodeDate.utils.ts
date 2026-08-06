/**
 * Einheitliche Episode-Datum Formatierung für konsistente Anzeige.
 * Der Tagesvergleich läuft bewusst über ein festes ISO-Format — er
 * entscheidet nur „gleicher Tag?" und darf nicht von der App-Sprache
 * abhängen; angezeigt wird dann in der Sprache des Nutzers.
 */

import { dateLocale, t } from '../../services/i18n';

const BERLIN_DAY = 'en-CA';

export const getUnifiedEpisodeDate = (date: string | Date): string => {
  if (!date) return '';

  const episodeDate = new Date(date);

  // Prüfe auf ungültiges Datum
  if (isNaN(episodeDate.getTime())) return '';

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Deutsche Zeitzone für konsistente Anzeige, Sprache nach App-Einstellung
  const shown = episodeDate.toLocaleDateString(dateLocale(), {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Heute/Morgen Logic
  const dayKey = (d: Date) => d.toLocaleDateString(BERLIN_DAY, { timeZone: 'Europe/Berlin' });

  if (dayKey(episodeDate) === dayKey(today)) {
    return t('Heute');
  } else if (dayKey(episodeDate) === dayKey(tomorrow)) {
    return t('Morgen');
  }

  return shown;
};
