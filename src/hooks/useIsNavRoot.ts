import { useSyncExternalStore } from 'react';
import { NAV_SLOT_PATHS } from '../config/navItems';
import { getNavSlots, subscribeNavSlots } from '../services/navConfig';

// React-Router/navigate nutzen history.pushState/replaceState ohne ein
// window-Event zu feuern. Einmalig patchen, damit der Store jede Navigation
// mitbekommt — sonst zeigt ein über die Navigation gemounteter Header
// (Back/Home) einen veralteten Wert, bis irgendein anderes Re-Render greift.
let patched = false;
const patchHistory = (): void => {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  for (const m of ['pushState', 'replaceState'] as const) {
    const orig = window.history[m];
    window.history[m] = function (this: History, ...args: Parameters<History['pushState']>) {
      const ret = orig.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return ret;
    };
  }
};

const subscribe = (cb: () => void): (() => void) => {
  patchHistory();
  const unsub = subscribeNavSlots(cb);
  window.addEventListener('popstate', cb);
  window.addEventListener('locationchange', cb);
  return () => {
    unsub();
    window.removeEventListener('popstate', cb);
    window.removeEventListener('locationchange', cb);
  };
};

const getSnapshot = (): boolean => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  if (pathname === '/' || pathname === '/profile') return true;
  return getNavSlots().some((id) => NAV_SLOT_PATHS[id] === pathname);
};

/** True auf Nav-Leisten-Zielen (Home, /profile, aktive Slots); liest window.location + reagiert auf Navigation, funktioniert so auch ohne Router-Kontext. */
export const useIsNavRoot = (): boolean => useSyncExternalStore(subscribe, getSnapshot, () => true);
