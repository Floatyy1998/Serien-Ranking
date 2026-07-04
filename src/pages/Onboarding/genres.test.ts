import { describe, expect, it } from 'vitest';
import { CURATED_GENRES } from './genres';

describe('CURATED_GENRES', () => {
  it('enthält 8 kuratierte Genres', () => {
    expect(CURATED_GENRES).toHaveLength(8);
  });

  it('jeder Eintrag hat vollständige, plausible Felder', () => {
    for (const g of CURATED_GENRES) {
      expect(g.slug.length, g.slug).toBeGreaterThan(0);
      expect(g.label.length, g.slug).toBeGreaterThan(0);
      expect(g.emoji.length, g.slug).toBeGreaterThan(0);
      expect(Number.isInteger(g.tvId), g.slug).toBe(true);
      expect(g.tvId, g.slug).toBeGreaterThan(0);
      expect(Number.isInteger(g.movieId), g.slug).toBe(true);
      expect(g.movieId, g.slug).toBeGreaterThan(0);
    }
  });

  it('slugs sind eindeutig', () => {
    const slugs = CURATED_GENRES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
