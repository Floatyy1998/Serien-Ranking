import { dbGet, dbRef, dbUpdate, userPath } from '../db/ref';

export const DEFAULT_INACTIVE_THRESHOLD_DAYS = 30;
/** Erlaubte Optionen für das UI. `0` = "aus" (keine Inactive-Notifications). */
export const INACTIVE_THRESHOLD_OPTIONS = [0, 14, 30, 60, 90] as const;
export type InactiveThresholdOption = (typeof INACTIVE_THRESHOLD_OPTIONS)[number];

export const DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED = true;

interface NotificationSettings {
  inactiveThresholdDays?: number;
  providerNotificationsEnabled?: boolean;
}

const cache = new Map<string, { value: NotificationSettings; loadedAt: number }>();
const CACHE_TTL = 60 * 1000; // 1 Min: Detection läuft sowieso nur selten

const load = async (userId: string): Promise<NotificationSettings> => {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) return cached.value;
  try {
    const value =
      (await dbGet<NotificationSettings>(userPath(userId, 'notificationSettings'))) || {};
    cache.set(userId, { value, loadedAt: Date.now() });
    return value;
  } catch {
    return {};
  }
};

const invalidate = (userId: string) => {
  cache.delete(userId);
};

const isValidThreshold = (v: unknown): v is InactiveThresholdOption =>
  typeof v === 'number' && (INACTIVE_THRESHOLD_OPTIONS as readonly number[]).includes(v);

export const getInactiveThresholdDays = async (userId: string): Promise<number> => {
  const settings = await load(userId);
  return isValidThreshold(settings.inactiveThresholdDays)
    ? settings.inactiveThresholdDays
    : DEFAULT_INACTIVE_THRESHOLD_DAYS;
};

export const setInactiveThresholdDays = async (
  userId: string,
  days: InactiveThresholdOption
): Promise<void> => {
  await dbRef(userPath(userId, 'notificationSettings', 'inactiveThresholdDays')).set(days);
  invalidate(userId);
};

export const getProviderNotificationsEnabled = async (userId: string): Promise<boolean> => {
  const settings = await load(userId);
  return typeof settings.providerNotificationsEnabled === 'boolean'
    ? settings.providerNotificationsEnabled
    : DEFAULT_PROVIDER_NOTIFICATIONS_ENABLED;
};

export const setProviderNotificationsEnabled = async (
  userId: string,
  enabled: boolean
): Promise<void> => {
  await dbRef(userPath(userId, 'notificationSettings', 'providerNotificationsEnabled')).set(
    enabled
  );
  invalidate(userId);
};

// ─────────────────────────────────────────────────────────────────────────────
// Snooze — "Erinnere mich später" (kürzer als Dismiss)
// Eine zentrale Tabelle, damit alle Notification-Typen denselben Mechanismus
// nutzen. Pfad: users/{uid}/notificationSnooze/{category}/{seriesId} = epoch ms
// (= snoozeUntil). Detection-Pipelines lesen den Wert beim Lauf.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'inactive'
  | 'inactive-rewatch'
  | 'completed'
  | 'unrated'
  | 'new-season'
  | 'provider'
  | 'animeManga';

export const SNOOZE_OPTIONS = [1, 7, 30] as const;
export type SnoozeOption = (typeof SNOOZE_OPTIONS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export const snoozeLabel = (days: SnoozeOption): string => {
  if (days === 1) return '1 Tag';
  if (days === 7) return '1 Woche';
  return '1 Monat';
};

export const snoozeNotifications = async (
  category: NotificationCategory,
  seriesIds: number[],
  userId: string,
  days: SnoozeOption
): Promise<void> => {
  if (seriesIds.length === 0) return;
  const until = Date.now() + days * DAY_MS;
  const updates: Record<string, number> = {};
  for (const id of seriesIds) {
    updates[userPath(userId, 'notificationSnooze', category, id)] = until;
  }
  try {
    await dbUpdate(updates);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Snooze] Failed to snooze ${category}: ${message}`);
  }
};

export const getSnoozedUntil = async (
  category: NotificationCategory,
  userId: string
): Promise<Record<string, number>> => {
  try {
    return (
      (await dbGet<Record<string, number>>(userPath(userId, 'notificationSnooze', category))) || {}
    );
  } catch {
    return {};
  }
};

/**
 * Cleanup: entferne abgelaufene Snooze-Einträge und solche für Serien außerhalb
 * der `validIds`-Menge. Wird optional von den Detections gerufen, damit die
 * Tabelle nicht wuchert.
 */
export const cleanupSnoozes = async (
  category: NotificationCategory,
  userId: string,
  validIds: Set<string>
): Promise<void> => {
  const current = await getSnoozedUntil(category, userId);
  const now = Date.now();
  const updates: Record<string, null> = {};
  for (const [id, until] of Object.entries(current)) {
    if (until < now || !validIds.has(id)) {
      updates[userPath(userId, 'notificationSnooze', category, id)] = null;
    }
  }
  if (Object.keys(updates).length === 0) return;
  try {
    await dbUpdate(updates);
  } catch {
    // best-effort cleanup
  }
};
