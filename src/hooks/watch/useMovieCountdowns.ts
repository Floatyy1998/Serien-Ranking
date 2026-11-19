import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useMovieList } from '../../contexts/MovieListContext';
import {
  buildMovieCountdowns,
  daysUntilDay,
  isReleaseCandidate,
  sortReleaseCandidates,
  startOfDay,
} from '../../lib/watch/movieCountdown';
import {
  ensureMovieReleases,
  getMovieReleasesSnapshot,
  subscribeMovieReleases,
} from '../../services/api/movieReleaseDates';

const MAX_LOOKUPS = 60;

export function useMovieCountdowns() {
  const { movieList, loading: listLoading } = useMovieList();
  const releases = useSyncExternalStore(subscribeMovieReleases, getMovieReleasesSnapshot);

  const lookupIds = useMemo(() => {
    const today = startOfDay();
    return sortReleaseCandidates(movieList.filter((movie) => isReleaseCandidate(movie, today)))
      .slice(0, MAX_LOOKUPS)
      .map((movie) => movie.id);
  }, [movieList]);

  useEffect(() => {
    ensureMovieReleases(lookupIds);
  }, [lookupIds]);

  const { countdowns, resolving } = useMemo(() => {
    const today = startOfDay();
    const asked = new Set(lookupIds);
    const upcoming = (movieId: number) =>
      (daysUntilDay(releases.release(movieId)?.date, today) ?? -1) >= 0;
    return {
      countdowns: buildMovieCountdowns(
        movieList.filter((movie) => asked.has(movie.id) || upcoming(movie.id)),
        releases.release,
        today
      ),
      resolving: lookupIds.some((movieId) => !releases.settled(movieId)),
    };
  }, [movieList, lookupIds, releases]);

  const loading = countdowns.length === 0 && ((listLoading && movieList.length === 0) || resolving);

  return { countdowns, loading };
}
