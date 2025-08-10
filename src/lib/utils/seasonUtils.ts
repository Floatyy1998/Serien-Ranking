import { Season, SeasonsData } from '../../types/Series';

/**
 * Konvertiert Firebase Seasons-Daten (Object oder Array) zu einem Array von Seasons
 * Filtert null/undefined Werte heraus
 */
export const normalizeSeasonsToArray = (seasons: SeasonsData | null | undefined): Season[] => {
  if (!seasons) return [];
  
  if (Array.isArray(seasons)) {
    return seasons.filter((season): season is Season => season != null);
  }
  
  return Object.values(seasons).filter((season): season is Season => season != null);
};

/**
 * Typsichere Season-Array Normalisierung mit expliziter Typisierung
 */
export const getSeasonsArray = (seasons: SeasonsData | null | undefined): Season[] => {
  return normalizeSeasonsToArray(seasons);
};