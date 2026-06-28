/**
 * activityMeta - Maps a FriendActivity to a human verb phrase, icon and accent color.
 * Single source of truth shared by the feed timeline and entry cards so every
 * activity type renders consistently.
 */

import AddRounded from '@mui/icons-material/AddRounded';
import BookmarkAddRounded from '@mui/icons-material/BookmarkAddRounded';
import BookmarkRemoveRounded from '@mui/icons-material/BookmarkRemoveRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import type { FriendActivity } from '../../types/Friend';

export interface ActivityTheme {
  primary: string;
  accent: string;
  status: { error: string; warning: string; success: string };
  text: { secondary: string; muted: string };
}

export interface ActivityMeta {
  /** German verb phrase, e.g. "bewertet" or "auf die Watchlist gesetzt" */
  verb: string;
  /**
   * When set, the title is placed BETWEEN verb and suffix:
   *   "hat {verb} {title} {suffix}"  →  "hat eine Folge von Lost geschaut".
   * Otherwise it renders as "hat {title} {verb}".
   */
  suffix?: string;
  Icon: SvgIconComponent;
  /** Accent color for the badge/glow of this activity kind */
  color: (theme: ActivityTheme) => string;
  isMovie: boolean;
  /** Whether the activity carries a meaningful star rating */
  isRating: boolean;
  /** Subtle = de-emphasized (deletions / removals) */
  subtle: boolean;
}

const MOVIE_TYPES = new Set([
  'movie_added',
  'movie_deleted',
  'movie_rated',
  'rating_updated_movie',
  'movie_added_to_watchlist',
  'movie_removed_from_watchlist',
]);

export const isMovieActivity = (activity: FriendActivity): boolean =>
  MOVIE_TYPES.has(activity.type) || activity.itemType === 'movie';

export const getActivityMeta = (activity: FriendActivity): ActivityMeta => {
  const isMovie = isMovieActivity(activity);

  switch (activity.type) {
    case 'series_rated':
    case 'movie_rated':
    case 'rating_updated':
    case 'rating_updated_movie':
      return {
        verb: 'bewertet',
        Icon: StarRounded,
        color: (t) => t.status.warning ?? t.accent,
        isMovie,
        isRating: true,
        subtle: false,
      };

    case 'episode_watched':
      return {
        verb: 'eine Folge von',
        suffix: 'geschaut',
        Icon: PlayArrowRounded,
        color: (t) => t.status.success,
        isMovie,
        isRating: false,
        subtle: false,
      };

    case 'episodes_watched':
      return {
        verb: 'Folgen von',
        suffix: 'geschaut',
        Icon: PlayArrowRounded,
        color: (t) => t.status.success,
        isMovie,
        isRating: false,
        subtle: false,
      };

    case 'series_added_to_watchlist':
    case 'movie_added_to_watchlist':
      return {
        verb: 'auf die Watchlist gesetzt',
        Icon: BookmarkAddRounded,
        color: (t) => t.primary,
        isMovie,
        isRating: false,
        subtle: false,
      };

    case 'series_removed_from_watchlist':
    case 'movie_removed_from_watchlist':
      return {
        verb: 'von der Watchlist entfernt',
        Icon: BookmarkRemoveRounded,
        color: (t) => t.text.muted,
        isMovie,
        isRating: false,
        subtle: true,
      };

    case 'series_deleted':
    case 'movie_deleted':
      return {
        verb: 'aus der Liste entfernt',
        Icon: DeleteOutlineRounded,
        color: (t) => t.text.muted,
        isMovie,
        isRating: false,
        subtle: true,
      };

    case 'series_added':
    case 'movie_added':
    default:
      return {
        verb: 'zur Liste hinzugefügt',
        Icon: AddRounded,
        color: (t) => (isMovie ? t.accent : t.primary),
        isMovie,
        isRating: false,
        subtle: false,
      };
  }
};

/** Bucket a timestamp into a relative day group for section headers. */
export const getDateGroup = (timestamp: number, now: number): string => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const dayMs = 86400000;

  if (timestamp >= todayMs) return 'Heute';
  if (timestamp >= todayMs - dayMs) return 'Gestern';
  if (timestamp >= todayMs - 6 * dayMs) return 'Diese Woche';
  return 'Älter';
};
