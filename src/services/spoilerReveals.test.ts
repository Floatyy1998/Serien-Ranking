// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  sets: [] as { path: string; value: unknown }[],
  updates: [] as { path: string; value: Record<string, unknown> }[],
  store: {} as Record<string, unknown>,
}));

vi.mock('./db/ref', () => ({
  serverTimestamp: () => 1234,
  dbRef: vi.fn((path: string) => ({
    set: (value: unknown) => {
      fb.sets.push({ path, value });
      return Promise.resolve();
    },
    update: (value: Record<string, unknown>) => {
      fb.updates.push({ path, value });
      return Promise.resolve();
    },
  })),
  dbGet: vi.fn(async (path: string) => fb.store[path] ?? null),
}));

import { isSpoilerRevealed, markSpoilerRevealed, syncSpoilerReveals } from './spoilerReveals';

beforeEach(() => {
  fb.sets = [];
  fb.updates = [];
  fb.store = {};
  localStorage.clear();
});

describe('markSpoilerRevealed', () => {
  it('schreibt lokal und nach Firebase', () => {
    markSpoilerRevealed('u1', 'spoiler_revealed_5_s1_e2');
    expect(isSpoilerRevealed('spoiler_revealed_5_s1_e2')).toBe(true);
    expect(fb.sets[0].path).toBe('users/u1/spoilerRevealed/spoiler_revealed_5_s1_e2');
  });

  it('ohne uid nur lokal', () => {
    markSpoilerRevealed(undefined, 'spoiler_revealed_5_s1_e2');
    expect(isSpoilerRevealed('spoiler_revealed_5_s1_e2')).toBe(true);
    expect(fb.sets).toEqual([]);
  });

  it('lehnt Keys mit Firebase-unsicheren Zeichen für den Remote-Write ab', () => {
    markSpoilerRevealed('u1', 'spoiler_revealed_a/b');
    expect(fb.sets).toEqual([]);
  });
});

describe('syncSpoilerReveals', () => {
  it('zieht Remote-Reveals in den lokalen Cache', async () => {
    fb.store['users/u1/spoilerRevealed'] = { spoiler_revealed_series_9: 1 };
    await syncSpoilerReveals('u1');
    expect(isSpoilerRevealed('spoiler_revealed_series_9')).toBe(true);
  });

  it('schiebt lokale Alt-Reveals hoch, die remote fehlen', async () => {
    localStorage.setItem('spoiler_revealed_movie_3', 'true');
    localStorage.setItem('unrelated_key', 'true');
    fb.store['users/u1/spoilerRevealed'] = { spoiler_revealed_series_9: 1 };
    await syncSpoilerReveals('u1');
    expect(fb.updates).toHaveLength(1);
    expect(Object.keys(fb.updates[0].value)).toEqual(['spoiler_revealed_movie_3']);
  });

  it('macht nichts, wenn lokal und remote deckungsgleich sind', async () => {
    localStorage.setItem('spoiler_revealed_movie_3', 'true');
    fb.store['users/u1/spoilerRevealed'] = { spoiler_revealed_movie_3: 1 };
    await syncSpoilerReveals('u1');
    expect(fb.updates).toEqual([]);
  });
});
