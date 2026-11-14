import { useCallback, useEffect, useState } from 'react';
import {
  countCommunityThemeUse,
  deleteCommunityTheme,
  listCommunityThemes,
  shareCommunityTheme,
  sortCommunityThemes,
  type CommunityTheme,
  type CommunityThemeColors,
} from '../../services/theme/communityThemes';

export interface CommunityThemesState {
  themes: CommunityTheme[];
  loading: boolean;
  failed: boolean;
  share: (name: string, colors: CommunityThemeColors) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  /** Nach dem Übernehmen eines fremden Designs: einmal zählen, Liste sofort nachziehen. */
  countUse: (theme: CommunityTheme) => void;
}

export function useCommunityThemes(uid: string | undefined, author: string): CommunityThemesState {
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    listCommunityThemes(uid)
      .then((list) => {
        if (!cancelled) setThemes(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const share = useCallback(
    async (name: string, colors: CommunityThemeColors) => {
      if (!uid) return false;
      try {
        const created = await shareCommunityTheme(uid, author, name, colors);
        setThemes((prev) => sortCommunityThemes([...prev, created]));
        return true;
      } catch {
        return false;
      }
    },
    [uid, author]
  );

  const remove = useCallback(async (id: string) => {
    try {
      await deleteCommunityTheme(id);
      setThemes((prev) => prev.filter((theme) => theme.id !== id));
    } catch {
      /* bleibt in der Liste */
    }
  }, []);

  const countUse = useCallback(
    (theme: CommunityTheme) => {
      if (!uid || theme.uid === uid) return;
      void countCommunityThemeUse(theme.id, uid).then((counted) => {
        if (!counted) return;
        setThemes((prev) =>
          sortCommunityThemes(
            prev.map((entry) =>
              entry.id === theme.id ? { ...entry, uses: entry.uses + 1 } : entry
            )
          )
        );
      });
    },
    [uid]
  );

  return { themes, loading, failed, share, remove, countUse };
}
