import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  sets: [] as { path: string; value: unknown }[],
  store: {} as Record<string, unknown>,
}));

vi.mock('./db/ref', () => ({
  serverTimestamp: () => 1234,
  dbRef: vi.fn((path: string) => ({
    set: async (value: unknown) => {
      fb.sets.push({ path, value });
    },
  })),
  dbGet: vi.fn(async (path: string) => fb.store[path] ?? null),
}));

import { blockRecommendation, fetchBlockedRecommendations } from './recFeedbackService';

beforeEach(() => {
  fb.sets = [];
  fb.store = {};
});

describe('blockRecommendation', () => {
  it('schreibt einen Negativ-Eintrag unter users/$uid/recFeedback', async () => {
    await blockRecommendation('u1', 42, 'series');
    expect(fb.sets).toHaveLength(1);
    expect(fb.sets[0].path).toBe('users/u1/recFeedback/42');
    expect(fb.sets[0].value).toMatchObject({ v: -1, t: 'series' });
  });

  it('ohne uid oder id passiert nichts', async () => {
    await blockRecommendation('', 42, 'movie');
    await blockRecommendation('u1', 0, 'movie');
    expect(fb.sets).toEqual([]);
  });
});

describe('fetchBlockedRecommendations', () => {
  it('liefert nur Einträge mit negativem Votum als Zahlen-Set', async () => {
    fb.store['users/u1/recFeedback'] = {
      '42': { v: -1, t: 'series', ts: 1 },
      '43': { v: 1, t: 'series', ts: 1 },
      abc: { v: -1, t: 'movie', ts: 1 },
    };
    const set = await fetchBlockedRecommendations('u1');
    expect([...set]).toEqual([42]);
  });

  it('liefert ein leeres Set ohne Daten oder uid', async () => {
    expect((await fetchBlockedRecommendations('u1')).size).toBe(0);
    expect((await fetchBlockedRecommendations('')).size).toBe(0);
  });
});
