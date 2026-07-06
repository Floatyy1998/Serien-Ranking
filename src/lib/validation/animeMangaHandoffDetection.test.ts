import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Series } from '../../types/Series';
import type { AnimeMangaStaticEntry } from '../staticCatalog';

const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const readPath = (path?: string): unknown => {
    if (!path) return null;
    if (store.has(path)) return store.get(path);
    return null;
  };
  const makeRef = (path?: string) => ({
    once: async () => ({ val: () => readPath(path) }),
    update: async (m: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(m)) {
        if (v === null) store.delete(k);
        else store.set(k, v);
      }
    },
  });
  return { store, makeRef };
});
vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p?: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const settings = vi.hoisted(() => ({
  getSnoozedUntil: vi.fn(async () => ({}) as Record<string, number>),
  cleanupSnoozes: vi.fn(async () => {}),
}));
vi.mock('../settings/notificationSettings', () => settings);

const catalog = vi.hoisted(() => ({
  fetchStaticAnimeManga: vi.fn(async () => ({}) as Record<string, AnimeMangaStaticEntry> | null),
}));
vi.mock('../staticCatalog', () => catalog);

import { detectAnimeMangaHandoff } from './animeMangaHandoffDetection';

const UID = 'u1';

const ep = (o: { id?: number; episode_number?: number; watched?: boolean } = {}) => ({
  id: 1,
  name: 'E',
  air_date: '2020-01-01', // liegt in der Vergangenheit → aired
  watched: false,
  episode_number: 1,
  ...o,
});

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({ id: 1, title: 'Fairy Tail', seasons: [], rating: {}, ...o }) as unknown as Series;

const seasonWatched = (seasonNumber: number, watched: boolean) => ({
  seasonNumber,
  episodes: [
    ep({ id: seasonNumber * 10 + 1, watched }),
    ep({ id: seasonNumber * 10 + 2, episode_number: 2, watched }),
  ],
});

beforeEach(() => {
  fb.store.clear();
  settings.getSnoozedUntil.mockReset().mockResolvedValue({});
  settings.cleanupSnoozes.mockReset().mockResolvedValue(undefined);
  catalog.fetchStaticAnimeManga.mockReset().mockResolvedValue({});
});
afterEach(() => vi.clearAllMocks());

describe('detectAnimeMangaHandoff', () => {
  it('returns nothing when there is no bridge entry for the series', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({});
    const res = await detectAnimeMangaHandoff([makeSeries({ id: 1 })], UID);
    expect(res).toEqual([]);
  });

  it('surfaces a handoff for a fully-watched aired season with an estimate', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'Fairy Tail (Manga)', c: 545, s: { '1': 120 }, cf: 'med' },
    });
    const series = makeSeries({
      id: 1,
      seasons: [seasonWatched(0, true)] as Series['seasons'],
    });
    const res = await detectAnimeMangaHandoff([series], UID);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      seasonNumber: 1,
      mangaId: 999,
      mangaTitle: 'Fairy Tail (Manga)',
      estimatedChapter: 120,
      confidence: 'med',
    });
  });

  it('skips a season that is not fully watched', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: null, s: { '1': 120 } },
    });
    const series = makeSeries({ seasons: [seasonWatched(0, false)] as Series['seasons'] });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
  });

  it('picks the highest completed season when several qualify', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120, '2': 260 } },
    });
    const series = makeSeries({
      seasons: [seasonWatched(0, true), seasonWatched(1, true)] as Series['seasons'],
    });
    const res = await detectAnimeMangaHandoff([series], UID);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ seasonNumber: 2, estimatedChapter: 260 });
  });

  it('does not re-surface a season that was already dismissed', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120 } },
    });
    fb.store.set(`users/${UID}/animeMangaNotifications`, {
      '1-1': { dismissed: true, timestamp: 1 },
    });
    const series = makeSeries({ seasons: [seasonWatched(0, true)] as Series['seasons'] });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
  });
});
