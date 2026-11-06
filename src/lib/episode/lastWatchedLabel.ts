import { t } from '../../services/i18n';

/** „Vor 3 Tagen gesehen" usw. — null bei fehlendem oder kaputtem Zeitstempel. */
export function formatLastWatched(lastWatchedAt: string, now = Date.now()): string | null {
  if (!lastWatchedAt) return null;
  const then = new Date(lastWatchedAt).getTime();
  if (isNaN(then)) return null;
  const diffMins = Math.floor((now - then) / 60000);
  if (diffMins < 60) return t('Gerade eben gesehen');
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t('Vor {n}h gesehen', { n: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return t('Gestern gesehen');
  if (diffDays < 7) return t('Vor {n} Tagen gesehen', { n: diffDays });
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return t('Vor 1 Woche gesehen');
  if (diffDays < 30) return t('Vor {n} Wochen gesehen', { n: diffWeeks });
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return t('Vor 1 Monat gesehen');
  return t('Vor {n} Monaten gesehen', { n: diffMonths });
}
