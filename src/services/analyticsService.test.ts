import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-Memory-Firebase-Mock (siehe leaderboardService.test.ts) mit ServerValue-Support.
const fb = vi.hoisted(() => {
  const db: Record<string, unknown> = {};
  const state = { pushCounter: 0 };
  const parts = (p: string) => (p === '' ? [] : p.split('/'));
  const getByPath = (path: string): unknown => {
    let n: unknown = db;
    for (const seg of parts(path)) {
      if (n == null || typeof n !== 'object') return undefined;
      n = (n as Record<string, unknown>)[seg];
    }
    return n;
  };
  const setByPath = (path: string, val: unknown) => {
    const segs = parts(path);
    let n = db as Record<string, unknown>;
    for (let i = 0; i < segs.length - 1; i++) {
      if (typeof n[segs[i]] !== 'object' || n[segs[i]] == null) n[segs[i]] = {};
      n = n[segs[i]] as Record<string, unknown>;
    }
    n[segs[segs.length - 1]] = val;
  };
  const removeByPath = (path: string) => {
    const segs = parts(path);
    let n = db as Record<string, unknown>;
    for (let i = 0; i < segs.length - 1; i++) {
      n = n[segs[i]] as Record<string, unknown>;
      if (n == null) return;
    }
    delete n[segs[segs.length - 1]];
  };
  const resolveVal = (fullPath: string, v: unknown): unknown => {
    if (v && typeof v === 'object' && '.sv' in (v as Record<string, unknown>)) {
      const sv = (v as Record<string, unknown>)['.sv'];
      if (sv === 'timestamp') return Date.now();
      if (sv && typeof sv === 'object' && 'increment' in (sv as Record<string, unknown>)) {
        const cur = getByPath(fullPath);
        return (typeof cur === 'number' ? cur : 0) + (sv as { increment: number }).increment;
      }
    }
    return v;
  };
  const snap = (val: unknown) => ({
    val: () => (val === undefined ? null : val),
    exists: () => val !== undefined && val !== null,
  });
  const makeRef = (path: string): Record<string, unknown> => ({
    once: async () => snap(getByPath(path)),
    set: async (v: unknown) => setByPath(path, resolveVal(path, v)),
    remove: async () => removeByPath(path),
    update: async (map: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(map)) {
        const full = path === '' ? k : `${path}/${k}`;
        if (v === null) removeByPath(full);
        else setByPath(full, resolveVal(full, v));
      }
    },
    push: (v?: unknown) => {
      const key = `-push${state.pushCounter++}`;
      const childPath = path ? `${path}/${key}` : key;
      if (v !== undefined) setByPath(childPath, v);
      return makeRef(childPath);
    },
    onDisconnect: () => ({ remove: async () => {}, set: async () => {} }),
  });
  const database = (() => ({ ref: (p = '') => makeRef(p) })) as unknown as {
    (): { ref: (p?: string) => Record<string, unknown> };
    ServerValue: { TIMESTAMP: unknown; increment: (n: number) => unknown };
  };
  database.ServerValue = {
    TIMESTAMP: { '.sv': 'timestamp' },
    increment: (n: number) => ({ '.sv': { increment: n } }),
  };
  const firebaseDefault = {
    database,
    app: () => ({ options: { databaseURL: 'https://serien-ranking.firebaseio.com' } }),
  };
  return {
    db,
    getByPath,
    firebaseDefault,
    reset: () => {
      for (const k of Object.keys(db)) delete db[k];
      state.pushCounter = 0;
    },
  };
});

vi.mock('firebase/compat/app', () => ({ default: fb.firebaseDefault }));
vi.mock('firebase/compat/database', () => ({}));

// ---------------------------------------------------------------------------
// Browser-Globals (node-env): localStorage, document, window, navigator.
// ---------------------------------------------------------------------------
function makeLocalStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  };
}

const listeners: Record<string, Array<() => void>> = {};
const sendBeacon = vi.fn();

async function loadService() {
  vi.resetModules();
  const mod = await import('./analyticsService');
  return mod.analyticsService;
}

beforeEach(() => {
  fb.reset();
  for (const k of Object.keys(listeners)) delete listeners[k];
  sendBeacon.mockClear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
  vi.stubGlobal('localStorage', makeLocalStorage());
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: vi.fn((t: string, cb: () => void) => {
      (listeners[t] ||= []).push(cb);
    }),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal('window', {
    location: { pathname: '/home' },
    addEventListener: vi.fn((t: string, cb: () => void) => {
      (listeners[t] ||= []).push(cb);
    }),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal('navigator', { onLine: true, sendBeacon });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const DATE = '2026-07-04';
const MONTH = '2026-07';

describe('getConsent', () => {
  it('null wenn kein Consent gespeichert', async () => {
    const svc = await loadService();
    expect(svc.getConsent()).toBeNull();
  });

  it('spiegelt gespeicherten Consent-String als boolean', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    expect(svc.getConsent()).toBe(true);
    svc.setEnabled(false);
    expect(svc.getConsent()).toBe(false);
  });
});

describe('setEnabled', () => {
  it('true: persistiert Consent, startet Flush-Timer und Lifecycle-Listener', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    expect(localStorage.getItem('analytics-consent')).toBe('true');
    expect(listeners['visibilitychange']?.length).toBe(1);
    expect(listeners['beforeunload']?.length).toBe(1);
  });

  it('false: leert den Buffer und stoppt das Tracking', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    svc.track('episode_watched');
    svc.setEnabled(false);
    // Buffer leer → flush schreibt nichts mehr
    svc.setEnabled(true);
    svc.setUser('u1');
    await svc.flush();
    expect(fb.getByPath(`analytics/global/daily/${DATE}/totalEvents`)).toBeUndefined();
  });
});

describe('init', () => {
  it('aktiviert nur, wenn Consent === "true" vorliegt', async () => {
    localStorage.setItem('analytics-consent', 'true');
    const svc = await loadService();
    svc.init();
    expect(listeners['visibilitychange']?.length).toBe(1);
  });

  it('bleibt ohne Consent inaktiv (track wird verworfen)', async () => {
    const svc = await loadService();
    svc.init();
    svc.setUser('u1');
    svc.track('episode_watched');
    await svc.flush();
    // setUser schreibt zwar Meta/Presence, aber der getrackte Event wird nie geflusht.
    expect(fb.getByPath(`analytics/global/daily/${DATE}/totalEvents`)).toBeUndefined();
    expect(fb.getByPath(`analytics/users/u1/daily`)).toBeUndefined();
  });
});

describe('track', () => {
  it('verwirft nicht-gewhitelistete Events', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    svc.track('not_allowed_event');
    await svc.flush();
    expect(fb.getByPath('analytics')).toBeTruthy(); // setUser schrieb meta
    expect(fb.getByPath(`analytics/global/daily/${DATE}/totalEvents`)).toBeUndefined();
  });

  it('flusht automatisch, sobald der Buffer die Maximalgröße erreicht', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    for (let i = 0; i < 50; i++) svc.track('episode_watched');
    // flush ist async — auf Microtasks warten
    await vi.waitFor(() =>
      expect(fb.getByPath(`analytics/global/daily/${DATE}/totalEvents`)).toBe(50)
    );
  });
});

describe('flush', () => {
  it('schreibt Roh-Batch + inkrementiert User- und Global-Zähler', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    svc.track('episode_watched');
    svc.track('page_view', { page: 'home' });

    await svc.flush();

    expect(fb.getByPath(`analytics/users/u1/daily/${DATE}/events/episode_watched`)).toBe(1);
    expect(fb.getByPath(`analytics/users/u1/daily/${DATE}/events/page_view`)).toBe(1);
    expect(fb.getByPath(`analytics/users/u1/daily/${DATE}/pageViews/home`)).toBe(1);
    expect(fb.getByPath(`analytics/global/daily/${DATE}/totalEvents`)).toBe(2);
    expect(fb.getByPath(`analytics/global/daily/${DATE}/events/page_view`)).toBe(1);
    expect(fb.getByPath(`analytics/global/daily/${DATE}/pageViews/home`)).toBe(1);
    // Roh-Batch-Knoten existiert
    const events = fb.getByPath(`analytics/users/u1/events/${DATE}`) as Record<string, unknown>;
    expect(Object.keys(events).length).toBe(1);
  });

  it('IST-Verhalten: gleicher Event-Typ im Batch überschreibt den increment-Key (netto +1)', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    svc.track('episode_watched');
    svc.track('episode_watched');
    await svc.flush();
    // Doppelter Key im Multi-Path-Objekt → nur +1; totalEvents zählt aber beide.
    expect(fb.getByPath(`analytics/users/u1/daily/${DATE}/events/episode_watched`)).toBe(1);
    expect(fb.getByPath(`analytics/global/daily/${DATE}/totalEvents`)).toBe(2);
  });

  it('no-op ohne User, ohne Consent oder bei leerem Buffer', async () => {
    const svc = await loadService();
    // ohne enabled/user
    await svc.flush();
    expect(fb.getByPath('analytics')).toBeUndefined();
    // enabled + user, aber leerer Buffer
    svc.setEnabled(true);
    svc.setUser('u1');
    const before = JSON.stringify(fb.db);
    await svc.flush();
    expect(JSON.stringify(fb.db)).toBe(before);
  });
});

describe('setUser', () => {
  it('markiert den User in DAU/MAU und setzt firstSeen einmalig', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    // firstSeen wird als letztes (nach update + once) gesetzt → darauf warten.
    await vi.waitFor(() => expect(fb.getByPath('analytics/users/u1/meta/firstSeen')).toBeTruthy());
    expect(fb.getByPath(`analytics/global/daily/${DATE}/activeUsers/u1`)).toBeTruthy();
    expect(fb.getByPath(`analytics/global/monthly/${MONTH}/activeUsers/u1`)).toBeTruthy();
  });

  it('flusht den bestehenden Buffer beim User-Wechsel', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    svc.track('episode_watched');
    svc.setUser('u2'); // flush für u1
    await vi.waitFor(() =>
      expect(fb.getByPath(`analytics/users/u1/daily/${DATE}/events/episode_watched`)).toBe(1)
    );
  });
});

describe('updateCurrentPage / destroy', () => {
  it('updateCurrentPage schreibt nur bei aktivem User + Consent', async () => {
    const svc = await loadService();
    svc.updateCurrentPage('/x'); // kein User → no-op
    expect(fb.getByPath('analytics/global/realtime')).toBeUndefined();

    svc.setEnabled(true);
    svc.setUser('u1');
    svc.updateCurrentPage('/discover');
    await vi.waitFor(() =>
      expect(fb.getByPath('analytics/global/realtime/activeUsers/u1/page')).toBe('/discover')
    );
  });

  it('destroy läuft ohne Fehler und entfernt Listener', async () => {
    const svc = await loadService();
    svc.setEnabled(true);
    svc.setUser('u1');
    expect(() => svc.destroy()).not.toThrow();
  });
});
