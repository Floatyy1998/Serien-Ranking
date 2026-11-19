import { useEffect, useSyncExternalStore } from 'react';
import type { RegionalRelease } from '../../lib/watch/movieCountdown';
import {
  ensureMovieReleases,
  getMovieReleasesSnapshot,
  subscribeMovieReleases,
} from '../../services/api/movieReleaseDates';

/** Start eines Films in der Watch-Region: `undefined` solange offen, `null` wenn keiner bekannt ist. */
export function useMovieRelease(movieId: number | undefined): RegionalRelease | null | undefined {
  const releases = useSyncExternalStore(subscribeMovieReleases, getMovieReleasesSnapshot);
  const id = movieId && Number.isFinite(movieId) && movieId > 0 ? movieId : undefined;

  useEffect(() => {
    if (id) ensureMovieReleases([id]);
  }, [id]);

  return id ? releases.release(id) : undefined;
}
