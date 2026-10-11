import { SEASON_IDS, setSeasonPreview, type SeasonId } from '../../theme/seasonalThemes';

const KEY = 'devSeasonPreview';
const isSeason = (value: string | null): value is SeasonId =>
  !!value && (SEASON_IDS as string[]).includes(value);

// Nur im Dev-Server: ?season=christmas zeigt ein Saison-Design außerhalb seiner Zeit,
// ?season=off beendet die Vorschau. Gilt für den Tab, bis er geschlossen wird.
export function installSeasonPreview(): void {
  if (!import.meta.env.DEV) return;
  try {
    const param = new URLSearchParams(window.location.search).get('season');
    if (param !== null) {
      if (isSeason(param)) sessionStorage.setItem(KEY, param);
      else sessionStorage.removeItem(KEY);
    }
    const stored = sessionStorage.getItem(KEY);
    if (isSeason(stored)) setSeasonPreview(stored);
  } catch {
    // Storage gesperrt — dann eben keine Vorschau
  }
}
