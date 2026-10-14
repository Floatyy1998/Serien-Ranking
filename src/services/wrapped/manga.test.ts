import { describe, expect, it } from 'vitest';
import { calculateMangaStats, type WrappedMangaEvent } from './manga';

const ts = (month: number, day = 1) => Math.floor(new Date(2026, month, day, 12).getTime() / 1000);

describe('calculateMangaStats', () => {
  it('liefert null ohne gelesene Kapitel im Jahr', () => {
    expect(calculateMangaStats([], 2026)).toBe(null);
    expect(
      calculateMangaStats(
        [{ ts: Math.floor(new Date(2025, 5, 1).getTime() / 1000), t: 'ch', s: 1 }],
        2026
      )
    ).toBe(null);
  });

  it('zählt Einzel- und Sammel-Ereignisse und sortiert die Top-Manga', () => {
    const events: WrappedMangaEvent[] = [
      { ts: ts(2), t: 'ch', s: 1, st: 'Solo Leveling', ch: 10 },
      {
        ts: ts(2),
        t: 'ch',
        s: 1,
        st: 'Solo Leveling',
        ch: 30,
        ch0: 11,
        n: 20,
      } as WrappedMangaEvent,
      { ts: ts(5), t: 'ch', s: 2, st: 'Berserk', ch: 3 },
      { ts: ts(5), t: 'rg', s: 2, st: 'Berserk', rat: 9 },
    ];
    const stats = calculateMangaStats(events, 2026);
    expect(stats).toMatchObject({ totalChapters: 22, uniqueManga: 2, mostReadMonth: 2 });
    expect(stats?.mostReadMonthChapters).toBe(21);
    expect(stats?.topManga.map((m) => [m.title, m.chapters])).toEqual([
      ['Solo Leveling', 21],
      ['Berserk', 1],
    ]);
    expect(stats?.topManga[1].rating).toBe(9);
  });

  it('ignoriert nachgetragene Lesestände (großer Sprung auf einmal)', () => {
    const stats = calculateMangaStats(
      [
        { ts: ts(1), t: 'ch', s: 1, st: 'One Piece', ch: 1177, ch0: 1, n: 1177 },
        { ts: ts(3), t: 'ch', s: 1, st: 'One Piece', ch: 1178 },
      ],
      2026
    );
    expect(stats?.totalChapters).toBe(1);
    expect(stats?.topManga[0]).toMatchObject({ title: 'One Piece', chapters: 1 });
  });
});

describe('calculateMangaStats mit Bänden', () => {
  it('zählt Bände der Print-Leser und liefert auch ohne Kapitel eine Bilanz', () => {
    const stats = calculateMangaStats(
      [
        { ts: ts(3), t: 'vol', s: 7, st: 'Dead Mount Death Play', vol: 1 },
        { ts: ts(3, 5), t: 'vol', s: 7, vol: 3, v0: 2, n: 2 },
        { ts: ts(4), t: 'vol', s: 8, st: 'Frieren', vol: 1 },
      ],
      2026
    );
    expect(stats).toMatchObject({
      totalChapters: 0,
      totalVolumes: 4,
      uniqueManga: 2,
      mostReadMonth: 3,
      mostReadMonthVolumes: 3,
    });
    expect(stats?.topManga[0]).toMatchObject({ title: 'Dead Mount Death Play', volumes: 3 });
  });

  it('lässt nachgetragene Bandstände weg', () => {
    expect(calculateMangaStats([{ ts: ts(3), t: 'vol', s: 7, vol: 20, v0: 1, n: 20 }], 2026)).toBe(
      null
    );
  });
});
