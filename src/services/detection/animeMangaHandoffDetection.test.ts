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
vi.mock('../../lib/settings/notificationSettings', () => settings);

const catalog = vi.hoisted(() => ({
  fetchStaticAnimeManga: vi.fn(async () => ({}) as Record<string, AnimeMangaStaticEntry> | null),
}));
vi.mock('../staticCatalog', () => catalog);

import { detectAnimeMangaHandoff } from './animeMangaHandoffDetection';

const UID = 'u1';

const RECENT = new Date().toISOString(); // innerhalb des 7-Tage-Fensters
const OLD = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // vor 60 Tagen

const ep = (
  o: {
    id?: number;
    episode_number?: number;
    watched?: boolean;
    lastWatchedAt?: string;
    air_date?: string;
  } = {}
) => ({
  id: 1,
  name: 'E',
  air_date: '2020-01-01', // liegt in der Vergangenheit → aired
  watched: false,
  episode_number: 1,
  ...o,
});

const makeSeries = (o: Partial<Series> = {}): Series =>
  ({ id: 1, title: 'Fairy Tail', seasons: [], rating: {}, ...o }) as unknown as Series;

// Gesehene Staffeln bekommen standardmäßig einen kürzlichen Abschluss-Zeitstempel.
const seasonWatched = (seasonNumber: number, watched: boolean, lastWatchedAt = RECENT) => ({
  seasonNumber,
  episodes: [
    ep({ id: seasonNumber * 10 + 1, watched, lastWatchedAt: watched ? lastWatchedAt : undefined }),
    ep({
      id: seasonNumber * 10 + 2,
      episode_number: 2,
      watched,
      lastWatchedAt: watched ? lastWatchedAt : undefined,
    }),
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

  it('meldet die letzte Staffel, wenn der ganze Anime gesehen ist', async () => {
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

  it('does NOT surface seasons completed long ago (kein rückwirkendes Feuern)', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120 } },
    });
    const series = makeSeries({ seasons: [seasonWatched(0, true, OLD)] as Series['seasons'] });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
  });

  it('does not surface a completed season without any watch timestamp', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120 } },
    });
    // watched:true, aber lastWatchedAt bewusst entfernt → keine Recency ableitbar
    const series = makeSeries({
      seasons: [
        { seasonNumber: 0, episodes: [ep({ id: 1, watched: true }), ep({ id: 2, watched: true })] },
      ] as Series['seasons'],
    });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
  });

  it('meldet nichts, solange eine spaetere Staffel noch offen ist', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120, '2': 260 } },
    });
    // Staffel 1 durch, Staffel 2 liegt vor und ist ungesehen — genau der Fall,
    // in dem der Hinweis frueher nach jedem Finale kam.
    const series = makeSeries({
      seasons: [seasonWatched(0, true), seasonWatched(1, false)] as Series['seasons'],
    });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
  });

  it('meldet nichts, wenn noch eine Folge mit Termin aussteht', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120 } },
    });
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const series = makeSeries({
      seasons: [
        {
          seasonNumber: 0,
          episodes: [
            ep({ id: 1, watched: true, lastWatchedAt: RECENT }),
            ep({ id: 2, episode_number: 2, air_date: future }),
          ],
        },
      ] as Series['seasons'],
    });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
  });

  it('meldet auch bei laufender Serie, wenn kein Termin aussteht', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120 } },
    });
    // Zwischen zwei Anime-Staffeln liegen oft Jahre — genau dann will man
    // weiterlesen. Der Serienstatus darf das nicht blockieren.
    const series = makeSeries({
      status: 'Returning Series',
      seasons: [seasonWatched(0, true)] as Series['seasons'],
    });
    const res = await detectAnimeMangaHandoff([series], UID);
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({ seasonNumber: 1, estimatedChapter: 120 });
  });

  it('schweigt, wenn fuer die letzte Staffel keine Schaetzung vorliegt', async () => {
    catalog.fetchStaticAnimeManga.mockResolvedValue({
      // nur Staffel 1 geschaetzt, gesehen sind aber beide
      '1': { m: 999, t: 'M', c: 545, s: { '1': 120 } },
    });
    const series = makeSeries({
      seasons: [seasonWatched(0, true), seasonWatched(1, true)] as Series['seasons'],
    });
    expect(await detectAnimeMangaHandoff([series], UID)).toEqual([]);
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
