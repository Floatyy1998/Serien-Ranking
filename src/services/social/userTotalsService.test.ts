// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  sets: [] as { path: string; value: unknown }[],
  failPaths: new Set<string>(),
}));

vi.mock('../db/ref', () => ({
  dbGet: (path: string) => {
    if (db.failPaths.has(path)) return Promise.reject(new Error('permission denied'));
    return Promise.resolve(db.values.get(path) ?? null);
  },
  dbRef: (path: string) => ({
    set: (value: unknown) => {
      if (db.failPaths.has(path)) return Promise.reject(new Error('permission denied'));
      db.sets.push({ path, value });
      return Promise.resolve();
    },
  }),
  userPath: (uid: string, ...segments: (string | number)[]) =>
    ['users', uid, ...segments].join('/'),
}));

import type { LibraryTotals } from '../../lib/stats/libraryTotals';
import {
  clearPendingTotalsPublishes,
  decidePublish,
  fetchLibraryTotals,
  publishLibraryTotals,
  toTotalsPayload,
  totalsFingerprint,
} from './userTotalsService';

const HOUR = 60 * 60 * 1000;

const totals = (overrides: Partial<LibraryTotals> = {}): LibraryTotals => ({
  watchtimeMinutes: 36245,
  seriesMinutes: 30000,
  movieMinutes: 6245,
  episodes: 1480,
  seriesStarted: 63,
  seriesCompleted: 28,
  movies: 212,
  ...overrides,
});

beforeEach(() => {
  db.values.clear();
  db.sets.length = 0;
  db.failPaths.clear();
  localStorage.clear();
  clearPendingTotalsPublishes();
});

afterEach(() => {
  vi.useRealTimers();
  clearPendingTotalsPublishes();
});

describe('toTotalsPayload', () => {
  it('rundet und veroeffentlicht nur die Vergleichszahlen', () => {
    expect(toTotalsPayload(totals({ watchtimeMinutes: 100.6 }))).toEqual({
      watchtimeMinutes: 101,
      episodes: 1480,
      seriesStarted: 63,
      seriesCompleted: 28,
      movies: 212,
      v: 1,
    });
  });

  it('klemmt negative Werte auf null', () => {
    expect(toTotalsPayload(totals({ watchtimeMinutes: -5 })).watchtimeMinutes).toBe(0);
  });
});

describe('decidePublish', () => {
  const fp = 'x';

  it('schreibt beim ersten Mal', () => {
    expect(decidePublish(fp, null, 0, false).decision).toBe('publish');
  });

  it('schreibt nichts Unveraendertes', () => {
    expect(decidePublish(fp, { key: fp, ts: 0 }, HOUR * 5, false).decision).toBe('unchanged');
  });

  it('schreibt keine leere Bibliothek — das ist ein Ladezwischenstand', () => {
    expect(decidePublish(fp, null, 0, true).decision).toBe('empty');
  });

  it('drosselt eine Aenderung innerhalb der Stunde und nennt die Restzeit', () => {
    const result = decidePublish('neu', { key: 'alt', ts: 0 }, HOUR / 2, false);
    expect(result.decision).toBe('throttled');
    expect(result.retryInMs).toBe(HOUR / 2);
  });

  it('laesst eine Aenderung nach der Stunde durch', () => {
    expect(decidePublish('neu', { key: 'alt', ts: 0 }, HOUR + 1, false).decision).toBe('publish');
  });
});

describe('publishLibraryTotals', () => {
  it('schreibt den Schnappschuss unter den Leaderboard-Knoten', async () => {
    await publishLibraryTotals('u1', totals());

    expect(db.sets).toHaveLength(1);
    expect(db.sets[0].path).toBe('users/u1/leaderboard/totals');
    expect(db.sets[0].value).toMatchObject({ watchtimeMinutes: 36245, movies: 212, v: 1 });
  });

  it('schreibt unveraenderte Zahlen kein zweites Mal', async () => {
    await publishLibraryTotals('u1', totals());
    await publishLibraryTotals('u1', totals());

    expect(db.sets).toHaveLength(1);
  });

  it('schreibt nichts fuer eine leere Bibliothek', async () => {
    await publishLibraryTotals(
      'u1',
      totals({ watchtimeMinutes: 0, episodes: 0, movies: 0, seriesStarted: 0, seriesCompleted: 0 })
    );

    expect(db.sets).toHaveLength(0);
  });

  it('holt einen gedrosselten Write als Nachzuegler nach', async () => {
    vi.useFakeTimers();
    await publishLibraryTotals('u1', totals());
    expect(db.sets).toHaveLength(1);

    await publishLibraryTotals('u1', totals({ watchtimeMinutes: 36290 }));
    expect(db.sets).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(db.sets).toHaveLength(2);
    expect(db.sets[1].value).toMatchObject({ watchtimeMinutes: 36290 });
  });

  it('schluckt einen fehlgeschlagenen Write', async () => {
    db.failPaths.add('users/u1/leaderboard/totals');
    await expect(publishLibraryTotals('u1', totals())).resolves.toBeUndefined();
  });

  it('ignoriert einen Aufruf ohne Nutzer', async () => {
    await publishLibraryTotals('', totals());
    expect(db.sets).toHaveLength(0);
  });
});

describe('fetchLibraryTotals', () => {
  it('liest je Nutzer einen Punkt', async () => {
    db.values.set('users/a/leaderboard/totals', {
      watchtimeMinutes: 10,
      episodes: 2,
      seriesStarted: 1,
      seriesCompleted: 0,
      movies: 0,
      updatedAt: 1,
      v: 1,
    });

    const map = await fetchLibraryTotals(['a', 'b']);

    expect(map.a?.watchtimeMinutes).toBe(10);
    expect(map.b).toBeNull();
  });

  it('macht aus kaputten Eintraegen null statt einer Null-Wertung', async () => {
    db.values.set('users/a/leaderboard/totals', { watchtimeMinutes: 'viel' });
    const map = await fetchLibraryTotals(['a']);
    expect(map.a).toBeNull();
  });

  it('uebersteht einen Lesefehler', async () => {
    db.failPaths.add('users/a/leaderboard/totals');
    const map = await fetchLibraryTotals(['a']);
    expect(map.a).toBeNull();
  });
});

describe('totalsFingerprint', () => {
  it('unterscheidet geaenderte Zahlen', () => {
    const a = toTotalsPayload(totals());
    const b = toTotalsPayload(totals({ movies: 213 }));
    expect(totalsFingerprint(a)).not.toBe(totalsFingerprint(b));
  });
});
