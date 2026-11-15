import { useCallback, useEffect, useMemo, useState } from 'react';
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
  /** Zähl-Einträge der fertigen Themes, nach Namen. */
  presets: Record<string, CommunityTheme>;
  loading: boolean;
  failed: boolean;
  share: (name: string, colors: CommunityThemeColors) => Promise<boolean>;
  rename: (id: string, name: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  /**
   * Welches Community-Design das Konto jetzt nutzt (null = keins mehr). Meldet das
   * vorherige ab und das neue an; auch das eigene Design zählt.
   */
  setUse: (theme: CommunityTheme | null) => void;
}

/** Die Liste läuft live mit: neue Designs und Nutzerzahlen erscheinen ohne Neuladen. */
export function useCommunityThemes(uid: string | undefined, author: string): CommunityThemesState {
  const [themes, setThemes] = useState<CommunityTheme[]>([]);
  const [presets, setPresets] = useState<Record<string, CommunityTheme>>({});
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
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
        setThemes(list.filter((theme) => !theme.preset));
        setPresets(
          Object.fromEntries(
            list.filter((theme) => theme.preset).map((theme) => [theme.name, theme])
          )
        );
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
    setRemoved((prev) => new Set(prev).add(id));
    try {
      await deleteCommunityTheme(id);
    } catch {
      setRemoved((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const visible = useMemo(
    () => (removed.size ? themes.filter((theme) => !removed.has(theme.id)) : themes),
    [themes, removed]
  );

  const setUse = useCallback(
    (theme: CommunityTheme | null) => {
      if (!uid) return;
      void setCommunityThemeUse(
        uid,
        theme ? { id: theme.id, colors: theme, noText: !!theme.preset } : null
      );
    },
    [uid]
  );

  return { themes: visible, presets, loading, failed, share, rename, remove, setUse };
}
