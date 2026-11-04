export const DEFAULT_SECTION_ORDER = [
  'activity-marquee',
  'quick-actions',
  'secondary-actions',
  'countdown',
  'continue-watching',
  'rewatches',
  'rewatch-list',
  'today-episodes',
  'new-on-subs',
  'seasonal',
  'trending',
  'top-rated',
  'for-you',
  'stats',
];

export const DEFAULT_FOR_YOU_ORDER = [
  'tonight',
  'watch-streak',
  'daily-spin',
  'milestone-box',
  'taste-profile',
  'taste-match',
  'watch-journey',
  'rating-queue',
  'catch-up',
  'streaming-reminder',
  'hidden-series',
];

export const DEFAULT_QUICK_ACTIONS_ORDER = ['ratings', 'discover', 'history', 'friends'];

export const DEFAULT_SECONDARY_ACTIONS_ORDER = ['leaderboard', 'badges', 'pets'];

export const HEADER_ITEMS = ['stat-pods'];

export type HomeHiddenKey =
  | 'hiddenSections'
  | 'hiddenForYou'
  | 'hiddenQuickActions'
  | 'hiddenSecondaryActions'
  | 'hiddenHeader';

export const HOME_HIDDEN_DEFAULTS: Record<HomeHiddenKey, readonly string[]> = {
  hiddenSections: DEFAULT_SECTION_ORDER,
  hiddenForYou: DEFAULT_FOR_YOU_ORDER,
  hiddenQuickActions: DEFAULT_QUICK_ACTIONS_ORDER,
  hiddenSecondaryActions: DEFAULT_SECONDARY_ACTIONS_ORDER,
  hiddenHeader: HEADER_ITEMS,
};

/** Gespeicherte Layouts älterer Versionen bekommen diese Ausblendungen beim Lesen einmal dazu. */
export const HOME_DEFAULT_HIDDEN_BY_VERSION: Record<
  number,
  Partial<Record<HomeHiddenKey, readonly string[]>>
> = {
  2: {
    hiddenSections: ['activity-marquee', 'seasonal', 'top-rated', 'stats'],
    hiddenForYou: ['taste-match', 'watch-journey', 'streaming-reminder', 'hidden-series'],
    hiddenSecondaryActions: ['badges', 'pets'],
    hiddenHeader: ['stat-pods'],
  },
};

export const HOME_LAYOUT_VERSION = Math.max(
  ...Object.keys(HOME_DEFAULT_HIDDEN_BY_VERSION).map(Number)
);
