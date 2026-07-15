import { useSyncExternalStore } from 'react';
import { NAV_SLOT_PATHS } from '../config/navItems';
import { getNavSlots, subscribeNavSlots } from '../services/navConfig';

/**
 * True, wenn die aktuelle Seite ein Ziel der (konfigurierbaren) unteren Leiste
 * ist — Home, „Mehr" (/profile) oder ein aktiver Nav-Slot. Nur dort ist die
 * Leiste sichtbar; alle anderen Seiten zeigen stattdessen Zurück + Home.
 *
 * Liest window.location statt useLocation: so funktioniert der Hook auch in
 * Komponenten ohne Router-Kontext. Konsumenten re-rendern bei Navigation
 * ohnehin (eigenes useLocation bzw. Remount pro Seite).
 */
export const useIsNavRoot = (): boolean => {
  const navSlots = useSyncExternalStore(subscribeNavSlots, getNavSlots);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  if (pathname === '/' || pathname === '/profile') return true;
  return navSlots.some((id) => NAV_SLOT_PATHS[id] === pathname);
};
