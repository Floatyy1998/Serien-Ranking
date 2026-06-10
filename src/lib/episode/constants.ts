/**
 * Minimum gap in days between two episodes to consider it a mid-season break.
 * Used for episode chips, calendar badges, countdowns, and stats.
 */
export const SEASON_BREAK_GAP_DAYS = 28;

/** ms in a day */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** ms in 7 days — used for "recently watched" / "this week" filtering */
export const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

/** Default maximum item count for HomePage carousel hooks. */
export const HOME_CAROUSEL_MAX_ITEMS = 10;

/** Priority order for streaming providers in weekly episode listings (Crunchyroll 283 first, ADN 415 second). */
export const PRIORITY_PROVIDER_IDS: Record<number, number> = { 283: 0, 415: 1 };
