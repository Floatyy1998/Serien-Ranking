import { appLocale, t } from '../services/i18n';

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

type TimeInput = string | number | null | undefined;

const dateLocale = () => (appLocale === 'en' ? 'en-US' : 'de-DE');

const toDate = (value: TimeInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Kalendertage zwischen zwei Zeitpunkten — nicht 24-Stunden-Blöcke. */
export const calendarDaysBetween = (from: Date, to: Date): number =>
  Math.round((startOfDay(to) - startOfDay(from)) / DAY);

const timeOf = (d: Date) =>
  d.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' });

/** „Heute, 14:32" · „Gestern, 09:05" · „12.07., 18:04" · „12.07.2025, 18:04" */
export function formatDateTimeLabel(value: TimeInput, now: number = Date.now()): string {
  const d = toDate(value);
  if (!d) return '—';
  const nowDate = new Date(now);
  const days = calendarDaysBetween(d, nowDate);
  const time = timeOf(d);
  if (days <= 0) return `${t('Heute')}, ${time}`;
  if (days === 1) return `${t('Gestern')}, ${time}`;
  const sameYear = d.getFullYear() === nowDate.getFullYear();
  const date = d.toLocaleDateString(
    dateLocale(),
    sameYear
      ? { day: '2-digit', month: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }
  );
  return `${date}, ${time}`;
}

/**
 * „gerade eben" · „vor 5 Min." · „vor 3 Std." · „vor 2 Tagen" · ab 7 Tagen absolutes Datum.
 * Zeitstempel in der Zukunft (Serverzeit vs. Uhr des Clients) werden auf 0 geklemmt.
 */
export function formatAgoLabel(value: TimeInput, now: number = Date.now()): string {
  const d = toDate(value);
  if (!d) return '—';
  const diff = Math.max(0, now - d.getTime());
  if (diff < MINUTE) return t('gerade eben');
  if (diff < HOUR) return t('vor {n} Min.', { n: Math.floor(diff / MINUTE) });
  const hours = Math.floor(diff / HOUR);
  if (hours < 24) return t('vor {n} Std.', { n: hours });
  const days = calendarDaysBetween(d, new Date(now));
  if (days <= 1) return t('vor 1 Tag');
  if (days < 7) return t('vor {n} Tagen', { n: days });
  return formatDateTimeLabel(d.getTime(), now);
}

/** Vollständiger Zeitstempel für Tooltips. */
export function formatExactDateTime(value: TimeInput): string {
  const d = toDate(value);
  return d ? d.toLocaleString(dateLocale()) : '';
}
