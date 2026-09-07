import { describe, expect, it } from 'vitest';
import { getSlideThemes } from './wrappedSlideThemes';

// getSlideThemes liest nur primary/accent aus currentTheme.
const theme = { primary: '#00d123', accent: '#008a6e' } as unknown as Parameters<
  typeof getSlideThemes
>[0];

describe('getSlideThemes', () => {
  it('liefert für jeden bekannten Slide einen Gradient', () => {
    const themes = getSlideThemes(theme);
    const keys = [
      'intro',
      'totalTime',
      'topSeries',
      'topMovies',
      'topGenres',
      'topProviders',
      'timePattern',
      'bingeStats',
      'achievements',
      'monthlyBreakdown',
      'summary',
    ];
    for (const key of keys) {
      expect(themes[key as keyof typeof themes]).toContain('linear-gradient');
    }
  });

  it('interpoliert die Theme-Farben in intro/summary/topProviders', () => {
    const themes = getSlideThemes(theme);
    expect(themes.intro).toBe('linear-gradient(135deg, #00d123 0%, #008a6e 100%)');
    expect(themes.summary).toBe('linear-gradient(135deg, #00d123 0%, #008a6e 100%)');
    expect(themes.topProviders).toContain('#008a6e');
  });

  it('verwendet feste Gradienten für theme-unabhängige Slides', () => {
    const themes = getSlideThemes(theme);
    expect(themes.totalTime).toBe('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)');
    expect(themes.topSeries).toBe('linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)');
  });

  it('reagiert auf geänderte Theme-Farben', () => {
    const custom = getSlideThemes({
      primary: '#ff0000',
      accent: '#0000ff',
    } as unknown as Parameters<typeof getSlideThemes>[0]);
    expect(custom.intro).toBe('linear-gradient(135deg, #ff0000 0%, #0000ff 100%)');
  });
});
