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
  isTba?: boolean;
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

  // Nur einklappen, wenn danach noch etwas dasteht: bei einer komplett
  // abgelaufenen Season/Quartal bliebe sonst eine leere Timeline zurueck.
  const collapsible = useMemo(
    () =>
      groups.some((group) => !group.isPast && !group.isTba) && groups.some((group) => group.isPast),
    [groups]
  );

  const pastCount = useMemo(
    () =>
      collapsible
        ? groups.reduce((sum, group) => (group.isPast ? sum + group.items.length : sum), 0)
        : 0,
    [groups, collapsible]
  );

  const visibleGroups = useMemo(
    () => (showPast || !collapsible ? groups : groups.filter((group) => !group.isPast)),
    [groups, showPast, collapsible]
  );

  return {
    visibleGroups,
    pastCount,
    showPast,
    togglePast: () => setShowPast((value) => !value),
  };
}
