// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  apps: [] as unknown[],
  initializeApp: vi.fn(),
  initializeAuth: vi.fn(),
  auth: { languageCode: '' },
}));

vi.mock('../i18n', () => ({ appLocale: 'de', t: (s: string) => s }));
vi.mock('firebase/app', () => ({ getApp: () => 'modular-app' }));
vi.mock('firebase/auth', () => ({
  browserLocalPersistence: 'local',
  browserSessionPersistence: 'session',
  debugErrorMap: 'debug-map',
  indexedDBLocalPersistence: 'idb',
  inMemoryPersistence: 'memory',
  initializeAuth: sdk.initializeAuth,
}));
vi.mock('firebase/compat/app', () => ({
  default: {
    get apps() {
      return sdk.apps;
    },
    initializeApp: (config: unknown) => {
      sdk.initializeApp(config);
      sdk.apps.push(config);
    },
    auth: () => sdk.auth,
  },
}));
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));

import { initFirebase } from './initFirebase';

const setCapacitor = (plugins: Record<string, unknown>) => {
  (window as { Capacitor?: unknown }).Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
    Plugins: plugins,
  };
};

describe('initFirebase', () => {
  beforeEach(() => {
    sdk.apps.length = 0;
    sdk.initializeApp.mockReset();
    sdk.initializeAuth.mockReset();
    process.env.VITE_FIREBASE_API_KEY = 'test-key';
    process.env.VITE_FIREBASE_AUTH_DOMAIN = 'tv-rank.de';
    process.env.VITE_FIREBASE_PROJECT_ID = 'serien-ranking';
  });

  afterEach(() => {
    delete (window as { Capacitor?: unknown }).Capacitor;
  });

  it('überlässt Auth im Browser compat (mit Popup/Redirect-Resolver)', () => {
    initFirebase();
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
    expect(sdk.initializeAuth).not.toHaveBeenCalled();
    expect(sdk.auth.languageCode).toBe('de');
  });

  it('initialisiert Auth in der App-Hülle mit nativem Login ohne Resolver', () => {
    setCapacitor({ FirebaseAuthentication: {} });
    initFirebase();
    expect(sdk.initializeAuth).toHaveBeenCalledWith('modular-app', {
      persistence: ['local', 'idb', 'session', 'memory'],
      errorMap: 'debug-map',
    });
  });

  it('behält den Resolver in der App-Hülle ohne Login-Plugin', () => {
    setCapacitor({});
    initFirebase();
    expect(sdk.initializeAuth).not.toHaveBeenCalled();
  });

  it('läuft weiter, wenn initializeAuth wirft', () => {
    setCapacitor({ FirebaseAuthentication: {} });
    sdk.initializeAuth.mockImplementation(() => {
      throw new Error('already-initialized');
    });
    expect(() => initFirebase()).not.toThrow();
  });
});
