import { PET_CONFIG } from '../../services/pet/petConstants';
import { toLocalDateString } from '../../lib/date/date.utils';

export interface WatchStreakData {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string;
  lastShieldUsedDate?: string;
  shieldUsedCount?: number;
}

export interface ActivePetInfo {
  id: string;
  name: string;
  level: number;
  experience: number;
  isAlive: boolean;
}

export type StreakStatus = 'active' | 'at_risk' | 'shieldable' | 'lost';

function getDaysSinceLastWatch(lastWatchDate: string): number {
  if (!lastWatchDate) return Infinity;
  const today = toLocalDateString();
  const todayMs = new Date(today).getTime();
  const lastMs = new Date(lastWatchDate).getTime();
  return Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));
}

export function getStreakStatus(lastWatchDate: string): StreakStatus {
  const daysSince = getDaysSinceLastWatch(lastWatchDate);
  if (daysSince === 0) return 'active';
  if (daysSince === 1) return 'at_risk';
  // shieldable: 2 to (MAX_MISSED_DAYS + 1) days since last watch
  if (daysSince <= PET_CONFIG.STREAK_SHIELD_MAX_MISSED_DAYS + 1) return 'shieldable';
  return 'lost';
}

export function getShieldCooldown(lastShieldUsedDate?: string): {
  onCooldown: boolean;
  daysRemaining: number;
} {
  if (!lastShieldUsedDate) return { onCooldown: false, daysRemaining: 0 };
  const today = toLocalDateString();
  const todayMs = new Date(today).getTime();
  const lastMs = new Date(lastShieldUsedDate).getTime();
  const daysSince = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));
  const daysRemaining = PET_CONFIG.STREAK_SHIELD_COOLDOWN_DAYS - daysSince;
  return { onCooldown: daysRemaining > 0, daysRemaining: Math.max(0, daysRemaining) };
}
