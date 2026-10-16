import { createContext, useContext } from 'react';
import type { AppFocus } from '../../../services/settings/appFocus';

/** Die Akte des Onboardings — Reihenfolge und Beschriftung des Programms. */
export type ActStep =
  'welcome' | 'series' | 'movies' | 'reading' | 'subscriptions' | 'pet' | 'done';

export interface Act {
  key: ActStep;
  num: string;
  label: string;
  sub: string;
}

const ALL_ACTS: Omit<Act, 'num'>[] = [
  { key: 'welcome', label: 'Kuration', sub: 'Richtungen wählen' },
  { key: 'series', label: 'Serien', sub: 'Deine Favoriten' },
  { key: 'movies', label: 'Filme', sub: 'Kino-Highlights' },
  { key: 'reading', label: 'Lesen', sub: 'Manga & Bücher' },
  { key: 'subscriptions', label: 'Abos', sub: 'Was streamst du' },
  { key: 'pet', label: 'Pet', sub: 'Dein Begleiter' },
  { key: 'done', label: 'Premiere', sub: 'Vorhang auf' },
];

const WATCH_ONLY = new Set<ActStep>(['series', 'movies', 'subscriptions']);

/** Akte für einen Schwerpunkt: Lese-Nutzer überspringen Serien, Filme und Abos. */
export function actsFor(focus: AppFocus): Act[] {
  return ALL_ACTS.filter((act) => focus !== 'read' || !WATCH_ONLY.has(act.key)).map((act, i) => ({
    ...act,
    num: String(i + 1).padStart(2, '0'),
  }));
}

export const ACTS = actsFor('both');

const ActsContext = createContext<Act[]>(ACTS);
export const ActsProvider = ActsContext.Provider;

export const useActs = (): Act[] => useContext(ActsContext);

/** Nummer eines Akts im aktuellen Programm, z. B. „04". */
export function useActNum(key: ActStep): string {
  return useActs().find((act) => act.key === key)?.num ?? '';
}
