import { describe, expect, it } from 'vitest';
import type { BundledTitle } from '../../../lib/social/activityBundles';
import { formatActivityRating } from './activityText';

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
