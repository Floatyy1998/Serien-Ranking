export * from './date.utils';
export * from './episodeDate.utils';

/**
 * Format total minutes into a compact German time string.
 * Example: 525600 → "1J 3T 2S 30Min"
 * Units: J=Jahre, M=Monate, T=Tage, S=Stunden, Min=Minuten
 */
export const formatMinutesToString = (totalMinutes: number): string => {
  const y = Math.floor(totalMinutes / (365 * 24 * 60));
  const remainingAfterY = totalMinutes % (365 * 24 * 60);
  const m = Math.floor(remainingAfterY / (30 * 24 * 60));
  const remainingAfterM = remainingAfterY % (30 * 24 * 60);
  const d = Math.floor(remainingAfterM / 1440);
  const h = Math.floor((remainingAfterM % 1440) / 60);
  const min = Math.floor(remainingAfterM % 60);

  let str = '';
  if (y > 0) str += `${y}J `;
  if (m > 0) str += `${m}M `;
  if (d > 0) str += `${d}T `;
  if (h > 0) str += `${h}S `;
  if (min > 0) str += `${min}Min`;
  return str.trim() || '0Min';
};
