import { useSyncExternalStore } from 'react';
import { NAV_SLOT_PATHS } from '../config/navItems';
import { getNavSlots, subscribeNavSlots } from '../services/navConfig';

/** True auf Nav-Leisten-Zielen (Home, /profile, aktive Slots); liest window.location, damit es auch ohne Router-Kontext funktioniert. */
export const useIsNavRoot = (): boolean => {
  const navSlots = useSyncExternalStore(subscribeNavSlots, getNavSlots);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  if (pathname === '/' || pathname === '/profile') return true;
  return navSlots.some((id) => NAV_SLOT_PATHS[id] === pathname);
};
