import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  updates: [] as Record<string, unknown>[],
  store: {} as Record<string, unknown>,
}));

vi.mock('../db/ref', () => ({
  userPath: (uid: string, ...segments: (string | number)[]) =>
    ['users', uid, ...segments].join('/'),
  dbGet: vi.fn(async (path: string) => fb.store[path] ?? null),
  dbUpdate: vi.fn(async (updates: Record<string, unknown>) => {
    fb.updates.push(updates);
  }),
}));

import {
  buildMovieCleanup,
  buildSeriesCleanup,
  cleanupMovieDetectionState,
  cleanupSeriesDetectionState,
  matchHandoffKeys,
} from './detectionCleanup';

beforeEach(() => {
  fb.updates = [];
  fb.store = {};
});

describe('buildSeriesCleanup', () => {
  it('loescht alle Erkennungs-Knoten der Serie', () => {
    const map = buildSeriesCleanup('u1', 1399);
    expect(map['users/u1/knownProviders/1399']).toBeNull();
    expect(map['users/u1/completedSeriesData/1399']).toBeNull();
    expect(map['users/u1/inactiveRewatchNotifications/1399']).toBeNull();
    expect(map['users/u1/meta/seasonCounts/1399']).toBeNull();
  });

  it('setzt ausschliesslich null-Werte', () => {
    expect(Object.values(buildSeriesCleanup('u1', 1))).toEqual(expect.arrayContaining([null]));
    expect(Object.values(buildSeriesCleanup('u1', 1)).every((v) => v === null)).toBe(true);
  });

  it('fasst die Serie nur ueber ihre eigene Id an', () => {
    const map = buildSeriesCleanup('u1', 7);
    expect(Object.keys(map).every((p) => p.endsWith('/7'))).toBe(true);
  });

  it('behandelt Zahl und String gleich', () => {
    expect(buildSeriesCleanup('u1', 42)).toEqual(buildSeriesCleanup('u1', '42'));
  });

  it('laesst den skalaren knownProvidersRegion in Ruhe', () => {
    const keys = Object.keys(buildSeriesCleanup('u1', 5));
    expect(keys.some((k) => k.includes('knownProvidersRegion'))).toBe(false);
  });
});

describe('buildMovieCleanup', () => {
  it('loescht den Provider-Stand des Films', () => {
    expect(buildMovieCleanup('u1', 299536)).toEqual({
      'users/u1/movieProviderData/299536': null,
    });
  });
});

describe('matchHandoffKeys', () => {
  it('trifft nur Schluessel der eigenen Serie', () => {
    const keys = ['1399-1', '1399-2', '13990-1', '456-1'];
    expect(matchHandoffKeys(keys, 1399)).toEqual(['1399-1', '1399-2']);
  });

  it('gibt leer zurueck, wenn nichts passt', () => {
    expect(matchHandoffKeys(['1-1'], 99)).toEqual([]);
  });
});

describe('cleanupSeriesDetectionState', () => {
  it('schreibt eine einzige Multi-Path-Update-Map', async () => {
    await cleanupSeriesDetectionState('u1', 1399);
    expect(fb.updates).toHaveLength(1);
    expect(fb.updates[0]['users/u1/knownProviders/1399']).toBeNull();
  });

  it('nimmt passende animeMangaNotifications mit', async () => {
    fb.store['users/u1/animeMangaNotifications'] = { '1399-1': {}, '1399-2': {}, '456-1': {} };
    await cleanupSeriesDetectionState('u1', 1399);
    const map = fb.updates[0];
    expect(map['users/u1/animeMangaNotifications/1399-1']).toBeNull();
    expect(map['users/u1/animeMangaNotifications/1399-2']).toBeNull();
    expect(map['users/u1/animeMangaNotifications/456-1']).toBeUndefined();
  });

  it('tut nichts ohne uid oder Id', async () => {
    await cleanupSeriesDetectionState('', 1);
    await cleanupSeriesDetectionState('u1', undefined as unknown as number);
    expect(fb.updates).toHaveLength(0);
  });
});

describe('cleanupMovieDetectionState', () => {
  it('schreibt den Film-Knoten weg', async () => {
    await cleanupMovieDetectionState('u1', 299536);
    expect(fb.updates[0]).toEqual({ 'users/u1/movieProviderData/299536': null });
  });

  it('tut nichts ohne uid', async () => {
    await cleanupMovieDetectionState('', 1);
    expect(fb.updates).toHaveLength(0);
  });
});
