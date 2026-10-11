import { describe, expect, it } from 'vitest';
import { defaultThemeConfig, validateThemeConfig } from './dynamicTheme';
import {
  activeSeason,
  currentSeason,
  resolveThemeConfig,
  SEASON_PALETTES,
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
  });

  it('is on by default during its season and off outside', () => {
    expect(activeSeason({}, OCT)).toBe('spooky');
    expect(activeSeason({}, DEC)).toBe('christmas');
    expect(activeSeason({}, SILVESTER)).toBe('newyear');
    expect(activeSeason({}, MAR)).toBeNull();
  });

  it('respects an opt-out and a forced design', () => {
    expect(activeSeason({ seasons: { spooky: false } }, OCT)).toBeNull();
    expect(activeSeason({ seasons: { christmas: true } }, OCT)).toBe('christmas');
    expect(activeSeason({ seasons: { newyear: true } }, MAR)).toBe('newyear');
  });

  it('switches on in season without pinning the flag', () => {
    expect(withSeasonFlag({ spooky: false }, 'spooky', true, OCT)).toBeUndefined();
    expect(withSeasonFlag(undefined, 'christmas', true, OCT)).toEqual({ christmas: true });
    expect(withSeasonFlag({ christmas: true }, 'spooky', true, OCT)).toBeUndefined();
    expect(withSeasonFlag(undefined, 'spooky', false, OCT)).toEqual({ spooky: false });
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
      seasons: { spooky: false, bogus: true } as never,
    });
    expect(validated.seasons).toEqual({ spooky: false });
    expect('seasons' in validateThemeConfig(defaultThemeConfig)).toBe(false);
  });
});
