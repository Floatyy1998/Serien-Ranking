import type { LeaderboardCategory } from '../../types/Leaderboard';

export function formatValue(value: number, category: LeaderboardCategory): string {
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
