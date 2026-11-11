import type { Movie } from '../../types/Movie';
import { overallRatingValue } from '../rating/rating';
import { wasMovieWatched, type MovieWatchState } from '../watch/movieWatchLog';

export type FriendMovieState = 'watched' | 'watchlist' | 'listed';

export interface FriendMovieStatus {
  state: FriendMovieState;
  rating: number;
  watchedAt: number | null;
}

export type FriendMovieRef = MovieWatchState & { watchlist?: boolean };

/** Wie ein Freund zu einem Film steht — null, wenn er ihn nicht in der Liste hat. */
export function friendMovieStatus(
  ref: FriendMovieRef | null | undefined
): FriendMovieStatus | null {
  if (!ref || typeof ref !== 'object') return null;
  const watchedAt = ref.watchedAt ? Date.parse(ref.watchedAt) : NaN;
  return {
    state: wasMovieWatched(ref) ? 'watched' : ref.watchlist ? 'watchlist' : 'listed',
    rating: overallRatingValue(ref as Movie),
    watchedAt: Number.isFinite(watchedAt) ? watchedAt : null,
  };
}

const STATE_RANK: Record<FriendMovieState, number> = { watched: 0, watchlist: 1, listed: 2 };

/** Gesehen vor Watchlist vor „nur in der Liste"; darin zuletzt Gesehenes, dann Bestbewertetes zuerst. */
export function compareFriendMovieStatus(a: FriendMovieStatus, b: FriendMovieStatus): number {
  return (
    STATE_RANK[a.state] - STATE_RANK[b.state] ||
    (b.watchedAt ?? 0) - (a.watchedAt ?? 0) ||
    b.rating - a.rating
  );
}
