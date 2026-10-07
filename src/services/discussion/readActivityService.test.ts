import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock: ref(path).push(event) → sammelt {path, event} in `pushed`.
const fb = vi.hoisted(() => {
  const pushed: Array<{ path: string; event: Record<string, unknown> }> = [];
  return {
    pushed,
    ref: (path: string) => ({
      push: (event: Record<string, unknown>) => {
        pushed.push({ path, event });
        return Promise.resolve({ key: 'k' });
      },
    }),
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));

import { logChapterRead, logMangaRating } from './readActivityService';

const YEAR = new Date().getFullYear();
const eventsPath = (uid: string) => `users/${uid}/wrapped/${YEAR}/mangaEvents`;

function makeManga(overrides: Record<string, unknown> = {}) {
  return {
    anilistId: 555,
    title: 'One Piece',
    ...overrides,
  } as never;
}

beforeEach(() => {
  fb.pushed.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logChapterRead', () => {
  it('fasst einen Sprung über mehrere Kapitel in ein Event mit Bereich und Anzahl', async () => {
    await logChapterRead('u1', makeManga(), 6, 3);

    expect(fb.pushed).toHaveLength(1);
    const { path, event } = fb.pushed[0];
    expect(path).toBe(eventsPath('u1'));
    expect(event).toMatchObject({ t: 'ch', s: 555, st: 'One Piece', ch: 6, ch0: 4, n: 3 });
    expect(typeof event.ts).toBe('number');
  });

  it('schreibt bei einem Einzelkapitel weder Bereich noch Anzahl', async () => {
    await logChapterRead('u1', makeManga(), 7, 6);
    expect(fb.pushed[0].event).toMatchObject({ ch: 7 });
    expect(fb.pushed[0].event).not.toHaveProperty('n');
    expect(fb.pushed[0].event).not.toHaveProperty('ch0');
  });

  it('hängt optionale Felder an (vol, fmt, g, rw)', async () => {
    await logChapterRead(
      'u1',
      makeManga({
        currentVolume: 12,
        format: 'MANGA',
        genres: ['Action', 'Adventure'],
        rereadCount: 2,
      }),
      2,
      1
    );

    expect(fb.pushed).toHaveLength(1);
    const ev = fb.pushed[0].event;
    expect(ev.vol).toBe(12);
    expect(ev.fmt).toBe('MANGA');
    expect(ev.g).toEqual(['Action', 'Adventure']);
    expect(ev.rw).toBe(1);
  });

  it('lässt optionale Felder weg, wenn nicht vorhanden', async () => {
    await logChapterRead('u1', makeManga({ genres: [], rereadCount: 0 }), 1, 0);
    const ev = fb.pushed[0].event;
    expect(ev).not.toHaveProperty('vol');
    expect(ev).not.toHaveProperty('fmt');
    expect(ev).not.toHaveProperty('g');
    expect(ev).not.toHaveProperty('rw');
  });

  it('keine neuen Kapitel (chapterNumber == previousChapter) → keine Events', async () => {
    await logChapterRead('u1', makeManga(), 5, 5);
    expect(fb.pushed).toHaveLength(0);
  });
});

describe('logMangaRating', () => {
  it('pusht genau ein "rg"-Event mit rating', async () => {
    await logMangaRating('u1', makeManga(), 9);
    expect(fb.pushed).toHaveLength(1);
    const ev = fb.pushed[0].event;
    expect(fb.pushed[0].path).toBe(eventsPath('u1'));
    expect(ev.t).toBe('rg');
    expect(ev.s).toBe(555);
    expect(ev.st).toBe('One Piece');
    expect(ev.rat).toBe(9);
    expect(typeof ev.ts).toBe('number');
  });
});
