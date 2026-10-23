// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { captureErrorMock } = vi.hoisted(() => ({ captureErrorMock: vi.fn() }));
vi.mock('./errorReporter', () => ({ captureError: captureErrorMock }));

import {
  beginAuthDiagnostics,
  markManualSignOut,
  probeFirebaseIdb,
  trackAuthEvent,
} from './authDiagnostics';

function stubFirebaseIdb(keys: string[] | 'ohne-store' | 'fehlt') {
  vi.stubGlobal('indexedDB', {
    open: () => {
      const request: Record<string, unknown> = { transaction: { abort: vi.fn() } };
      queueMicrotask(() => {
        if (keys === 'fehlt') {
          (request.onupgradeneeded as () => void)();
          return;
        }
        request.result = {
          close: vi.fn(),
          objectStoreNames: { contains: () => keys !== 'ohne-store' },
          transaction: () => ({
            objectStore: () => ({
              getAllKeys: () => {
                const all: Record<string, unknown> = { result: keys };
                queueMicrotask(() => (all.onsuccess as () => void)());
                return all;
              },
            }),
          }),
        };
        (request.onsuccess as () => void)();
      });
      return request;
    },
  });
}

const user = (creationTime: string) =>
  ({ uid: 'u1', metadata: { creationTime } }) as unknown as Parameters<typeof trackAuthEvent>[0];

const OLD = 'Wed, 16 Sep 2026 15:54:07 GMT';

describe('authDiagnostics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T17:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    captureErrorMock.mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('meldet keinen Neu-Login nach bewusstem Abmelden', async () => {
    beginAuthDiagnostics(true);
    trackAuthEvent(user(OLD));
    markManualSignOut();
    trackAuthEvent(null);
    beginAuthDiagnostics(false);
    trackAuthEvent(null);
    trackAuthEvent(user(OLD));
    await vi.advanceTimersByTimeAsync(10);
    expect(captureErrorMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('authLastExit')).toBeNull();
  });

  it('nennt den Sitzungsverlust aus einem früheren Start', async () => {
    beginAuthDiagnostics(true);
    trackAuthEvent(null);
    vi.advanceTimersByTime(3 * 3_600_000);
    beginAuthDiagnostics(false);
    trackAuthEvent(null);
    trackAuthEvent(user(OLD));
    await vi.waitFor(() =>
      expect(captureErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthRelogin',
          message: expect.stringContaining('zuvor: beim Start vor 3 h'),
        })
      )
    );
  });

  it('merkt sich ein Abmelden mitten in der Sitzung', () => {
    beginAuthDiagnostics(true);
    trackAuthEvent(user(OLD));
    trackAuthEvent(null);
    expect(JSON.parse(localStorage.getItem('authLastExit') || '{}').how).toBe('in Sitzung');
  });

  it('meldet den Neu-Login eines Bestandskontos nach abgemeldetem Start', async () => {
    beginAuthDiagnostics(true);
    trackAuthEvent(null);
    trackAuthEvent(user(OLD));
    await vi.waitFor(() =>
      expect(captureErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AuthRelogin',
          message: expect.stringContaining('cachedUser: ja'),
        })
      )
    );
  });

  it('meldet den ersten Login eines neuen Kontos nicht', async () => {
    beginAuthDiagnostics(false);
    trackAuthEvent(null);
    trackAuthEvent(user('Tue, 20 Oct 2026 16:00:00 GMT'));
    await Promise.resolve();
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it('meldet einen langsamen Start mit Sitzung', () => {
    beginAuthDiagnostics(true);
    vi.advanceTimersByTime(7000);
    trackAuthEvent(user(OLD));
    expect(captureErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'AuthSlowStart' })
    );
  });

  it('meldet keinen langsamen Start, wenn die App zwischendurch im Hintergrund war', () => {
    beginAuthDiagnostics(true);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(7000);
    trackAuthEvent(user(OLD));
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it('bleibt bei schnellem Start mit Sitzung still', () => {
    beginAuthDiagnostics(true);
    vi.advanceTimersByTime(800);
    trackAuthEvent(user(OLD));
    expect(captureErrorMock).not.toHaveBeenCalled();
  });

  it('erkennt einen noch gespeicherten Firebase-Login', async () => {
    stubFirebaseIdb(['firebase:authUser:key:[DEFAULT]']);
    await expect(probeFirebaseIdb()).resolves.toBe('user');
    stubFirebaseIdb(['__sak']);
    await expect(probeFirebaseIdb()).resolves.toBe('leer');
    stubFirebaseIdb('ohne-store');
    await expect(probeFirebaseIdb()).resolves.toBe('leer');
    stubFirebaseIdb('fehlt');
    await expect(probeFirebaseIdb()).resolves.toBe('fehlt');
  });

  it('meldet einen Fehler, wenn IndexedDB fehlt', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(probeFirebaseIdb()).resolves.toBe('fehler');
  });

  it('lädt einmal neu, wenn Firebase einen gespeicherten Login nicht lesen konnte', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    stubFirebaseIdb(['firebase:authUser:key:[DEFAULT]']);
    beginAuthDiagnostics(true);
    trackAuthEvent(null);
    await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));

    beginAuthDiagnostics(true);
    trackAuthEvent(null);
    await vi.advanceTimersByTimeAsync(10);
    expect(reload).toHaveBeenCalledTimes(1);

    beginAuthDiagnostics(true);
    trackAuthEvent(user(OLD));
    expect(captureErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'AuthIdbRecovered' })
    );
    expect(sessionStorage.getItem('authIdbRetry')).toBeNull();
  });

  it('lädt nicht neu, wenn der Login wirklich weg ist', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    stubFirebaseIdb([]);
    beginAuthDiagnostics(true);
    trackAuthEvent(null);
    await vi.advanceTimersByTimeAsync(10);
    expect(reload).not.toHaveBeenCalled();
  });
});
