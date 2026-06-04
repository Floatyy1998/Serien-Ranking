import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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
    const snapshot = await firebase
      .database()
      .ref(`users/${userId}/notificationSettings`)
      .once('value');
    const value = (snapshot.val() as NotificationSettings | null) || {};
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
  await firebase
    .database()
    .ref(`users/${userId}/notificationSettings/inactiveThresholdDays`)
    .set(days);
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
  await firebase
    .database()
    .ref(`users/${userId}/notificationSettings/providerNotificationsEnabled`)
    .set(enabled);
  invalidate(userId);
};
