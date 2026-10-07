import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMangaLayout,
  loadMangaLayout,
  subscribeMangaLayout,
  type MangaLayout,
} from '../../services/settings/mangaLayout';

/** Anordnung der Manga-Übersicht, live bei Änderungen im Layout-Editor. */
export const useMangaLayout = (): MangaLayout => {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (user?.uid) loadMangaLayout(user.uid);
  }, [user?.uid]);

  return useSyncExternalStore(subscribeMangaLayout, getMangaLayout);
};
