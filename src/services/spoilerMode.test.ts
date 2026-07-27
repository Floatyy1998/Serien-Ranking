// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  sets: [] as { path: string; value: unknown }[],
  store: {} as Record<string, unknown>,
}));

vi.mock('./db/ref', () => ({
  userPath: (uid: string, ...parts: string[]) => `users/${uid}/${parts.join('/')}`,
  dbRef: vi.fn((path: string) => ({
    set: (value: unknown) => {
      fb.sets.push({ path, value });
      return Promise.resolve();
    },
  })),
  dbGet: vi.fn(async (path: string) => fb.store[path] ?? null),
}));

import {
  DEFAULT_SPOILER_LEVEL,
  getSpoilerLevel,
  setSpoilerLevel,
  syncSpoilerLevel,
} from './spoilerMode';

beforeEach(() => {
  fb.sets = [];
  fb.store = {};
  localStorage.clear();
});

describe('spoilerMode', () => {
  it('liefert den Default ohne gespeicherten Wert', () => {
    expect(getSpoilerLevel()).toBe(DEFAULT_SPOILER_LEVEL);
  });

  it('setzt lokal und remote', () => {
    setSpoilerLevel('u1', 2);
    expect(getSpoilerLevel()).toBe(2);
    expect(fb.sets[0]).toMatchObject({ path: 'users/u1/settings/spoilerLevel', value: 2 });
  });

  it('ohne uid nur lokal', () => {
    setSpoilerLevel(undefined, 0);
    expect(getSpoilerLevel()).toBe(0);
    expect(fb.sets).toEqual([]);
  });

  it('ignoriert kaputte localStorage-Werte', () => {
    localStorage.setItem('spoilerLevel', 'kaputt');
    expect(getSpoilerLevel()).toBe(DEFAULT_SPOILER_LEVEL);
  });

  it('spiegelt den Remote-Wert beim Sync in den Cache', async () => {
    fb.store['users/u1/settings/spoilerLevel'] = 2;
    await syncSpoilerLevel('u1');
    expect(getSpoilerLevel()).toBe(2);
  });

  it('ignoriert ungültige Remote-Werte', async () => {
    fb.store['users/u1/settings/spoilerLevel'] = 7;
    await syncSpoilerLevel('u1');
    expect(getSpoilerLevel()).toBe(DEFAULT_SPOILER_LEVEL);
  });
});
