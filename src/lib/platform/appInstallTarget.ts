/**
 * Erkennung, ob der Besucher im mobilen Browser (ohne installierte App)
 * unterwegs ist, und welcher Store passt. Gemeinsame Quelle für das
 * AppInstallBanner und die Store-Buttons auf öffentlichen Seiten.
 */

// Numerische App-Store-ID ("Apple ID" der App aus App Store Connect →
// App-Informationen). Solange leer, gibt es auf iOS kein Ziel (kein kaputter
// Link); Android funktioniert sofort über das Paket.
// Wird auch für den Bewertungs-Dialog gebraucht (services/appReview.ts).
export const APPSTORE_APP_ID = '6791198226';
export const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=de.tvrank.app';
export const IOS_STORE_URL = APPSTORE_APP_ID
  ? `https://apps.apple.com/app/id${APPSTORE_APP_ID}`
  : '';

export type MobileOS = 'ios' | 'android' | null;

export interface AppInstallTarget {
  os: MobileOS;
  url: string;
}

const isIOSUserAgent = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPadOS meldet sich als Mac — nur die Touch-Punkte verraten es.
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

/**
 * Store-Seite zum Gerät, ohne die Ausschlüsse des Install-Banners (läuft also
 * auch in der installierten PWA). Für Links, die immer ein Ziel brauchen.
 */
export function storeUrlForDevice(): string {
  return isIOSUserAgent() && IOS_STORE_URL ? IOS_STORE_URL : ANDROID_STORE_URL;
}

export function detectAppInstallTarget(): AppInstallTarget {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { os: null, url: '' };
  }
  const ua = navigator.userAgent || '';

  // Läuft bereits nativ (Capacitor) / als Desktop-Shell (Electron) / als
  // installierte PWA (Homescreen) → kein Install-Hinweis nötig.
  const isNative = !!(
    window as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();
  const isElectron = /electron/i.test(ua);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (isNative || isElectron || isStandalone) return { os: null, url: '' };

  const isIOS = isIOSUserAgent();
  const isAndroid = /android/i.test(ua);

  if (isAndroid) return { os: 'android', url: ANDROID_STORE_URL };
  if (isIOS && IOS_STORE_URL) return { os: 'ios', url: IOS_STORE_URL };
  return { os: null, url: '' };
}
