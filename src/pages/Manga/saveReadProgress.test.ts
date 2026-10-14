import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Manga } from '../../types/Manga';

const fb = vi.hoisted(() => ({ update: vi.fn().mockResolvedValue(undefined), path: '' }));
vi.mock('../../services/db/ref', () => ({
  paths: { mangaItem: (uid: string, id: number) => `users/${uid}/manga/${id}` },
  dbRef: (path: string) => {
    fb.path = path;
    return { update: fb.update };
  },
}));

const log = vi.hoisted(() => ({
  chapter: vi.fn().mockResolvedValue(undefined),
  volume: vi.fn().mockResolvedValue(undefined),
  activity: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../services/discussion/readActivityService', () => ({
  logChapterRead: log.chapter,
  logVolumeRead: log.volume,
}));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logReadingActivity: log.activity,
}));

import { saveReadProgress } from './saveReadProgress';

const manga = (over: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 42,
  title: 'Dead Mount Death Play',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  status: 'FINISHED',
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('saveReadProgress', () => {
  it('schreibt Kapitel und protokolliert den Sprung', async () => {
    await saveReadProgress('u1', manga({ currentChapter: 4 }), { next: 6, previous: 4, total: 40 });
    expect(fb.path).toBe('users/u1/manga/42');
    expect(fb.update.mock.calls[0][0]).toMatchObject({ currentChapter: 6 });
    expect(fb.update.mock.calls[0][0]).not.toHaveProperty('currentVolume');
    expect(log.chapter).toHaveBeenCalledWith('u1', expect.anything(), 6, 4);
    expect(log.volume).not.toHaveBeenCalled();
  });

  it('schreibt bei Print-Lesern den Band und beginnt geplante Manga', async () => {
    const m = manga({ trackBy: 'volumes', readStatus: 'planned', currentVolume: 0 });
    await saveReadProgress('u1', m, { next: 3, previous: 0, total: 16 });
    const updates = fb.update.mock.calls[0][0];
    expect(updates).toMatchObject({ currentVolume: 3, readStatus: 'reading' });
    expect(updates).not.toHaveProperty('currentChapter');
    expect(typeof updates.startedAt).toBe('string');
    expect(log.volume).toHaveBeenCalledWith('u1', m, 3, 0);
    expect(log.chapter).not.toHaveBeenCalled();
  });

  it('schließt eine fertige Reihe mit dem letzten Band ab und meldet es im Feed', async () => {
    const m = manga({ trackBy: 'volumes', currentVolume: 15, volumes: 16 });
    await saveReadProgress('u1', m, { next: 16, previous: 15, total: 16 });
    expect(fb.update.mock.calls[0][0]).toMatchObject({ readStatus: 'completed' });
    expect(log.activity).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ type: 'manga_finished' })
    );
  });

  it('schließt laufende Reihen nicht ab und protokolliert keinen Rückschritt', async () => {
    const m = manga({ trackBy: 'volumes', currentVolume: 16, status: 'RELEASING' });
    await saveReadProgress('u1', m, { next: 15, previous: 16, total: 16 });
    expect(fb.update.mock.calls[0][0]).not.toHaveProperty('readStatus');
    expect(log.volume).not.toHaveBeenCalled();
    expect(log.activity).not.toHaveBeenCalled();
  });
});
