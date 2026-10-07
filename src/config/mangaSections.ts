/** Sektionen der Manga-Übersicht und ihre Unterlisten; Labels liegen in pages/Manga/data/mangaSectionLabels. */

export const MANGA_SECTION_IDS = [
  'quick-actions',
  'continue-reading',
  'new-chapters',
  'recently-added',
  'up-next',
  'for-you',
  'genre-picks',
  'trending',
  'popular',
  'top-rated',
  'stats',
  'collection',
] as const;

export const MANGA_QUICK_ACTION_IDS = [
  'reading-list',
  'discover',
  'ratings',
  'stats',
  'journey',
  'history',
  'catch-up',
] as const;

export const MANGA_FOR_YOU_IDS = ['catch-up', 'rating-queue', 'reread', 'hidden'] as const;

export type MangaLayoutListKey = 'sections' | 'quick' | 'forYou';

export const MANGA_LAYOUT_DEFAULTS: Record<MangaLayoutListKey, readonly string[]> = {
  sections: MANGA_SECTION_IDS,
  quick: MANGA_QUICK_ACTION_IDS,
  forYou: MANGA_FOR_YOU_IDS,
};
