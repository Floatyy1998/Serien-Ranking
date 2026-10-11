import type { UserThemeConfig } from './dynamicTheme';

export type SeasonId = 'spooky' | 'christmas' | 'newyear';
export type SeasonFlags = Partial<Record<SeasonId, false>>;

export const SEASON_IDS: SeasonId[] = ['spooky', 'christmas', 'newyear'];

interface SeasonPalette {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
}

export const SEASON_PALETTES: Record<SeasonId, SeasonPalette> = {
  // Kürbis-Orange auf Nachtviolett, Knochenweiß als Lesetext
  spooky: {
    primaryColor: '#ff7a1f',
    accentColor: '#a46cff',
    backgroundColor: '#0c0911',
    surfaceColor: '#19121f',
    textColor: '#efe6d6',
  },
  // Kerzengold und Beerenrot auf Tannennacht
  christmas: {
    primaryColor: '#e9b949',
    accentColor: '#e0464f',
    backgroundColor: '#06120e',
    surfaceColor: '#102019',
    textColor: '#f4efe4',
  },
  // Champagner auf Mitternachtsblau
  newyear: {
    primaryColor: '#f2c75c',
    accentColor: '#8f9bff',
    backgroundColor: '#070914',
    surfaceColor: '#121729',
    textColor: '#f3f0ea',
  },
};

export function isInSeason(id: SeasonId, date: Date = new Date()): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  if (id === 'spooky') return month === 9;
  if (id === 'christmas') return month === 11 && day <= 26;
  return (month === 11 && day >= 27) || (month === 0 && day <= 6);
}

let previewSeason: SeasonId | null = null;

/** Nur Dev-Vorschau: tut so, als liefe gerade diese Saison. */
export function setSeasonPreview(id: SeasonId | null): void {
  previewSeason = id;
}

export function currentSeason(date: Date = new Date()): SeasonId | null {
  if (previewSeason) return previewSeason;
  return SEASON_IDS.find((id) => isInSeason(id, date)) ?? null;
}

// Gespeichert wird nur das Abschalten; alles andere folgt dem Kalender.
export function sanitizeSeasonFlags(raw: unknown): SeasonFlags | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const flags: SeasonFlags = {};
  for (const id of SEASON_IDS) {
    if ((raw as Record<string, unknown>)[id] === false) flags[id] = false;
  }
  return Object.keys(flags).length ? flags : undefined;
}

export function activeSeason(
  config: { seasons?: unknown } | null | undefined,
  date: Date = new Date()
): SeasonId | null {
  const season = currentSeason(date);
  if (!season) return null;
  return sanitizeSeasonFlags(config?.seasons)?.[season] === false ? null : season;
}

export function withSeasonFlag(
  seasons: unknown,
  id: SeasonId,
  on: boolean
): SeasonFlags | undefined {
  const next: SeasonFlags = { ...sanitizeSeasonFlags(seasons) };
  if (on) delete next[id];
  else next[id] = false;
  return Object.keys(next).length ? next : undefined;
}

export function withActiveSeasonOff(
  config: { seasons?: unknown },
  date: Date = new Date()
): SeasonFlags | undefined {
  const season = activeSeason(config, date);
  return season
    ? withSeasonFlag(config.seasons, season, false)
    : sanitizeSeasonFlags(config.seasons);
}

export function resolveThemeConfig(config: UserThemeConfig, date?: Date): UserThemeConfig {
  const season = activeSeason(config, date);
  if (!season) return config;
  return { ...config, ...SEASON_PALETTES[season], backgroundImage: undefined };
}
