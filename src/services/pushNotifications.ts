/**
 * Nativer Push (FCM/APNs) über die Capacitor-Hülle. Läuft nur in den
 * iOS/Android-Apps — im Browser komplett No-op (guarded über window.Capacitor,
 * keine @capacitor/*-Imports). Der Geräte-Token landet unter
 * users/$uid/fcmTokens/{key}; der Backend-Sender liest ihn dort.
 */
import { dbRef, serverTimestamp, userPath } from './db/ref';

interface PushPlugin {
  requestPermissions?: () => Promise<{ receive: 'granted' | 'denied' | 'prompt' }>;
  checkPermissions?: () => Promise<{ receive: 'granted' | 'denied' | 'prompt' }>;
  register?: () => Promise<void>;
  addListener?: (event: string, handler: (data: never) => void) => Promise<unknown>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  isPluginAvailable?: (name: string) => boolean;
  Plugins?: { PushNotifications?: PushPlugin };
}

const ENABLED_KEY = 'nativePushEnabled';
const TOKEN_KEY = 'nativePushToken';

const getPlugin = (): { plugin: PushPlugin; platform: string } | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  if (cap.isPluginAvailable && !cap.isPluginAvailable('PushNotifications')) return null;
  const plugin = cap.Plugins?.PushNotifications;
  return plugin ? { plugin, platform: cap.getPlatform?.() ?? 'unknown' } : null;
};

/** True, wenn die App nativ läuft UND die Hülle das Push-Plugin mitbringt. */
export const isNativePushAvailable = (): boolean => getPlugin() !== null;

/** RTDB-Keys dürfen kein `.#$[]/` enthalten — FCM-Tokens theoretisch schon. */
const tokenKey = (token: string): string => token.replace(/[.#$[\]/]/g, '_');

const saveToken = async (uid: string, token: string, platform: string): Promise<void> => {
  try {
    await dbRef(userPath(uid, 'fcmTokens', tokenKey(token))).set({
      t: token,
      p: platform,
      ts: serverTimestamp(),
    });
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* best effort */
  }
};

let listenersBound = false;

const bindListeners = (uid: string): void => {
  const entry = getPlugin();
  if (!entry || listenersBound) return;
  listenersBound = true;

  entry.plugin.addListener?.('registration', (data: { value?: string }) => {
    if (data?.value) void saveToken(uid, data.value, entry.platform);
  });

  // Tap auf die Notification: optionaler Deep-Link aus data.url.
  entry.plugin.addListener?.(
    'pushNotificationActionPerformed',
    (action: { notification?: { data?: { url?: string } } }) => {
      const url = action?.notification?.data?.url;
      if (url && url.startsWith('/')) window.location.assign(url);
    }
  );
};

/** Fragt die Berechtigung an, registriert das Gerät und speichert den Token. */
export const enableNativePush = async (uid: string): Promise<boolean> => {
  const entry = getPlugin();
  if (!entry) return false;
  try {
    const perm = await entry.plugin.requestPermissions?.();
    if (perm?.receive !== 'granted') return false;
    bindListeners(uid);
    await entry.plugin.register?.();
    localStorage.setItem(ENABLED_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

/** Entfernt den Token dieses Geräts — es bekommt dann keine Pushes mehr. */
export const disableNativePush = async (uid: string): Promise<void> => {
  localStorage.setItem(ENABLED_KEY, '0');
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  try {
    await dbRef(userPath(uid, 'fcmTokens', tokenKey(token))).remove();
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* best effort */
  }
};

export const isNativePushEnabled = (): boolean => {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
};

/** OS-Berechtigungsstatus: 'prompt' = noch nie gefragt, null = kein natives Push. */
export const getNativePushPermission = async (): Promise<
  'granted' | 'denied' | 'prompt' | null
> => {
  const entry = getPlugin();
  if (!entry) return null;
  try {
    const perm = await entry.plugin.checkPermissions?.();
    return perm?.receive ?? null;
  } catch {
    return null;
  }
};

/**
 * Beim App-Start aufrufen (mit eingeloggtem User): re-registriert das Gerät,
 * damit rotierte FCM-Tokens aktuell bleiben. No-op im Browser oder wenn der
 * Nutzer Push nie aktiviert hat.
 */
export const initNativePush = (uid: string): void => {
  const entry = getPlugin();
  if (!entry || !isNativePushEnabled()) return;
  bindListeners(uid);
  entry.plugin
    .checkPermissions?.()
    .then((perm) => {
      if (perm?.receive === 'granted') return entry.plugin.register?.();
    })
    .catch(() => {});
};
