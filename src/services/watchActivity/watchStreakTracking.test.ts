/**
 * Tests für Watch-Streak-Tracking.
 *
 * Kernlogik: gestern gesehen → Streak +1; heute schon gesehen → no-op;
 * Lücke → alte Streak (falls > 1) in die Historie schieben, Zähler auf 1.
 * Zum Jahreswechsel wird der Vorjahres-Stand übernommen. Firebase gemockt.
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
  const makeRef = (path: string) => ({
    async once(_e?: string) {
      if (state.fail) throw new Error('firebase-fail');
      return { val: () => getAt(path) };
    },
    async set(v: unknown) {
      if (state.fail) throw new Error('firebase-fail');
      setAt(path, v);
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

import { updateWatchStreak, getWatchStreak } from './watchStreakTracking';
import type { WatchStreak } from '../../types/WatchActivity';

// Lokale Zeit: 15. Juni 2026 → heute 2026-06-15, gestern 2026-06-14.
const BASE = new Date('2026-06-15T20:00:00').getTime();
const TODAY = '2026-06-15';
const YESTERDAY = '2026-06-14';
const P2026 = 'users/u/wrapped/2026/streak';
const P2025 = 'users/u/wrapped/2025/streak';

const streak = (over: Partial<WatchStreak> = {}): WatchStreak => ({
  currentStreak: 0,
  longestStreak: 0,
  lastWatchDate: '',
  streaks: [],
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

describe('updateWatchStreak', () => {
  it('erster Eintrag überhaupt: currentStreak 1, longest bleibt 0, lastWatchDate heute', async () => {
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(0); // IST: longest wird beim Erstwatch nicht angehoben
    expect(s.lastWatchDate).toBe(TODAY);
  });

  it('heute schon gesehen → no-op (kein Schreiben)', async () => {
    fb.setAt(P2026, streak({ currentStreak: 5, longestStreak: 9, lastWatchDate: TODAY }));
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(5); // unverändert
    expect(s.lastWatchDate).toBe(TODAY);
  });

  it('gestern gesehen → Streak +1 und longest zieht nach', async () => {
    fb.setAt(P2026, streak({ currentStreak: 3, longestStreak: 3, lastWatchDate: YESTERDAY }));
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(4);
    expect(s.longestStreak).toBe(4);
    expect(s.lastWatchDate).toBe(TODAY);
  });

  it('gestern gesehen, aber longest bereits höher → longest bleibt', async () => {
    fb.setAt(P2026, streak({ currentStreak: 3, longestStreak: 10, lastWatchDate: YESTERDAY }));
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(4);
    expect(s.longestStreak).toBe(10);
  });

  it('Lücke bei currentStreak > 1 → alte Streak wird archiviert, Zähler auf 1', async () => {
    fb.setAt(
      P2026,
      streak({ currentStreak: 5, longestStreak: 8, lastWatchDate: '2026-06-10', streaks: [] })
    );
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(1);
    expect(s.streaks).toHaveLength(1);
    // Streak endete an lastWatchDate (2026-06-10), Länge 5 → startDate = 06-10 − 4 = 06-06.
    // (Früher fälschlich von heute zurückgerechnet → startDate === endDate für eine 5-Tage-Streak.)
    expect(s.streaks[0]).toEqual({
      startDate: '2026-06-06',
      endDate: '2026-06-10',
      length: 5,
    });
    expect(s.lastWatchDate).toBe(TODAY);
  });

  it('Lücke bei currentStreak 1 → keine Archivierung, Zähler bleibt 1', async () => {
    fb.setAt(
      P2026,
      streak({ currentStreak: 1, longestStreak: 1, lastWatchDate: '2026-06-10', streaks: [] })
    );
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(1);
    expect(s.streaks).toHaveLength(0);
  });

  it('Streak-Historie ist auf 20 Einträge gedeckelt', async () => {
    const twenty = Array.from({ length: 20 }, (_, i) => ({
      startDate: `2026-01-${String(i + 1).padStart(2, '0')}`,
      endDate: `2026-01-${String(i + 1).padStart(2, '0')}`,
      length: 2,
    }));
    fb.setAt(
      P2026,
      streak({ currentStreak: 5, longestStreak: 8, lastWatchDate: '2026-06-10', streaks: twenty })
    );
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.streaks).toHaveLength(20); // 21 → slice(-20)
    expect(s.streaks[19].length).toBe(5); // der frisch archivierte Eintrag
  });

  it('Jahreswechsel: übernimmt den Vorjahres-Stand und setzt fort, wenn gestern gesehen', async () => {
    fb.setAt(
      P2025,
      streak({
        currentStreak: 4,
        longestStreak: 7,
        lastWatchDate: YESTERDAY,
        streaks: [{ startDate: 'x', endDate: 'y', length: 2 }],
      })
    );
    await updateWatchStreak('u');
    const s = fb.getAt(P2026) as WatchStreak;
    expect(s.currentStreak).toBe(5); // 4 + 1
    expect(s.longestStreak).toBe(7);
    expect(s.lastWatchDate).toBe(TODAY);
    // Vorjahr bleibt unangetastet
    expect((fb.getAt(P2025) as WatchStreak).currentStreak).toBe(4);
  });

  it('fängt Firebase-Fehler ab (kein Throw)', async () => {
    fb.state.fail = true;
    await expect(updateWatchStreak('u')).resolves.toBeUndefined();
  });
});

describe('getWatchStreak', () => {
  it('liefert den gespeicherten Streak', async () => {
    fb.setAt(P2026, streak({ currentStreak: 3, lastWatchDate: TODAY }));
    const s = await getWatchStreak('u', 2026);
    expect(s?.currentStreak).toBe(3);
  });

  it('liefert null ohne Daten', async () => {
    expect(await getWatchStreak('u', 2026)).toBeNull();
  });

  it('fängt Firebase-Fehler ab und liefert null', async () => {
    fb.state.fail = true;
    expect(await getWatchStreak('u', 2026)).toBeNull();
  });
});
