/**
 * Wählbare Ziele für die freien Slots der Bottom-Navigation.
 * Home (erster Slot) und „Mehr" (letzter Slot) sind fix und hier bewusst
 * nicht enthalten — ebenso keine Detail-Routen.
 */

export interface NavSlotOption {
  id: string;
  path: string;
  label: string;
}

export const NAV_SLOT_OPTIONS: NavSlotOption[] = [
  { id: 'watchnext', path: '/watchlist', label: 'Weiter' },
  { id: 'calendar', path: '/calendar', label: 'Kalender' },
  { id: 'ratings', path: '/ratings', label: 'Bewertungen' },
  { id: 'manga', path: '/manga', label: 'Manga' },
  { id: 'discover', path: '/discover', label: 'Entdecken' },
  { id: 'stats', path: '/stats', label: 'Statistiken' },
  { id: 'leaderboard', path: '/leaderboard', label: 'Rangliste' },
  { id: 'badges', path: '/badges', label: 'Badges' },
  { id: 'pets', path: '/pets', label: 'Pets' },
  { id: 'activity', path: '/activity', label: 'Aktivität' },
  { id: 'countdowns', path: '/countdowns', label: 'Countdowns' },
  { id: 'catchup', path: '/catch-up', label: 'Backlog' },
  { id: 'subscriptions', path: '/subscriptions', label: 'Abos' },
  { id: 'history', path: '/recently-watched', label: 'Verlauf' },
];

export const NAV_SLOT_LABELS: Record<string, string> = Object.fromEntries(
  NAV_SLOT_OPTIONS.map((o) => [o.id, o.label])
);

export const NAV_SLOT_PATHS: Record<string, string> = Object.fromEntries(
  NAV_SLOT_OPTIONS.map((o) => [o.id, o.path])
);

export const DEFAULT_NAV_SLOTS = ['watchnext', 'calendar', 'ratings', 'manga'];

export const MAX_NAV_SLOTS = 4;
