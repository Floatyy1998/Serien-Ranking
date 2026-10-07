import { describe, expect, it } from 'vitest';
import type { Manga } from '../../types/Manga';
import { buildReadHistory, type MangaReadEvent } from './readHistory';

const NOW = new Date(2026, 9, 7, 18, 0).getTime();
const at = (daysAgo: number, hour: number) =>
  Math.floor(new Date(2026, 9, 7 - daysAgo, hour, 0).getTime() / 1000);

const manga = (over: Partial<Manga>): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Titel',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

const ch = (s: number, chapter: number, ts: number, extra: Partial<MangaReadEvent> = {}) =>
  ({ ts, t: 'ch', s, st: `Manga ${s}`, ch: chapter, ...extra }) as MangaReadEvent;

describe('buildReadHistory', () => {
  it('fasst Kapitel pro Tag und Manga zu Spannen zusammen', () => {
    const history = buildReadHistory(
      [ch(1, 74, at(0, 9)), ch(1, 75, at(0, 10)), ch(1, 76, at(0, 11)), ch(2, 33, at(0, 12))],
      [manga({ anilistId: 1, title: 'Solo Leveling' })],
      NOW,
      7
    );
    expect(history.days).toHaveLength(1);
    expect(history.days[0].chapters).toBe(4);
    const [berserk, solo] = history.days[0].entries;
    expect(berserk.title).toBe('Manga 2');
    expect(solo).toMatchObject({
      title: 'Solo Leveling',
      fromChapter: 74,
      toChapter: 76,
      chapters: 3,
    });
  });

  it('trennt Lesetage nach lokalem Kalendertag, neueste zuerst', () => {
    const history = buildReadHistory(
      [ch(1, 1, at(2, 23)), ch(1, 2, at(1, 0)), ch(1, 3, at(0, 8))],
      [],
      NOW,
      7
    );
    expect(history.days.map((d) => d.chapters)).toEqual([1, 1, 1]);
    expect(history.activeDays).toBe(3);
    expect(history.days[0].date).toBeGreaterThan(history.days[1].date);
  });

  it('ignoriert Bewertungen und Ereignisse außerhalb des Zeitraums', () => {
    const history = buildReadHistory(
      [ch(1, 1, at(10, 9)), { ts: at(0, 9), t: 'rg', s: 1 }],
      [],
      NOW,
      7
    );
    expect(history.days).toEqual([]);
  });

  it('nimmt Manga ohne Ereignisse mit ihrem letzten Lesestand auf', () => {
    const history = buildReadHistory(
      [],
      [
        manga({
          anilistId: 5,
          title: 'Alt',
          currentChapter: 40,
          lastReadAt: new Date(2026, 9, 5, 20).toISOString(),
        }),
      ],
      NOW,
      7
    );
    expect(history.days[0].entries[0]).toMatchObject({ toChapter: 40, chapters: null });
    expect(history.totalChapters).toBe(0);
    expect(history.mangaCount).toBe(1);
  });

  it('zählt Sprünge über mehrere Kapitel als ein Ereignis mit Anzahl', () => {
    const history = buildReadHistory(
      [ch(1, 120, at(0, 9), { ch0: 101, n: 20 }), ch(1, 121, at(0, 10))],
      [],
      NOW,
      7
    );
    expect(history.days[0].entries[0]).toMatchObject({
      fromChapter: 101,
      toChapter: 121,
      chapters: 21,
    });
  });

  it('zählt nachgetragene Lesestände nicht als gelesene Kapitel', () => {
    const history = buildReadHistory(
      [ch(1, 1177, at(0, 9), { ch0: 1, n: 1177 }), ch(2, 5, at(0, 10))],
      [],
      NOW,
      7
    );
    const imported = history.days[0].entries.find((e) => e.anilistId === 1);
    expect(imported).toMatchObject({ imported: true, chapters: null, toChapter: 1177 });
    expect(history.totalChapters).toBe(1);
  });

  it('markiert erneutes Lesen', () => {
    const history = buildReadHistory([ch(1, 3, at(0, 9), { rw: 1 })], [], NOW, 1);
    expect(history.days[0].entries[0].reread).toBe(true);
  });
});
