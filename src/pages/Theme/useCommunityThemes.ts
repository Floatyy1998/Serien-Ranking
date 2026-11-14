import { useCallback, useEffect, useState } from 'react';
import {
  deleteCommunityTheme,
  renameCommunityTheme,
  shareCommunityTheme,
  setCommunityThemeUse,
  watchCommunityThemes,
  type CommunityTheme,
  type CommunityThemeColors,
} from '../../services/theme/communityThemes';

export interface CommunityThemesState {
  themes: CommunityTheme[];
  loading: boolean;
  failed: boolean;
  share: (name: string, colors: CommunityThemeColors) => Promise<boolean>;
  rename: (id: string, name: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  /**
   * Welches Community-Design das Konto jetzt nutzt (null = keins mehr). Meldet das
   * vorherige ab und das neue an; eigene Designs zählen nicht mit.
   */
  setUse: (theme: CommunityTheme | null) => void;
}

/** Die Liste läuft live mit: neue Designs und Nutzerzahlen erscheinen ohne Neuladen. */
export function useCommunityThemes(uid: string | undefined, author: string): CommunityThemesState {
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    return watchCommunityThemes(
      uid,
      (list) => {
        setThemes(list);
        setFailed(false);
        setLoading(false);
      },
      () => {
        setFailed(true);
        setLoading(false);
      }
    );
  }, [uid]);

  const share = useCallback(
    async (name: string, colors: CommunityThemeColors) => {
      if (!uid) return false;
      try {
        await shareCommunityTheme(uid, author, name, colors);
        return true;
      } catch {
        return false;
      }
    },
    [uid, author]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      if (!uid) return false;
      try {
        await renameCommunityTheme(id, name, uid, author);
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
    } catch {
      /* bleibt in der Liste */
    }
  }, []);

  const setUse = useCallback(
    (theme: CommunityTheme | null) => {
      if (!uid) return;
      void setCommunityThemeUse(
        uid,
        theme && theme.uid !== uid ? { id: theme.id, colors: theme } : null
      );
    },
    [uid]
  );

  return { themes, loading, failed, share, rename, remove, setUse };
}
