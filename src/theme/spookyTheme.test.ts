import { describe, expect, it } from 'vitest';
import { defaultThemeConfig, validateThemeConfig } from './dynamicTheme';
import { isSpookySeasonNow, resolveThemeConfig, SPOOKY_PALETTE } from './spookyTheme';

describe('spookyTheme', () => {
  it('leaves the config untouched when spooky is off', () => {
    expect(resolveThemeConfig(defaultThemeConfig)).toBe(defaultThemeConfig);
  });

  it('overlays the spooky palette without touching stored colors', () => {
    const config = { ...defaultThemeConfig, spooky: true, backgroundImage: 'x.jpg' };
    const resolved = resolveThemeConfig(config);
    expect(resolved).toMatchObject(SPOOKY_PALETTE);
    expect(resolved.backgroundImage).toBeUndefined();
    expect(config.primaryColor).toBe(defaultThemeConfig.primaryColor);
  });

  it('keeps the flag through validation only when it is true', () => {
    expect(validateThemeConfig({ ...defaultThemeConfig, spooky: true }).spooky).toBe(true);
    expect('spooky' in validateThemeConfig({ ...defaultThemeConfig, spooky: false })).toBe(false);
  });

  it('knows the season window', () => {
    expect(isSpookySeasonNow(new Date(2026, 9, 11))).toBe(true);
    expect(isSpookySeasonNow(new Date(2026, 10, 2))).toBe(true);
    expect(isSpookySeasonNow(new Date(2026, 10, 3))).toBe(false);
    expect(isSpookySeasonNow(new Date(2026, 8, 30))).toBe(false);
  });
});
