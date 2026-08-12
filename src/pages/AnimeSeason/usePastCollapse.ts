/**
 * Zurückliegende Timeline-Tage einklappen (Anime-Season, Serien- und
 * Film-Kalender teilen sich diese Timeline).
 *
 * Die Daten liegen ohnehin vollständig im Speicher — hier wird nichts
 * nachgeladen, nur weniger gerendert. Der Zweck ist, dass man mitten in
 * einer Season beim heutigen Tag landet statt am Season-Anfang.
 */
import { useMemo, useState } from 'react';

interface CollapsibleGroup {
  isPast: boolean;
  items: unknown[];
}

interface PastCollapse<T> {
  visibleGroups: T[];
  pastCount: number;
  showPast: boolean;
  togglePast: () => void;
}

export function usePastCollapse<T extends CollapsibleGroup>(groups: T[]): PastCollapse<T> {
  const [showPast, setShowPast] = useState(false);

  // Bewusst KEINE Ausnahme fuer „es bleibt sonst nichts uebrig": ob nur
  // Vergangenes dasteht, weil die Season vorbei ist oder weil ein Filter
  // (Provider, Genre, Studio) alles Kommende wegnimmt, laesst sich hier nicht
  // unterscheiden — und im Filter-Fall klappte die Ausnahme dem Nutzer genau
  // das wieder auf, was er eingeklappt haben wollte. Bleibt nichts uebrig,
  // steht eben nur der Knopf da; ein Tipp holt alles zurueck.
  const pastCount = useMemo(
    () => groups.reduce((sum, group) => (group.isPast ? sum + group.items.length : sum), 0),
    [groups]
  );

  const visibleGroups = useMemo(
    () => (showPast ? groups : groups.filter((group) => !group.isPast)),
    [groups, showPast]
  );

  return {
    visibleGroups,
    pastCount,
    showPast,
    togglePast: () => setShowPast((value) => !value),
  };
}
