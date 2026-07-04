/**
 * Tests für die Shared-Utilities des Watch-Activity-Moduls:
 * Pfad-Builder, Geräteerkennung, Event-Metadaten (inkl. Bulk-Marking-Kopplung),
 * cleanObject, saveEvent (Compact-Speicherung) und das universelle Auslesen.
 * Firebase, navigator und localStorage sind gemockt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const root: Record<string, unknown> = {};
  const state = { fail: false };
  const seg = (p: string) => p.split('/').filter(Boolean);
  const getAt = (p: string): unknown => {
    let cur: unknown = root;
    for (const k of seg(p)) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = (cur as Record<string, unknown>)[k];
    }
    return cur === undefined ? null : cur;
  };
  const setAt = (p: string, v: unknown) => {
    const ks = seg(p);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (typeof cur[ks[i]] !== 'object' || cur[ks[i]] === null) cur[ks[i]] = {};
      cur = cur[ks[i]] as Record<string, unknown>;
    }
    cur[ks[ks.length - 1]] = v;
  };
  const removeAt = (p: string) => {
    const ks = seg(p);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (cur[ks[i]] == null) return;
      cur = cur[ks[i]] as Record<string, unknown>;
    }
    delete cur[ks[ks.length - 1]];
  };
  const makeRef = (path: string) => ({
    async once(_e?: string) {
      if (state.fail) throw new Error('firebase-fail');
      return { val: () => getAt(path) };
    },
    async set(v: unknown) {
      if (state.fail) throw new Error('firebase-fail');
      setAt(path, v);
    },
    async remove() {
      if (state.fail) throw new Error('firebase-fail');
      removeAt(path);
    },
  });
  return {
    getAt,
    setAt,
    state,
    makeRef,
    reset() {
      for (const k of Object.keys(root)) delete root[k];
      state.fail = false;
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const BASE = new Date('2026-06-15T20:30:00').getTime();

// localStorage-Stub (node hat keins)
const lsStore = new Map<string, string>();
const localStorageStub = {
  getItem: (k: string) => lsStore.get(k) ?? null,
  setItem: (k: string, v: string) => lsStore.set(k, v),
  removeItem: (k: string) => lsStore.delete(k),
  clear: () => lsStore.clear(),
};

async function load() {
  return import('./shared');
}

beforeEach(() => {
  vi.resetModules();
  fb.reset();
  lsStore.clear();
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
  vi.stubGlobal('localStorage', localStorageStub);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Pfad-Funktionen', () => {
  it('bauen die erwarteten wrapped-Pfade', async () => {
    const s = await load();
    expect(s.getEventsPath('u', 2026)).toBe('users/u/wrapped/2026/events');
    expect(s.getBingeSessionsPath('u', 2026)).toBe('users/u/wrapped/2026/bingeSessions');
    expect(s.getStreakPath('u', 2026)).toBe('users/u/wrapped/2026/streak');
    expect(s.getWrappedBasePath('u')).toBe('users/u/wrapped');
  });
});

describe('detectDeviceType', () => {
  it('erkennt desktop, mobile und tablet anhand des User-Agents', async () => {
    const { detectDeviceType } = await load();
    expect(detectDeviceType()).toBe('desktop');

    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile',
    });
    expect(detectDeviceType()).toBe('mobile');

    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' });
    expect(detectDeviceType()).toBe('tablet');
  });
});

describe('generateEventId', () => {
  it('erzeugt eine ID im Format <timestamp>_<random>', async () => {
    const { generateEventId } = await load();
    expect(generateEventId()).toMatch(/^\d+_[a-z0-9]+$/);
  });
});

describe('createBaseEventData', () => {
  it('leitet Zeitfelder aus jetzt ab und setzt deviceType', async () => {
    const { createBaseEventData } = await load();
    const data = createBaseEventData();
    const d = new Date(BASE);
    expect(data.timestamp).toBe(d.toISOString());
    expect(data.month).toBe(d.getMonth() + 1);
    expect(data.dayOfWeek).toBe(d.getDay());
    expect(data.hour).toBe(d.getHours());
    expect(data.deviceType).toBe('desktop');
  });
});

describe('createEpisodeEventData – Kopplung an Bulk-Marking', () => {
  it('erste Markierung ist kein Bulk-Marking und nutzt die aktuelle Zeit', async () => {
    const { createEpisodeEventData } = await load();
    const { isBulkMarking, eventData } = createEpisodeEventData();
    expect(isBulkMarking).toBe(false);
    expect(eventData.timestamp).toBe(new Date(BASE).toISOString());
  });

  it('ab der 3. Markierung innerhalb 60 s wird Bulk-Marking gemeldet', async () => {
    const { createEpisodeEventData } = await load();
    createEpisodeEventData();
    createEpisodeEventData();
    expect(createEpisodeEventData().isBulkMarking).toBe(true);
  });
});

describe('cleanObject', () => {
  it('entfernt null und undefined, behält 0, "" und false', async () => {
    const { cleanObject } = await load();
    expect(cleanObject({ a: 0, b: '', c: false, d: null, e: undefined, f: 5 })).toEqual({
      a: 0,
      b: '',
      c: false,
      f: 5,
    });
  });
});

describe('cleanupOldYearData', () => {
  it('ist deaktiviert und resolved ohne Effekt', async () => {
    const { cleanupOldYearData } = await load();
    await expect(cleanupOldYearData('u')).resolves.toBeUndefined();
  });
});

describe('saveEvent', () => {
  it('speichert ein Episode-Event im Compact-Format unter dem Jahr des Timestamps', async () => {
    const { saveEvent } = await load();
    const event = {
      timestamp: '2026-06-15T20:30:00.000Z',
      month: 6,
      dayOfWeek: 1,
      hour: 20,
      deviceType: 'desktop' as const,
      type: 'episode_watch' as const,
      seriesId: 1399,
      seriesTitle: 'GoT',
      seasonNumber: 3,
      episodeNumber: 9,
      episodeRuntime: 55,
      isRewatch: false,
    };
    const ok = await saveEvent('u', event);
    expect(ok).toBe(true);

    const events = fb.getAt('users/u/wrapped/2026/events') as Record<
      string,
      Record<string, unknown>
    >;
    const saved = Object.values(events)[0];
    expect(saved.ts).toBe(Math.floor(Date.parse(event.timestamp) / 1000));
    expect(saved.t).toBe('ep');
    expect(saved.s).toBe(1399);
    // null/undefined-Werte gefiltert, isRewatch false → rw fehlt
    expect('rw' in saved).toBe(false);
  });

  it('liefert false bei einem Firebase-Fehler', async () => {
    const { saveEvent } = await load();
    fb.state.fail = true;
    const ok = await saveEvent('u', {
      timestamp: '2026-06-15T20:30:00.000Z',
      type: 'movie_watch',
      movieId: 1,
      movieTitle: 'X',
    } as never);
    expect(ok).toBe(false);
  });
});

describe('clearAllWrappedData', () => {
  it('entfernt die wrapped-Daten und den Cleanup-LocalStorage-Key', async () => {
    const { clearAllWrappedData } = await load();
    fb.setAt('users/u/wrapped/2026/events/x', { ts: 1 });
    lsStore.set('wrapped_last_cleanup_year', '2025');

    await clearAllWrappedData('u');
    expect(fb.getAt('users/u/wrapped')).toBeNull();
    expect(lsStore.has('wrapped_last_cleanup_year')).toBe(false);
  });

  it('wirft den Firebase-Fehler weiter', async () => {
    const { clearAllWrappedData } = await load();
    fb.state.fail = true;
    await expect(clearAllWrappedData('u')).rejects.toThrow('firebase-fail');
  });
});

describe('getYearlyActivity / getEventsForYear', () => {
  it('expandiert Compact-Events und hydratisiert Legacy-Events', async () => {
    const { getYearlyActivity } = await load();
    fb.setAt('users/u/wrapped/2026/events', {
      c1: { ts: 1773606600, t: 'ep', s: 1, st: 'Compact' },
      l1: {
        timestamp: '2026-01-01T10:00:00',
        type: 'episode_watch',
        seriesId: 2,
        seriesTitle: 'Legacy',
        month: 1,
        dayOfWeek: 4,
        hour: 10,
      },
    });
    const events = await getYearlyActivity('u', 2026);
    expect(events).toHaveLength(2);
    const ids = events.map((e) => (e as { seriesId?: number }).seriesId).sort();
    expect(ids).toEqual([1, 2]);
    // beide haben aufgelöste Volltyp-Felder
    expect(events.every((e) => e.type === 'episode_watch')).toBe(true);
  });

  it('hydratisiert fehlende Zeitfelder eines Legacy-Events aus dem Timestamp', async () => {
    const { getYearlyActivity } = await load();
    fb.setAt('users/u/wrapped/2026/events', {
      l1: { timestamp: '2026-03-15T20:30:00', type: 'movie_watch', movieId: 5 },
    });
    const [ev] = await getYearlyActivity('u', 2026);
    const d = new Date('2026-03-15T20:30:00');
    expect(ev.month).toBe(d.getMonth() + 1);
    expect(ev.hour).toBe(d.getHours());
    expect(ev.deviceType).toBe('desktop');
  });

  it('liefert [] ohne Daten und getEventsForYear delegiert an getYearlyActivity', async () => {
    const { getYearlyActivity, getEventsForYear } = await load();
    expect(await getYearlyActivity('u', 2026)).toEqual([]);
    expect(await getEventsForYear('u', 2026)).toEqual([]);
  });

  it('fängt Firebase-Fehler ab und liefert []', async () => {
    const { getYearlyActivity } = await load();
    fb.state.fail = true;
    expect(await getYearlyActivity('u', 2026)).toEqual([]);
  });
});
