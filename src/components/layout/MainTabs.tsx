import type { ComponentType } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MAIN_TAB_PATHS } from '../../config/navItems';
import { CalendarPage, MangaPage } from '../../lazyRoutes';
import { HomePage } from '../../pages/HomePage';
import { ProfilePage } from '../../pages/Profile';
import { RatingsPage } from '../../pages/Ratings';
import { SearchPage } from '../../pages/Search';
import { WatchNextPage } from '../../pages/WatchNext';

// Keep-Alive: besuchte Haupt-Tabs bleiben gemountet (display:none statt Unmount)
const TAB_COMPONENTS: Record<string, ComponentType> = {
  '/': HomePage,
  '/watchlist': WatchNextPage,
  '/ratings': RatingsPage,
  '/profile': ProfilePage,
  '/search': SearchPage,
  '/calendar': CalendarPage,
  '/manga': MangaPage,
};

export const MainTabs = () => {
  const { pathname } = useLocation();
  const isTab = MAIN_TAB_PATHS.has(pathname);

  // Letzter aktiver Tab bleibt auch auf Detail-Seiten (Shell versteckt) gemerkt
  const [active, setActive] = useState<string | null>(isTab ? pathname : null);
  if (isTab && active !== pathname) setActive(pathname);

  const [mounted, setMounted] = useState<string[]>(() => (isTab ? [pathname] : []));
  if (active && !mounted.includes(active)) setMounted([...mounted, active]);

  const scrollPositions = useRef<Record<string, number>>({});

  // Scroll-Position pro Tab laufend mitschreiben (Scroller = .mobile-content)
  useEffect(() => {
    if (!active) return;
    const scroller = document.querySelector('.mobile-content');
    if (!scroller) return;
    const onScroll = () => {
      scrollPositions.current[active] = scroller.scrollTop;
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [active]);

  // Navbar-Wechsel startet oben; nur Rückkehr zum selben Tab restauriert die Scroll-Position
  const lastShownTab = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!isTab || !active) return;
    const scroller = document.querySelector('.mobile-content');
    if (!scroller) return;
    const returningToSameTab = lastShownTab.current === active;
    scroller.scrollTop = returningToSameTab ? (scrollPositions.current[active] ?? 0) : 0;
    lastShownTab.current = active;
  }, [pathname, isTab, active]);

  if (mounted.length === 0) return null;

  return (
    <>
      {mounted.map((path) => {
        const TabPage = TAB_COMPONENTS[path];
        const isActiveTab = isTab && path === active;
        return (
          <div key={path} style={{ display: isActiveTab ? undefined : 'none' }}>
            <TabPage />
          </div>
        );
      })}
    </>
  );
};
