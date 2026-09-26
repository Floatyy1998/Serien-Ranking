import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { RatingFolder } from '../../lib/rating/ratingFolders';
import { subscribeRatingFolders } from '../../services/rating/ratingFoldersService';

export function useRatingFolders(): { folders: RatingFolder[]; loading: boolean } {
  const { user } = useAuth() || {};
  const uid = user?.uid;
  const [state, setState] = useState<{ uid?: string; folders: RatingFolder[] }>({
    folders: [],
  });

  useEffect(() => {
    if (!uid) return;
    try {
      return subscribeRatingFolders(uid, (folders) => setState({ uid, folders }));
    } catch {
      return undefined;
    }
  }, [uid]);

  const current = state.uid === uid;
  return { folders: current ? state.folders : [], loading: !!uid && !current };
}
