import type { UserThemeConfig } from './dynamicTheme';

// Kürbis-Orange auf Nachtviolett, Knochenweiß als Lesetext.
export const SPOOKY_PALETTE = {
  primaryColor: '#ff7a1f',
  accentColor: '#a46cff',
  backgroundColor: '#0c0911',
  surfaceColor: '#19121f',
  textColor: '#efe6d6',
} as const;

export function resolveThemeConfig(config: UserThemeConfig): UserThemeConfig {
  if (!config.spooky) return config;
  return { ...config, ...SPOOKY_PALETTE, backgroundImage: undefined };
}

export function isSpookySeasonNow(date: Date = new Date()): boolean {
  const month = date.getMonth();
  return month === 9 || (month === 10 && date.getDate() <= 2);
}
