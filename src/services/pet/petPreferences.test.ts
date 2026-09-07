// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as PathsModule from '../db/paths';

const db = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
  dbGet: vi.fn<(path: string) => Promise<unknown>>(),
  dbUpdate: vi.fn<(updates: Record<string, unknown>) => Promise<void>>(async () => {}),
}));
vi.mock('../db/ref', async () => {
  const { userPath } = await vi.importActual<typeof PathsModule>('../db/paths');
  return {
    userPath,
    dbGet: (path: string) => db.dbGet(path),
    dbUpdate: (updates: Record<string, unknown>) => db.dbUpdate(updates),
    dbRef: () => ({}),
  };
});
const subscribe = vi.hoisted(() => ({
  handler: null as null | ((snap: { val: () => unknown }) => void),
}));
vi.mock('../db/subscribeValue', () => ({
  subscribeValue: (_ref: unknown, handler: (snap: { val: () => unknown }) => void) => {
    subscribe.handler = handler;
    return () => {
      subscribe.handler = null;
    };
  },
}));

import {
  getPetEnabled,
  readPetEnabledCached,
  setPetEnabled,
  shiftStamp,
  subscribePetEnabled,
} from './petPreferences';

const NOW = new Date('2026-09-07T12:00:00.000Z').getTime();
const HOUR = 60 * 60 * 1000;

describe('petPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    db.store = {};
    db.dbGet.mockReset().mockImplementation(async (path) => db.store[path] ?? null);
    db.dbUpdate.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shiftStamp moves ISO and epoch stamps and leaves garbage alone', () => {
    expect(shiftStamp('2026-09-01T00:00:00.000Z', HOUR)).toBe('2026-09-01T01:00:00.000Z');
    expect(shiftStamp(NOW, HOUR)).toBe(new Date(NOW + HOUR).toISOString());
    expect(shiftStamp('kaputt', HOUR)).toBe('kaputt');
    expect(shiftStamp(undefined, HOUR)).toBeUndefined();
  });

  it('defaults to enabled and mirrors the last known value locally', async () => {
    expect(readPetEnabledCached('u1')).toBe(true);
    db.store['users/u1/petWidget/enabled'] = false;
    expect(await getPetEnabled('u1')).toBe(false);
    expect(readPetEnabledCached('u1')).toBe(false);
  });

  it('disabling stores the pause start', async () => {
    await setPetEnabled('u1', false);
    expect(db.dbUpdate).toHaveBeenCalledWith({
      'users/u1/petWidget/enabled': false,
      'users/u1/petWidget/pausedAt': NOW,
    });
    expect(readPetEnabledCached('u1')).toBe(false);
  });

  it('enabling shifts living pets by the paused time and clears the pause', async () => {
    db.store['users/u1/petWidget/pausedAt'] = NOW - 48 * HOUR;
    db.store['users/u1/pets'] = {
      a: { type: 'cat', isAlive: true, lastFed: '2026-09-05T10:00:00.000Z' },
      dead: { type: 'dog', isAlive: false, lastFed: '2026-09-01T10:00:00.000Z' },
      noStamp: { type: 'fox', isAlive: true },
      accessories: [{ id: 'x' }],
    };
    await setPetEnabled('u1', true);
    const nowIso = new Date(NOW).toISOString();
    expect(db.dbUpdate).toHaveBeenCalledWith({
      'users/u1/petWidget/enabled': true,
      'users/u1/petWidget/pausedAt': null,
      'users/u1/pets/a/lastFed': '2026-09-07T10:00:00.000Z',
      'users/u1/pets/a/lastUpdated': nowIso,
      'users/u1/pets/noStamp/lastFed': nowIso,
      'users/u1/pets/noStamp/lastUpdated': nowIso,
    });
    expect(readPetEnabledCached('u1')).toBe(true);
  });

  it('enabling without a recorded pause only flips the flag', async () => {
    await setPetEnabled('u1', true);
    expect(db.dbUpdate).toHaveBeenCalledWith({
      'users/u1/petWidget/enabled': true,
      'users/u1/petWidget/pausedAt': null,
    });
  });

  it('subscribePetEnabled reports live changes and caches them', () => {
    const onChange = vi.fn();
    const off = subscribePetEnabled('u1', onChange);
    subscribe.handler?.({ val: () => false });
    expect(onChange).toHaveBeenCalledWith(false);
    expect(readPetEnabledCached('u1')).toBe(false);
    subscribe.handler?.({ val: () => null });
    expect(onChange).toHaveBeenLastCalledWith(true);
    off();
    expect(subscribe.handler).toBeNull();
  });
});
