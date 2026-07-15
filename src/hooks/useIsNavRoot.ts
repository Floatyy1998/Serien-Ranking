import { useLocation } from 'react-router-dom';
import { NAV_SLOT_PATHS } from '../config/navItems';
import { useNavSlots } from './useNavConfig';

/**
 * True, wenn die aktuelle Seite ein Ziel der (konfigurierbaren) unteren Leiste
 * ist — Home, „Mehr" (/profile) oder ein aktiver Nav-Slot. Nur dort ist die
 * Leiste sichtbar; alle anderen Seiten zeigen stattdessen Zurück + Home.
 */
export const useIsNavRoot = (): boolean => {
  const { pathname } = useLocation();
  const navSlots = useNavSlots();
  if (pathname === '/' || pathname === '/profile') return true;
  return navSlots.some((id) => NAV_SLOT_PATHS[id] === pathname);
};
