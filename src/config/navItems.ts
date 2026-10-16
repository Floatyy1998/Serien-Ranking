/** Wählbare Ziele der freien Nav-Slots — Home und „Mehr" sind fix und fehlen hier bewusst. */

export interface NavSlotOption {
  id: string;
  path: string;
  label: string;
  /** Weitere Seiten, auf denen der Slot als aktiv gilt (Lesen: Manga, Bücher, Alle; für Leser /watch). */
  aliases?: string[];
}

export const NAV_SLOT_OPTIONS: NavSlotOption[] = [
  { id: 'watchnext', path: '/watchlist', label: 'Weiter' },
  { id: 'calendar', path: '/calendar', label: 'Kalender' },
  { id: 'ratings', path: '/ratings', label: 'Bewertungen' },
  { id: 'manga', path: '/manga', label: 'Lesen', aliases: ['/books', '/reading', '/watch'] },
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

/** Hauptpfad plus Aliase eines Slots. */
export const NAV_SLOT_ALL_PATHS: Record<string, string[]> = Object.fromEntries(
  NAV_SLOT_OPTIONS.map((o) => [o.id, [o.path, ...(o.aliases ?? [])]])
);

// Ziele der Keep-Alive-Tab-Shell (MainTabs) — bleiben nach Besuch gemountet
export const MAIN_TAB_PATHS: ReadonlySet<string> = new Set([
  '/',
  '/profile',
  '/search',
  ...NAV_SLOT_OPTIONS.flatMap((o) => [o.path, ...(o.aliases ?? [])]),
]);

export const DEFAULT_NAV_SLOTS = ['watchnext', 'calendar', 'ratings', 'manga'];

/** Bei „Manga & Bücher" ist Home die Lese-Seite — der Lesen-Platz führt dann zur Serien-Startseite. */
export const READER_WATCH_PATH = '/watch';
export const READING_PATHS = ['/reading', '/manga', '/books'];

/** Dock für den Schwerpunkt „Manga & Bücher" — ohne Watchlist und Kalender. */
export const READER_NAV_SLOTS = ['manga', 'ratings', 'activity', 'badges'];

export const MAX_NAV_SLOTS = 4;
