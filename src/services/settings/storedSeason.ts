import { activeSeason, type SeasonId } from '../../theme/seasonalThemes';

export function readStoredSeason(): SeasonId | null {
  try {
    const raw = localStorage.getItem('customTheme');
    return activeSeason(raw ? (JSON.parse(raw) as { seasons?: unknown }) : null);
  } catch {
    return activeSeason(null);
  }
}
