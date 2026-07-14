import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNavSlots, loadNavSlots, subscribeNavSlots } from '../services/navConfig';

/** Aktive freie Nav-Slots (IDs aus NAV_SLOT_OPTIONS), live bei Änderungen. */
export const useNavSlots = (): string[] => {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (user?.uid) loadNavSlots(user.uid);
  }, [user?.uid]);

  return useSyncExternalStore(subscribeNavSlots, getNavSlots);
};
