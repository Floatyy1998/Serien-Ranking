import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMovieList } from '../contexts/MovieListContext';
import { useSeriesList } from '../contexts/SeriesListContext';
import { useRatingFolders } from '../hooks/rating/useRatingFolders';
import { buildSharedListPayload, sharedListSignature } from '../lib/rating/sharedList';
import {
  readSharedListSignature,
  rememberSharedListSignature,
  resolveOwnerName,
  updateSharedList,
} from '../services/rating/sharedListService';

/** Hält die öffentlichen Kopien geteilter Listen auf dem Stand der eigenen Bibliothek. */
export const SharedListSync = () => {
  const { user } = useAuth() || {};
  const { folders } = useRatingFolders();
  const { allSeriesList, loading: seriesLoading } = useSeriesList();
  const { movieList, loading: moviesLoading } = useMovieList();
  const [ownerName, setOwnerName] = useState<string | null>(null);

  const hasShared = folders.some((f) => f.shared);

  useEffect(() => {
    if (!user || !hasShared || ownerName !== null) return;
    let cancelled = false;
    void resolveOwnerName(user).then((name) => {
      if (!cancelled) setOwnerName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [user, hasShared, ownerName]);

  useEffect(() => {
    if (!user || !hasShared || ownerName === null || seriesLoading || moviesLoading) return;
    const timer = window.setTimeout(() => {
      for (const folder of folders) {
        if (!folder.shared) continue;
        const payload = buildSharedListPayload(folder, allSeriesList, movieList, {
          uid: user.uid,
          name: ownerName,
        });
        const sig = sharedListSignature(payload);
        if (readSharedListSignature(folder.id) === sig) continue;
        updateSharedList(folder.id, payload)
          .then(() => rememberSharedListSignature(folder.id, sig))
          .catch(() => {});
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [user, hasShared, ownerName, folders, allSeriesList, movieList, seriesLoading, moviesLoading]);

  return null;
};
