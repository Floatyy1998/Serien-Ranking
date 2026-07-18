/** Wählbare Ziele der freien Nav-Slots — Home und „Mehr" sind fix und fehlen hier bewusst. */

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

// Ziele der Keep-Alive-Tab-Shell (MainTabs) — bleiben nach Besuch gemountet
export const MAIN_TAB_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/profile',
  '/search',
  ...NAV_SLOT_OPTIONS.map((o) => o.path),
]);

export const DEFAULT_NAV_SLOTS = ['watchnext', 'calendar', 'ratings', 'manga'];

export const MAX_NAV_SLOTS = 4;
