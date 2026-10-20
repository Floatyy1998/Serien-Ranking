import type { RankingCategory } from '../../types/Leaderboard';
import { formatMinutesToString } from '../../lib/date';

/** Gesamt-Watchtime im selben Format wie das eigene Profil („2M 7T 3S"). */
export function formatTotalWatchtime(minutes: number): string {
  return formatMinutesToString(minutes, 3);
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
