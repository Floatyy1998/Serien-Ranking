import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Firebase-Mock: ref().on(event, success, error) merkt sich die Callbacks,
// ref().off(event, listener) wird gespyt. `on` gibt den success-Callback als
// Listener-Handle zurück (wie firebase/compat).
// ---------------------------------------------------------------------------
type Snapshot = { exists: () => boolean; val: () => unknown };

const fb = vi.hoisted(() => {
  const state: {
    onArgs: {
      event: string;
      success: (s: Snapshot) => Promise<void> | void;
      error: (e: { message?: string; toString?: () => string }) => void;
    } | null;
    throwOnDatabase: boolean;
    throwValue: unknown;
  } = { onArgs: null, throwOnDatabase: false, throwValue: new Error('db init failed') };
  const off = vi.fn();
  const on = vi.fn((event: string, success: (s: Snapshot) => void, error: (e: unknown) => void) => {
    state.onArgs = { event, success, error } as typeof state.onArgs;
    return success;
  });
  return { state, off, on };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => {
      if (fb.state.throwOnDatabase) throw fb.state.throwValue;
      return { ref: () => ({ on: fb.on, off: fb.off }) };
    },
  },
}));
vi.mock('firebase/compat/database', () => ({}));

import { attachRealtimeListener, type RealtimeListenerDeps } from './realtimeListener';

function makeDeps(overrides: Partial<RealtimeListenerDeps<Record<string, unknown>>> = {}) {
  return {
    setData: vi.fn(),
    setLastUpdated: vi.fn(),
    setIsStale: vi.fn(),
    setIsOffline: vi.fn(),
    setError: vi.fn(),
    setLoading: vi.fn(),
    saveToCache: vi.fn(async () => {}),
    loadFromCache: vi.fn(async () => null),
    ...overrides,
  } as unknown as RealtimeListenerDeps<Record<string, unknown>> & {
    setData: ReturnType<typeof vi.fn>;
    setLastUpdated: ReturnType<typeof vi.fn>;
    setIsStale: ReturnType<typeof vi.fn>;
    setIsOffline: ReturnType<typeof vi.fn>;
    setError: ReturnType<typeof vi.fn>;
    setLoading: ReturnType<typeof vi.fn>;
    saveToCache: ReturnType<typeof vi.fn>;
    loadFromCache: ReturnType<typeof vi.fn>;
  };
}

const snap = (exists: boolean, data: unknown = null): Snapshot => ({
  exists: () => exists,
  val: () => data,
});

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

beforeEach(() => {
  fb.state.onArgs = null;
  fb.state.throwOnDatabase = false;
  fb.state.throwValue = new Error('db init failed');
  fb.on.mockClear();
  fb.off.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('attachRealtimeListener — wiring', () => {
  it('registers a value listener on the given path and returns an unsubscribe fn', () => {
    const deps = makeDeps();
    const unsub = attachRealtimeListener('users/u1/series', deps);
    expect(fb.on).toHaveBeenCalledTimes(1);
    expect(fb.on.mock.calls[0][0]).toBe('value');
    expect(typeof unsub).toBe('function');
  });

  it('unsubscribe detaches via ref.off("value", listener)', () => {
    const deps = makeDeps();
    const unsub = attachRealtimeListener('users/u1/series', deps);
    const listener = fb.on.mock.results[0].value; // success cb returned by on()
    unsub?.();
    expect(fb.off).toHaveBeenCalledWith('value', listener);
  });
});

describe('attachRealtimeListener — value snapshots', () => {
  it('populates state + cache from a present snapshot', async () => {
    const deps = makeDeps();
    attachRealtimeListener('users/u1/series', deps);
    await fb.state.onArgs?.success(snap(true, { s1: { rating: 5 } }));

    expect(deps.setData).toHaveBeenCalledWith({ s1: { rating: 5 } });
    expect(deps.setLastUpdated).toHaveBeenCalledWith(expect.any(Number));
    expect(deps.setIsStale).toHaveBeenCalledWith(false);
    expect(deps.setError).toHaveBeenCalledWith(null);
    expect(deps.setIsOffline).toHaveBeenCalledWith(false);
    expect(deps.saveToCache).toHaveBeenCalledWith({ s1: { rating: 5 } });
    expect(deps.setLoading).toHaveBeenCalledWith(false);
  });

  it('ignores a non-existent snapshot (keeps prior state) but clears loading', async () => {
    const deps = makeDeps();
    attachRealtimeListener('users/u1/series', deps);
    await fb.state.onArgs?.success(snap(false));

    expect(deps.setData).not.toHaveBeenCalled();
    expect(deps.saveToCache).not.toHaveBeenCalled();
    expect(deps.setLoading).toHaveBeenCalledWith(false);
  });
});

describe('attachRealtimeListener — error handling', () => {
  it('network error with cached data → offline + stale cache surfaced', async () => {
    const deps = makeDeps({ loadFromCache: vi.fn(async () => ({ s1: {} })) });
    attachRealtimeListener('users/u1/series', deps);
    fb.state.onArgs?.error({ message: 'network request failed' });
    await flush();

    expect(deps.setIsOffline).toHaveBeenCalledWith(true);
    expect(deps.setData).toHaveBeenCalledWith({ s1: {} });
    expect(deps.setIsStale).toHaveBeenCalledWith(true);
    expect(deps.setError).toHaveBeenCalledWith('Offline - zeige gecachte Daten');
    expect(deps.setLoading).toHaveBeenCalledWith(false);
  });

  it('network error without cache → "keine Offline-Daten" message', async () => {
    const deps = makeDeps({ loadFromCache: vi.fn(async () => null) });
    attachRealtimeListener('users/u1/series', deps);
    fb.state.onArgs?.error({ message: 'ERR_INTERNET_DISCONNECTED' });
    await flush();

    expect(deps.setIsOffline).toHaveBeenCalledWith(true);
    expect(deps.setError).toHaveBeenCalledWith('Keine Offline-Daten verfügbar');
    expect(deps.setLoading).toHaveBeenCalledWith(false);
  });

  it('non-network error → surfaces the message, no offline fallback', async () => {
    const deps = makeDeps();
    attachRealtimeListener('users/u1/series', deps);
    fb.state.onArgs?.error({ message: 'permission_denied' });
    await flush();

    expect(deps.setError).toHaveBeenCalledWith('permission_denied');
    expect(deps.setIsOffline).not.toHaveBeenCalled();
    expect(deps.setLoading).toHaveBeenCalledWith(false);
    expect(deps.loadFromCache).not.toHaveBeenCalled();
  });

  it('empty message + empty toString falls back to a generic label', async () => {
    const deps = makeDeps();
    attachRealtimeListener('users/u1/series', deps);
    fb.state.onArgs?.error({ message: '', toString: () => '' });
    await flush();
    expect(deps.setError).toHaveBeenCalledWith('Firebase Fehler');
  });

  it('classifies via toString() when message is absent (network match)', async () => {
    const deps = makeDeps({ loadFromCache: vi.fn(async () => null) });
    attachRealtimeListener('users/u1/series', deps);
    fb.state.onArgs?.error({ toString: () => 'NETWORK glitch' });
    await flush();
    expect(deps.setIsOffline).toHaveBeenCalledWith(true);
  });
});

describe('attachRealtimeListener — setup failure', () => {
  it('returns null and reports the error when firebase.database() throws', () => {
    fb.state.throwOnDatabase = true;
    const deps = makeDeps();
    const result = attachRealtimeListener('users/u1/series', deps);
    expect(result).toBeNull();
    expect(deps.setError).toHaveBeenCalledWith('db init failed');
    expect(deps.setLoading).toHaveBeenCalledWith(false);
  });

  it('reports a generic label when the thrown value is not an Error', () => {
    fb.state.throwOnDatabase = true;
    fb.state.throwValue = 'plain string boom';
    const deps = makeDeps();
    const result = attachRealtimeListener('users/u1/series', deps);
    expect(result).toBeNull();
    expect(deps.setError).toHaveBeenCalledWith('Realtime setup failed');
  });
});
