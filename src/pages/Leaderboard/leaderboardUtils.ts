import type { RankingCategory } from '../../types/Leaderboard';
import { t } from '../../services/i18n';

/** Kompakte Gesamt-Watchtime („25 T 4 Std") — Monatswerte bleiben bei h/m,
 *  aber ueber Jahre gesammelte Minuten sind als „604h" unlesbar. */
export function formatTotalWatchtime(minutes: number): string {
  if (minutes < 60) return `${minutes} ${t('Min')}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const restMinutes = minutes % 60;
    return restMinutes > 0
      ? `${hours} ${t('Std')} ${restMinutes} ${t('Min')}`
      : `${hours} ${t('Std')}`;
  }

  const days = Math.floor(hours / 24);
  if (days < 365) {
    const restHours = hours % 24;
    return restHours > 0 ? `${days} ${t('T')} ${restHours} ${t('Std')}` : `${days} ${t('T')}`;
  }

  const years = Math.floor(days / 365);
  const restDays = days % 365;
  return restDays > 0 ? `${years} ${t('J')} ${restDays} ${t('T')}` : `${years} ${t('J')}`;
}

export function formatValue(value: number, category: RankingCategory): string {
  if (category === 'watchtimeMinutes') {
    return formatTotalWatchtime(value);
  }
  if (category === 'watchtimeThisMonth') {
    if (value >= 60) {
      const h = Math.floor(value / 60);
      const m = value % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${value}m`;
  }
  return String(value);
}
