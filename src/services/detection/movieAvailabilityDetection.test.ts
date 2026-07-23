// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Movie } from '../../types/Movie';

const fb = vi.hoisted(() => {
  const state = {
    providerData: null as Record<string, { known?: string[]; subSince?: number }> | null,
    updates: [] as Record<string, unknown>[],
    notifications: [] as Record<string, unknown>[],
  };
  return state;
});

vi.mock('../db/ref', () => ({
  userPath: (_uid: string, ...parts: (string | number)[]) => parts.join('/'),
  dbGet: vi.fn(async (path: string) => (path === 'movieProviderData' ? fb.providerData : null)),
  dbRef: vi.fn((path: string) => ({
    update: async (u: Record<string, unknown>) => {
      fb.updates.push(u);
    },
    push: async (n: Record<string, unknown>) => {
      if (path === 'notifications') fb.notifications.push(n);
    },
  })),
}));

vi.mock('../i18n', () => ({ isEnglish: () => false }));

import { detectMovieAvailability } from './movieAvailabilityDetection';

function movie(id: number, providers: string[], watched = false): Movie {
  return {
    id,
    title: `Movie ${id}`,
    watched,
    provider: { provider: providers.map((name) => ({ id: 0, name, logo: '' })) },
  } as unknown as Movie;
}

beforeEach(() => {
  fb.providerData = null;
  fb.updates = [];
  fb.notifications = [];
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('detectMovieAvailability', () => {
  it('Baseline beim ersten Lauf: schreibt State, meldet nichts', async () => {
    const res = await detectMovieAvailability('u1', [movie(1, ['Netflix'])], new Set(['Netflix']));
    expect(res.newlyAvailable).toHaveLength(0);
    expect(fb.notifications).toHaveLength(0);
    expect(fb.updates[0]?.['1/known']).toEqual(['Netflix']);
    expect(typeof fb.updates[0]?.['1/subSince']).toBe('number');
    // Aktuell verfügbar wird trotzdem gelistet (für die Home-Sektion)
    expect(res.availableNow).toHaveLength(1);
  });

  it('Übergang: Film landet neu auf einem aktiven Abo → Meldung + Notification', async () => {
    fb.providerData = { '1': { known: ['Apple TV'] } };
    const res = await detectMovieAvailability(
      'u1',
      [movie(1, ['Apple TV', 'Netflix'])],
      new Set(['Netflix'])
    );
    expect(res.newlyAvailable).toHaveLength(1);
    expect(res.newlyAvailable[0].providers).toEqual(['Netflix']);
    expect(fb.notifications).toHaveLength(1);
    expect(fb.notifications[0].type).toBe('movie_available');
    expect(typeof fb.updates[0]?.['1/subSince']).toBe('number');
  });

  it('bereits bekannter Abo-Provider meldet nicht erneut', async () => {
    fb.providerData = { '1': { known: ['Netflix'], subSince: 123 } };
    const res = await detectMovieAvailability('u1', [movie(1, ['Netflix'])], new Set(['Netflix']));
    expect(res.newlyAvailable).toHaveLength(0);
    expect(fb.notifications).toHaveLength(0);
    expect(res.availableNow[0]?.subSince).toBe(123);
  });

  it('gesehene Filme werden ignoriert', async () => {
    const res = await detectMovieAvailability(
      'u1',
      [movie(1, ['Netflix'], true)],
      new Set(['Netflix'])
    );
    expect(res.availableNow).toHaveLength(0);
    expect(fb.updates).toHaveLength(0);
  });

  it('per Bewertung (genre-keyed) gesehene Filme werden ebenfalls ignoriert', async () => {
    const rated = { ...movie(1, ['Netflix']), rating: { Action: 8 } } as unknown as Movie;
    const res = await detectMovieAvailability('u1', [rated], new Set(['Netflix']));
    expect(res.availableNow).toHaveLength(0);
    expect(fb.updates).toHaveLength(0);
  });

  it('gedrosselt: liefert availableNow, schreibt aber keinen State', async () => {
    localStorage.setItem('movieAvailCheck_u1', String(Date.now()));
    fb.providerData = { '1': { known: ['Apple TV'] } };
    const res = await detectMovieAvailability('u1', [movie(1, ['Netflix'])], new Set(['Netflix']));
    expect(res.availableNow).toHaveLength(1);
    expect(res.newlyAvailable).toHaveLength(0);
    expect(fb.updates).toHaveLength(0);
    expect(fb.notifications).toHaveLength(0);
  });

  it('vom Abo verschwunden: subSince wird zurückgesetzt', async () => {
    fb.providerData = { '1': { known: ['Netflix'], subSince: 123 } };
    await detectMovieAvailability('u1', [movie(1, ['Apple TV'])], new Set(['Netflix']));
    expect(fb.updates[0]?.['1/subSince']).toBeNull();
  });
});
