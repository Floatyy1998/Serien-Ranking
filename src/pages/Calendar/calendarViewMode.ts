import { createContext, useContext } from 'react';

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
}

const DEFAULT: CalendarViewMode = { readOnly: false };

export const CalendarViewModeContext = createContext<CalendarViewMode>(DEFAULT);

/**
 * Der Modus geht durch vier Ebenen (Seite → Raster → Tag → Karte). Ein Context
 * spart das Durchreichen durch Zwischenkomponenten, die ihn nicht brauchen.
 */
export const useCalendarViewMode = (): CalendarViewMode => useContext(CalendarViewModeContext);
