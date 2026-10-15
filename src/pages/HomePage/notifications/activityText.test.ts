import { describe, expect, it } from 'vitest';
import type { ActivityBundle, BundledTitle } from '../../../lib/social/activityBundles';
import { bundleTimeRange, formatActivityRating, mediaBreakdown, titleTime } from './activityText';

const title = (over: Partial<BundledTitle>): BundledTitle =>
  ({ title: 'Momo', actions: ['rated'], ...over }) as BundledTitle;

describe('formatActivityRating', () => {
  it('zeigt Buchbewertungen wie Serien und Filme auf 0–10', () => {
    expect(formatActivityRating(title({ media: 'book', rating: 8.5 }))).toBe('8.5/10');
    expect(formatActivityRating(title({ media: 'series', rating: 7 }))).toBe('7/10');
  });

  it('liefert ohne Bewertung nichts', () => {
    expect(formatActivityRating(title({ media: 'book' }))).toBeNull();
  });
});

const bundleOf = (titles: Partial<BundledTitle>[], earliest: number, latest: number) =>
  ({
    id: 'b',
    userId: 'u',
    userName: 'U',
    earliest,
    latest,
    titles: titles.map((over) => title(over)),
  }) as ActivityBundle;

describe('mediaBreakdown', () => {
  it('zählt je Medium in fester Reihenfolge', () => {
    const bundle = bundleOf(
      [{ media: 'book' }, { media: 'series' }, { media: 'book' }, { media: 'movie' }],
      0,
      0
    );
    expect(mediaBreakdown(bundle).map((m) => m.label)).toEqual(['1 Serie', '1 Film', '2 Bücher']);
  });
});

describe('bundleTimeRange', () => {
  it('bleibt bei einem kurzen Rutsch leer', () => {
    const at = new Date(2026, 9, 15, 14, 0).getTime();
    expect(bundleTimeRange(bundleOf([{ media: 'book' }], at - 5 * 60_000, at))).toBeNull();
  });

  it('nennt Anfang und Ende, wenn die Sitzung länger lief', () => {
    const start = new Date(2026, 9, 15, 13, 20).getTime();
    const end = new Date(2026, 9, 15, 14, 12).getTime();
    expect(bundleTimeRange(bundleOf([{ media: 'book' }], start, end))).toBe('13:20–14:12');
  });
});

describe('titleTime', () => {
  const now = new Date(2026, 9, 15, 18, 0).getTime();

  it('zeigt heute nur die Uhrzeit', () => {
    expect(titleTime(new Date(2026, 9, 15, 14, 5).getTime(), now)).toBe('14:05');
  });

  it('nennt gestern beim Namen', () => {
    expect(titleTime(new Date(2026, 9, 14, 22, 10).getTime(), now)).toBe('Gestern 22:10');
  });
});
