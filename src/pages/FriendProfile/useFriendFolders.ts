import { useEffect, useState } from 'react';
import type { RatingFolder } from '../../lib/rating/ratingFolders';
import { fetchRatingFolders } from '../../services/rating/ratingFoldersService';

export function useFriendFolders(friendUid: string | undefined): {
  folders: RatingFolder[];
  loading: boolean;
} {
  const [state, setState] = useState<{ uid?: string; folders: RatingFolder[] }>({
    folders: [],
  });

  useEffect(() => {
    if (!friendUid) return;
    let cancelled = false;
    fetchRatingFolders(friendUid)
      .then((folders) => !cancelled && setState({ uid: friendUid, folders }))
      .catch(() => !cancelled && setState({ uid: friendUid, folders: [] }));
    return () => {
      cancelled = true;
    };
  }, [friendUid]);

  const current = !!friendUid && state.uid === friendUid;
  return { folders: current ? state.folders : [], loading: !!friendUid && !current };
}
