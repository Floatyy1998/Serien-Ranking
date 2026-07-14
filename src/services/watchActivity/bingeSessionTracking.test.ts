/**
 * Tests für Binge-Session-Tracking.
 *
 * Kernlogik: eine Episode setzt die aktive Session fort, solange der Abstand
 * kleiner ist als (Ø Episodenlänge + 15 min Puffer). Sonst wird die alte Session
 * beendet und eine neue gestartet. Firebase ist durch einen In-Memory-Baum gemockt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-Memory-Firebase (Baum-Store). Unterstützt once/set/update/remove/push und
// orderByChild(..).equalTo(..).once(..) (server-seitiger Filter nachgebildet).
const fb = vi.hoisted(() => {
  const root: Record<string, unknown> = {};
  const state = { fail: false };
  let pushId = 0;
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
  const makeRef = (path: string, filter?: { child: string; value: unknown }) => ({
    async once(_e?: string) {
      if (state.fail) throw new Error('firebase-fail');
      let val = getAt(path);
      if (filter && val && typeof val === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
          if (
            v &&
            typeof v === 'object' &&
            (v as Record<string, unknown>)[filter.child] === filter.value
          ) {
            out[k] = v;
          }
        }
        val = Object.keys(out).length ? out : null;
      }
      return { val: () => val };
    },
    async set(v: unknown) {
      if (state.fail) throw new Error('firebase-fail');
      setAt(path, v);
    },
    async update(v: Record<string, unknown>) {
      if (state.fail) throw new Error('firebase-fail');
      const cur = (getAt(path) as Record<string, unknown>) || {};
      setAt(path, { ...cur, ...v });
    },
    async remove() {
      if (state.fail) throw new Error('firebase-fail');
      removeAt(path);
    },
    push() {
      pushId += 1;
      const key = `push_${pushId}`;
      return {
        key,
        async set(v: unknown) {
          setAt(`${path}/${key}`, v);
        },
      };
    },
    orderByChild(child: string) {
      return { equalTo: (value: unknown) => makeRef(path, { child, value }) };
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
      pushId = 0;
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import {
  getActiveBingeSession,
  updateBingeSession,
  getBingeSessionsForYear,
} from './bingeSessionTracking';
import type { BingeSession } from '../../types/WatchActivity';

const BASE = new Date('2026-06-15T20:00:00').getTime();
const PATH = 'users/u/wrapped/2026/bingeSessions';

const mkSession = (over: Partial<BingeSession> = {}): BingeSession => ({
  id: 'a1',
  startedAt: new Date(BASE).toISOString(),
  seriesId: 8,
  seriesTitle: 'Dark',
  episodes: [{ seasonNumber: 1, episodeNumber: 1, watchedAt: new Date(BASE).toISOString() }],
  totalMinutes: 45,
  isActive: true,
  ...over,
});

beforeEach(() => {
  fb.reset();
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('getActiveBingeSession', () => {
  it('liefert null, wenn keine Sessions existieren', async () => {
    expect(await getActiveBingeSession('u', 8)).toBeNull();
  });

  it('liefert die aktive Session inklusive Key als id', async () => {
    fb.setAt(`${PATH}/s1`, mkSession({ id: 's1', seriesId: 8, isActive: true }));
    const result = await getActiveBingeSession('u', 8);
    expect(result?.id).toBe('s1');
    expect(result?.isActive).toBe(true);
  });

  it('ignoriert inaktive Sessions', async () => {
    fb.setAt(`${PATH}/s1`, mkSession({ id: 's1', seriesId: 8, isActive: false }));
    expect(await getActiveBingeSession('u', 8)).toBeNull();
  });

  it('fängt Firebase-Fehler ab und liefert null', async () => {
    fb.state.fail = true;
    expect(await getActiveBingeSession('u', 8)).toBeNull();
  });
});

describe('updateBingeSession', () => {
  it('startet eine neue Session, wenn keine aktive existiert', async () => {
    const id = await updateBingeSession('u', 7, 'Breaking Bad', 1, 1, 50);
    expect(id).toBeDefined();
    const stored = fb.getAt(`${PATH}/${id}`) as BingeSession;
    expect(stored.isActive).toBe(true);
    expect(stored.seriesId).toBe(7);
    expect(stored.episodes).toHaveLength(1);
    expect(stored.totalMinutes).toBe(50);
  });

  it('setzt eine aktive Session fort, wenn der Abstand unter der Schwelle liegt', async () => {
    // letzte Episode vor 10 min, Ø 45 min → Schwelle 60 min → fortsetzen
    fb.setAt(
      `${PATH}/a1`,
      mkSession({
        id: 'a1',
        seriesId: 8,
        totalMinutes: 45,
        episodes: [
          {
            seasonNumber: 1,
            episodeNumber: 1,
            watchedAt: new Date(BASE - 10 * 60000).toISOString(),
          },
        ],
      })
    );
    const id = await updateBingeSession('u', 8, 'Dark', 1, 2, 45);
    expect(id).toBe('a1');
    const stored = fb.getAt(`${PATH}/a1`) as BingeSession;
    expect(stored.episodes).toHaveLength(2);
    expect(stored.totalMinutes).toBe(90);
  });

  it('beendet die alte Session und startet eine neue, wenn der Abstand zu groß ist', async () => {
    const oldWatchedAt = new Date(BASE - 120 * 60000).toISOString();
    fb.setAt(
      `${PATH}/a2`,
      mkSession({
        id: 'a2',
        seriesId: 9,
        totalMinutes: 45,
        episodes: [{ seasonNumber: 1, episodeNumber: 1, watchedAt: oldWatchedAt }],
      })
    );
    const id = await updateBingeSession('u', 9, 'Dark', 1, 2, 45);
    const old = fb.getAt(`${PATH}/a2`) as BingeSession;
    expect(old.isActive).toBe(false);
    expect(old.endedAt).toBe(oldWatchedAt);
    expect(id).not.toBe('a2');
    const fresh = fb.getAt(`${PATH}/${id}`) as BingeSession;
    expect(fresh.isActive).toBe(true);
    expect(fresh.episodes).toHaveLength(1);
  });

  it('fängt Firebase-Fehler ab und liefert undefined', async () => {
    fb.state.fail = true;
    expect(await updateBingeSession('u', 8, 'Dark', 1, 1)).toBeUndefined();
  });
});

describe('getBingeSessionsForYear', () => {
  it('liefert alle Sessions als Array', async () => {
    fb.setAt(`${PATH}/a1`, mkSession({ id: 'a1' }));
    fb.setAt(`${PATH}/a2`, mkSession({ id: 'a2' }));
    const result = await getBingeSessionsForYear('u', 2026);
    expect(result).toHaveLength(2);
  });

  it('liefert [] ohne Daten', async () => {
    expect(await getBingeSessionsForYear('u', 2026)).toEqual([]);
  });

  it('fängt Firebase-Fehler ab und liefert []', async () => {
    fb.state.fail = true;
    expect(await getBingeSessionsForYear('u', 2026)).toEqual([]);
  });
});
