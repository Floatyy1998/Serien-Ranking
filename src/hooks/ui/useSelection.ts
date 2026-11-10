import { useCallback, useMemo, useState } from 'react';
import { useAndroidBack } from './useAndroidBack';

export interface Selection {
  active: boolean;
  /** Ausgewählte Schlüssel, die gerade sichtbar sind (in Reihenfolge der Liste). */
  keys: string[];
  has: (key: string) => boolean;
  allSelected: boolean;
  start: (key?: string) => void;
  toggle: (key: string) => void;
  toggleAll: () => void;
  exit: () => void;
}

/**
 * Mehrfachauswahl über einer gefilterten Liste: Aktionen gelten nur für das, was der Filter zeigt —
 * wer den Filter wechselt, wählt nichts Unsichtbares mit aus. Hardware-Zurück beendet die Auswahl.
 */
export function useSelection(available: string[]): Selection {
  const [active, setActive] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const keys = useMemo(() => available.filter((k) => picked.has(k)), [available, picked]);
  const visible = useMemo(() => new Set(keys), [keys]);
  const allSelected = available.length > 0 && keys.length === available.length;

  const start = useCallback((key?: string) => {
    setActive(true);
    setPicked(key ? new Set([key]) : new Set());
  }, []);

  const toggle = useCallback((key: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setPicked(allSelected ? new Set() : new Set(available));
  }, [allSelected, available]);

  const exit = useCallback(() => {
    setActive(false);
    setPicked(new Set());
  }, []);

  useAndroidBack(active, exit);

  const has = useCallback((key: string) => visible.has(key), [visible]);

  return { active, keys, has, allSelected, start, toggle, toggleAll, exit };
}
