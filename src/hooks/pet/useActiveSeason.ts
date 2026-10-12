import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { activeSeason, type SeasonId } from '../../theme/seasonalThemes';

/** Die laufende Saison, solange der Nutzer sie nicht abgeschaltet hat. */
export function useActiveSeason(): SeasonId | null {
  const config = useContext(ThemeContext)?.userConfig;
  return config ? activeSeason(config) : null;
}
