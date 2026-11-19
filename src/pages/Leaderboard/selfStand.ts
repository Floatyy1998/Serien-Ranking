import type { LeaderboardEntry } from '../../types/Leaderboard';

export interface SelfStand {
  rank: number;
  of: number;
  value: number;
  /** Person direkt vor einem — null, wenn man selbst vorne steht. */
  aheadName: string | null;
  /** Abstand nach vorn, bzw. Vorsprung auf Platz 2, wenn man fuehrt. */
  gap: number;
  isLeader: boolean;
}

export function computeSelfStand(entries: LeaderboardEntry[]): SelfStand | null {
  const index = entries.findIndex((entry) => entry.isCurrentUser);
  if (index === -1) return null;

  const self = entries[index];
  const ahead = index > 0 ? entries[index - 1] : null;
  const runnerUp = entries.length > 1 ? entries[1] : null;

  return {
    rank: self.rank,
    of: entries.length,
    value: self.value,
    aheadName: ahead ? ahead.displayName : null,
    gap: ahead ? ahead.value - self.value : runnerUp ? self.value - runnerUp.value : 0,
    isLeader: !ahead,
  };
}
