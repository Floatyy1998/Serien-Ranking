import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { ReadingLayout } from '../../lib/layout/readingLayout';
import {
  getReadingLayout,
  loadReadingLayout,
  subscribeReadingLayout,
} from '../../services/settings/readingLayout';

/** Anordnung der Lesen-Seite, live bei Änderungen im Layout-Editor. */
export const useReadingLayout = (): ReadingLayout => {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (user?.uid) loadReadingLayout(user.uid);
  }, [user?.uid]);

  return useSyncExternalStore(subscribeReadingLayout, getReadingLayout);
};
