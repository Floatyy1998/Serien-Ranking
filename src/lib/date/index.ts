import { t } from '../../services/i18n';

export * from './date.utils';
export * from './episodeDate.utils';

/**
 * Format total minutes into a compact time string.
 * Example: 525600 → "1J 3T 2S 30Min"
 * Units: J=Jahre, M=Monate, T=Tage, S=Stunden, Min=Minuten
 * `maxParts` keeps only the largest units ("2M 7T 3S").
 */
export const formatMinutesToString = (totalMinutes: number, maxParts = 5): string => {
  const y = Math.floor(totalMinutes / (365 * 24 * 60));
  const remainingAfterY = totalMinutes % (365 * 24 * 60);
  const m = Math.floor(remainingAfterY / (30 * 24 * 60));
  const remainingAfterM = remainingAfterY % (30 * 24 * 60);
  const d = Math.floor(remainingAfterM / 1440);
  const h = Math.floor((remainingAfterM % 1440) / 60);
  const min = Math.floor(remainingAfterM % 60);

  const parts: string[] = [];
  if (y > 0) parts.push(t('{n}J', { n: y }));
  if (m > 0) parts.push(t('{n}M', { n: m }));
  if (d > 0) parts.push(t('{n}T', { n: d }));
  if (h > 0) parts.push(t('{n}S', { n: h }));
  if (min > 0) parts.push(t('{n}Min', { n: min }));
  return parts.slice(0, maxParts).join(' ') || t('0Min');
};
