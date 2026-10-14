import { describe, expect, it } from 'vitest';
import type { Manga } from '../../types/Manga';
import {
  hasReadProgress,
  mangaRemainingLabel,
  mangaStand,
  mangaStandLabel,
  mangaTotalVolumes,
  mangaUnit,
  volumesLabel,
} from './progress';

const manga = (over: Partial<Manga> = {}): Manga => ({
  nmr: 1,
  anilistId: 1,
  title: 'Dead Mount Death Play',
  poster: 'p.jpg',
  rating: {},
  currentChapter: 0,
  readStatus: 'reading',
  ...over,
});

describe('Lesestand je Zählweise', () => {
  it('zählt ohne Einstellung in Kapiteln, mit dem höheren bekannten Total', () => {
    const stand = mangaStand(
      manga({ currentChapter: 30, chapters: 40, latestChapterAvailable: 60 })
    );
    expect(stand).toEqual({ unit: 'chapter', current: 30, total: 60, remaining: 30, percent: 50 });
    expect(mangaStandLabel(manga({ currentChapter: 30, chapters: 40 }))).toBe('Kap. 30 / 40');
  });

  it('zählt Print-Leser in Bänden — Kapitelstand bleibt außen vor', () => {
    const m = manga({ trackBy: 'volumes', currentChapter: 80, currentVolume: 4, volumes: 16 });
    expect(mangaUnit(m)).toBe('volume');
    expect(mangaStand(m)).toEqual({
      unit: 'volume',
      current: 4,
      total: 16,
      remaining: 12,
      percent: 25,
    });
    expect(mangaStandLabel(m)).toBe('Bd. 4 / 16');
  });

  it('nimmt für laufende Reihen die Bandzahl von MangaUpdates', () => {
    const m = manga({
      trackBy: 'volumes',
      currentVolume: 2,
      volumes: null,
      latestVolumeAvailable: 16,
    });
    expect(mangaTotalVolumes(m)).toBe(16);
    expect(mangaStand(m, 17).total).toBe(17);
  });

  it('zeigt ohne Gesamtzahl nur den Band und ohne Stand nichts', () => {
    expect(mangaStandLabel(manga({ trackBy: 'volumes', currentVolume: 3 }))).toBe('Bd. 3');
    expect(mangaStandLabel(manga({ trackBy: 'volumes' }))).toBe('');
    expect(mangaStandLabel(manga({ trackBy: 'volumes' }), true)).toBe('Bd. 0');
    expect(hasReadProgress(manga({ trackBy: 'volumes', currentChapter: 12 }))).toBe(false);
  });

  it('nennt offene Bände mit Einheit und richtiger Einzahl', () => {
    const stand = (current: number) =>
      mangaStand(manga({ trackBy: 'volumes', currentVolume: current, volumes: 5 }));
    expect(mangaRemainingLabel(stand(4))).toBe('1 Band übrig');
    expect(mangaRemainingLabel(stand(2))).toBe('3 Bände übrig');
    expect(mangaRemainingLabel(stand(5))).toBe('');
    expect(mangaRemainingLabel(mangaStand(manga({ currentChapter: 8, chapters: 10 })))).toBe(
      '2 übrig'
    );
    expect(volumesLabel(1)).toBe('1 Band');
    expect(volumesLabel(7)).toBe('7 Bände');
  });
});
