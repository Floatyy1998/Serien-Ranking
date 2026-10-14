import { describe, expect, it } from 'vitest';
import {
  BULK_CHAPTER_THRESHOLD,
  BULK_VOLUME_THRESHOLD,
  toChapterOperations,
  toVolumeOperations,
} from './chapterOperations';

describe('toChapterOperations', () => {
  it('bündelt Alt-Ereignisse mit gleichem Zeitstempel zu einem Vorgang', () => {
    const events = Array.from({ length: 3 }, (_, i) => ({
      ts: 100,
      t: 'ch' as const,
      s: 1,
      ch: i + 5,
    }));
    const [op] = toChapterOperations(events);
    expect(op).toMatchObject({ s: 1, from: 5, to: 7, chapters: 3, bulk: false });
  });

  it('erkennt nachgetragene Stände über der Schwelle — alt wie neu', () => {
    const legacy = Array.from({ length: BULK_CHAPTER_THRESHOLD + 1 }, (_, i) => ({
      ts: 200,
      t: 'ch' as const,
      s: 2,
      ch: i + 1,
    }));
    const ops = toChapterOperations([
      ...legacy,
      { ts: 300, t: 'ch', s: 3, ch: 1177, ch0: 1, n: 1177 },
      { ts: 400, t: 'ch', s: 3, ch: 1180, ch0: 1178, n: 3 },
      { ts: 500, t: 'rg', s: 3 },
    ]);
    expect(ops.map((o) => [o.s, o.chapters, o.bulk])).toEqual([
      [2, BULK_CHAPTER_THRESHOLD + 1, true],
      [3, 1177, true],
      [3, 3, false],
    ]);
  });
});

describe('toVolumeOperations', () => {
  it('liest Band-Ereignisse als Vorgänge und lässt Kapitel aus', () => {
    const ops = toVolumeOperations([
      { ts: 10, t: 'vol', s: 1, st: 'Dead Mount Death Play', vol: 1 },
      { ts: 20, t: 'vol', s: 1, vol: 4, v0: 2, n: 3, rw: 1 },
      { ts: 30, t: 'ch', s: 2, ch: 5 },
    ]);
    expect(ops).toEqual([
      {
        s: 1,
        st: 'Dead Mount Death Play',
        ts: 10,
        from: 1,
        to: 1,
        volumes: 1,
        reread: false,
        bulk: false,
      },
      { s: 1, st: undefined, ts: 20, from: 2, to: 4, volumes: 3, reread: true, bulk: false },
    ]);
    expect(toChapterOperations([{ ts: 10, t: 'vol', s: 1, vol: 1 }])).toEqual([]);
  });

  it('wertet das Nachtragen vieler Bände auf einmal als Stand, nicht als Lesen', () => {
    const n = BULK_VOLUME_THRESHOLD + 1;
    const [op] = toVolumeOperations([{ ts: 10, t: 'vol', s: 1, vol: n, v0: 1, n }]);
    expect(op.bulk).toBe(true);
  });
});
