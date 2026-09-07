// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANDROID_STORE_URL,
  APPSTORE_APP_ID,
  IOS_STORE_URL,
  detectAppInstallTarget,
  storeUrlForDevice,
} from './appInstallTarget';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/** Stellt navigator und die PWA-/Shell-Erkennung auf einen definierten Stand. */
function stubEnvironment(
  userAgent: string,
  extras: { platform?: string; maxTouchPoints?: number; standalone?: boolean } = {},
  windowExtras: { standaloneDisplay?: boolean; capacitor?: boolean } = {}
): void {
  vi.stubGlobal('navigator', {
    userAgent,
    platform: extras.platform ?? 'Win32',
    maxTouchPoints: extras.maxTouchPoints ?? 0,
    ...(extras.standalone !== undefined ? { standalone: extras.standalone } : {}),
  });
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: windowExtras.standaloneDisplay === true }),
    ...(windowExtras.capacitor ? { Capacitor: { isNativePlatform: () => true } } : {}),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('Store-Adressen', () => {
  it('kennt eine Apple-ID — ohne sie gäbe es auf iOS kein Ziel', () => {
    expect(APPSTORE_APP_ID).not.toBe('');
    expect(IOS_STORE_URL).toBe(`https://apps.apple.com/app/id${APPSTORE_APP_ID}`);
  });

  it('adressiert Android über den Paketnamen', () => {
    expect(ANDROID_STORE_URL).toContain('id=de.tvrank.app');
  });
});

describe('storeUrlForDevice', () => {
  it('gibt auf dem iPhone den App Store', () => {
    stubEnvironment(IPHONE);
    expect(storeUrlForDevice()).toBe(IOS_STORE_URL);
  });

  it('erkennt iPadOS trotz Mac-Kennung an den Touch-Punkten', () => {
    stubEnvironment(DESKTOP, { platform: 'MacIntel', maxTouchPoints: 5 });
    expect(storeUrlForDevice()).toBe(IOS_STORE_URL);
  });

  it('gibt sonst den Play Store', () => {
    stubEnvironment(ANDROID);
    expect(storeUrlForDevice()).toBe(ANDROID_STORE_URL);
  });

  it('liefert auch am Desktop ein Ziel', () => {
    stubEnvironment(DESKTOP);
    expect(storeUrlForDevice()).toBe(ANDROID_STORE_URL);
  });
});

describe('detectAppInstallTarget', () => {
  it('schlägt auf Android den Play Store vor', () => {
    stubEnvironment(ANDROID);
    expect(detectAppInstallTarget()).toEqual({ os: 'android', url: ANDROID_STORE_URL });
  });

  it('schlägt auf dem iPhone den App Store vor', () => {
    stubEnvironment(IPHONE);
    expect(detectAppInstallTarget()).toEqual({ os: 'ios', url: IOS_STORE_URL });
  });

  it('schweigt am Desktop', () => {
    stubEnvironment(DESKTOP);
    expect(detectAppInstallTarget()).toEqual({ os: null, url: '' });
  });

  it('schweigt in der nativen Hülle', () => {
    stubEnvironment(ANDROID, {}, { capacitor: true });
    expect(detectAppInstallTarget().os).toBeNull();
  });

  it('schweigt in der installierten PWA', () => {
    stubEnvironment(IPHONE, { standalone: true });
    expect(detectAppInstallTarget().os).toBeNull();
  });

  it('schweigt im Standalone-Anzeigemodus', () => {
    stubEnvironment(ANDROID, {}, { standaloneDisplay: true });
    expect(detectAppInstallTarget().os).toBeNull();
  });

  it('schweigt in der Desktop-Hülle', () => {
    stubEnvironment(DESKTOP.replace('AppleWebKit', 'Electron/42.0 AppleWebKit'));
    expect(detectAppInstallTarget().os).toBeNull();
  });
});
