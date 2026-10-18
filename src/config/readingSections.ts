/** Bereiche der Lesen-Seite und ihre Unterlisten; Labels liegen in pages/Reading/data/readingSectionLabels. */

import { MANGA_FOR_YOU_IDS } from './mangaSections';

export const READING_SECTION_IDS = [
  'quick-actions',
  'continue-reading',
  'new',
  'for-you',
  'up-next',
  'wishlist',
  'shelf',
  'library',
  'discover',
  'for-shows',
  'year',
  'stats',
  'owned',
  'paused',
  'recently-added',
  'friends',
] as const;

/** Startet ausgeblendet, damit die Seite kurz bleibt — im Editor jederzeit einschaltbar. */
export const READING_DEFAULT_HIDDEN: readonly string[] = [
  'year',
  'stats',
  'owned',
  'paused',
  'recently-added',
  'friends',
];

/** Schnellzugriffe der Lesen-Seite — jede Seite zeigt Bücher und Manga zusammen. */
export const READING_QUICK_ACTION_IDS = [
  'friends',
  'activity',
  'reading-list',
  'library',
  'discover',
  'ratings',
  'stats',
  'history',
  'catch-up',
] as const;

/** Teile von „Entdecken" — jeder mischt Bücher und Manga, das Highlight ist nur für Bücher. */
export const READING_DISCOVER_IDS = ['hero', 'new', 'for-you', 'genres', 'genre-rows'] as const;

/** Karten in „Für dich"; Aufholen ist ein Schnellzugriff, das Leseziel steht unter dem Schnellzugriff. */
export const READING_FOR_YOU_IDS = MANGA_FOR_YOU_IDS.filter((id) => id !== 'catch-up');

export type ReadingLayoutListKey = 'sections' | 'quick' | 'forYou' | 'discover';

export const READING_LAYOUT_DEFAULTS: Record<ReadingLayoutListKey, readonly string[]> = {
  sections: READING_SECTION_IDS,
  quick: READING_QUICK_ACTION_IDS,
  forYou: READING_FOR_YOU_IDS,
  discover: READING_DISCOVER_IDS,
};

/** Zu welchem Lesebereich ein Bereich gehört — `both` zeigt Bücher und Manga. */
export const READING_SECTION_AREA: Record<string, 'books' | 'manga' | 'both'> = {
  'continue-reading': 'both',
  new: 'both',
  'for-you': 'both',
  'up-next': 'both',
  wishlist: 'books',
  'quick-actions': 'both',
  shelf: 'both',
  library: 'both',
  discover: 'both',
  'for-shows': 'books',
  year: 'both',
  stats: 'both',
  owned: 'books',
  paused: 'books',
  'recently-added': 'manga',
  friends: 'books',
};
