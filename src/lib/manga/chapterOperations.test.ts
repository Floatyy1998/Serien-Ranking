import { describe, expect, it } from 'vitest';
import { BULK_CHAPTER_THRESHOLD, toChapterOperations } from './chapterOperations';

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
