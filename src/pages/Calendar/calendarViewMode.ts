import { createContext, useContext } from 'react';

export interface CalendarViewMode {
  /**
   * Fremder Kalender: nichts ist schreibbar. Der Stern zeigt dann die Bewertung
   * des Freundes und die Haken seinen Fortschritt — beides nur zum Ansehen.
   */
  readOnly: boolean;
}

const DEFAULT: CalendarViewMode = { readOnly: false };

export const CalendarViewModeContext = createContext<CalendarViewMode>(DEFAULT);

/**
 * Der Modus geht durch vier Ebenen (Seite → Raster → Tag → Karte). Ein Context
 * spart das Durchreichen durch Zwischenkomponenten, die ihn nicht brauchen.
 */
export const useCalendarViewMode = (): CalendarViewMode => useContext(CalendarViewModeContext);
