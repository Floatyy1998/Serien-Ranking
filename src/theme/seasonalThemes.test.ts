import { describe, expect, it } from 'vitest';
import { defaultThemeConfig, validateThemeConfig } from './dynamicTheme';
import {
  activeSeason,
  currentSeason,
  resolveThemeConfig,
  SEASON_PALETTES,
  setSeasonPreview,
  withActiveSeasonOff,
  withSeasonFlag,
} from './seasonalThemes';

const OCT = new Date(2026, 9, 11);
const DEC = new Date(2026, 11, 10);
const SILVESTER = new Date(2026, 11, 31);
const MAR = new Date(2027, 2, 1);

describe('seasonalThemes', () => {
  it('knows the season windows', () => {
    expect(currentSeason(new Date(2026, 9, 1))).toBe('spooky');
    expect(currentSeason(new Date(2026, 9, 31))).toBe('spooky');
    expect(currentSeason(new Date(2026, 10, 1))).toBeNull();
    expect(currentSeason(new Date(2026, 11, 26))).toBe('christmas');
    expect(currentSeason(new Date(2026, 11, 27))).toBe('newyear');
    expect(currentSeason(new Date(2027, 0, 6))).toBe('newyear');
    expect(currentSeason(new Date(2027, 0, 7))).toBeNull();
    expect(currentSeason(new Date(2027, 1, 1))).toBe('valentine');
    expect(currentSeason(new Date(2027, 1, 14))).toBe('valentine');
    expect(currentSeason(new Date(2027, 1, 15))).toBeNull();
  });

  it('is on by default during its season and off outside', () => {
    expect(activeSeason({}, OCT)).toBe('spooky');
    expect(activeSeason({}, DEC)).toBe('christmas');
    expect(activeSeason({}, SILVESTER)).toBe('newyear');
    expect(activeSeason({}, MAR)).toBeNull();
  });

  it('respects an opt-out and ignores anything but false', () => {
    expect(activeSeason({ seasons: { spooky: false } }, OCT)).toBeNull();
    expect(activeSeason({ seasons: { spooky: false } }, DEC)).toBe('christmas');
    expect(activeSeason({ seasons: { christmas: true } }, OCT)).toBe('spooky');
    expect(activeSeason({ seasons: { newyear: true } }, MAR)).toBeNull();
  });

  it('stores only the opt-out', () => {
    expect(withSeasonFlag({ spooky: false }, 'spooky', true)).toBeUndefined();
    expect(withSeasonFlag(undefined, 'spooky', false)).toEqual({ spooky: false });
    expect(withSeasonFlag({ christmas: false }, 'spooky', false)).toEqual({
      christmas: false,
      spooky: false,
    });
  });

  it('can preview a season outside its window', () => {
    setSeasonPreview('christmas');
    expect(activeSeason({}, MAR)).toBe('christmas');
    setSeasonPreview(null);
    expect(activeSeason({}, MAR)).toBeNull();
  });

  it('turns only the running design off when colors change', () => {
    expect(withActiveSeasonOff({}, OCT)).toEqual({ spooky: false });
    expect(withActiveSeasonOff({ seasons: { christmas: false } }, MAR)).toEqual({
      christmas: false,
    });
  });

  it('overlays the palette without touching stored colors', () => {
    const config = { ...defaultThemeConfig, backgroundImage: 'x.jpg' };
    const resolved = resolveThemeConfig(config, OCT);
    expect(resolved).toMatchObject(SEASON_PALETTES.spooky);
    expect(resolved.backgroundImage).toBeUndefined();
    expect(config.primaryColor).toBe(defaultThemeConfig.primaryColor);
    expect(resolveThemeConfig(config, MAR)).toBe(config);
  });

  it('keeps only valid season flags through validation', () => {
    const validated = validateThemeConfig({
      ...defaultThemeConfig,
      seasons: { spooky: false, christmas: true, bogus: false } as never,
    });
    expect(validated.seasons).toEqual({ spooky: false });
    expect('seasons' in validateThemeConfig(defaultThemeConfig)).toBe(false);
  });
});
