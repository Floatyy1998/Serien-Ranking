import { createContext, useContext } from 'react';

/** Übernehmen einer Serie aus einem fremden Kalender in die eigene Liste. */
export interface CalendarAddToList {
  inList: (seriesId: number) => boolean;
  adding: (seriesId: number) => boolean;
  add: (seriesId: number, title: string) => void;
}

export interface CalendarViewMode {
  /**
   * Fremder Kalender: nichts ist schreibbar. Der Stern zeigt dann die Bewertung
   * des Freundes und die Haken seinen Fortschritt — beides nur zum Ansehen.
   */
  readOnly: boolean;
  /**
   * Antippen einer Folge. Gesetzt fragt die Seite erst, ob es zur Folge oder
   * zur Serie gehen soll — wie auf der Startseite. Ohne Handler springt die
   * Karte direkt zur Folge.
   */
  onEpisodeNav?: (seriesId: number, title: string, episodePath: string) => void;
  /**
   * Nur im fremden Kalender gesetzt: dort steht an der Stelle des Hakens ein
   * Knopf, der die Serie in die eigene Liste holt.
   */
  addToList?: CalendarAddToList;
}

const DEFAULT: CalendarViewMode = { readOnly: false };

export const CalendarViewModeContext = createContext<CalendarViewMode>(DEFAULT);

/**
 * Der Modus geht durch vier Ebenen (Seite → Raster → Tag → Karte). Ein Context
 * spart das Durchreichen durch Zwischenkomponenten, die ihn nicht brauchen.
 */
export const useCalendarViewMode = (): CalendarViewMode => useContext(CalendarViewModeContext);
