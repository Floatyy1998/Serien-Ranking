import { afterEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const calls = {
    updates: [] as Record<string, unknown>[],
    sets: [] as { path?: string; val: unknown }[],
    transactions: [] as ((cur: unknown) => unknown)[],
  };
  const makeRef = (path?: string) => ({
    update: async (m: Record<string, unknown>) => {
      calls.updates.push(m);
    },
    set: async (v: unknown) => {
      calls.sets.push({ path, val: v });
    },
    once: async () => ({ val: () => null }),
    transaction: async (fn: (cur: unknown) => unknown) => {
      calls.transactions.push(fn);
    },
  });
  return { calls, makeRef };
});
vi.mock('firebase/compat/app', () => ({
  default: {
    database: Object.assign(() => ({ ref: (p?: string) => fb.makeRef(p) }), {
      ServerValue: { TIMESTAMP: '__ts__' },
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

import { updateWithSeriesVersion, bumpSeriesVersion, dbUpdate, updateIfExists } from './ref';

afterEach(() => {
  fb.calls.updates.length = 0;
  fb.calls.sets.length = 0;
  fb.calls.transactions.length = 0;
});

describe('db ref helpers', () => {
  it('updateWithSeriesVersion appends the serienVersion bump to the map', async () => {
    await updateWithSeriesVersion('u1', { 'users/u1/series/42/rating': { Action: 8 } });
    expect(fb.calls.updates[0]).toEqual({
      'users/u1/series/42/rating': { Action: 8 },
      'users/u1/meta/serienVersion': '__ts__',
    });
  });

  it('bumpSeriesVersion sets the version node to the server timestamp', async () => {
    await bumpSeriesVersion('u1');
    expect(fb.calls.sets[0]).toEqual({ path: 'users/u1/meta/serienVersion', val: '__ts__' });
  });

  it('dbUpdate applies a raw multi-path map at the root', async () => {
    await dbUpdate({ a: 1, b: 2 });
    expect(fb.calls.updates[0]).toEqual({ a: 1, b: 2 });
  });

  it('updateIfExists merges into an existing node and aborts on a deleted one', async () => {
    await updateIfExists('users/u1/manga/7', { readStatus: 'completed' });
    const fn = fb.calls.transactions[0];
    expect(fn({ title: 'X', readStatus: 'reading' })).toEqual({
      title: 'X',
      readStatus: 'completed',
    });
    expect(fn(null)).toBeUndefined();
  });
});
