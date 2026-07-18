import type { ComponentType } from 'react';
import { startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MAIN_TAB_PATHS, NAV_SLOT_PATHS } from '../../config/navItems';
import { useNavSlots } from '../../hooks/useNavConfig';
import {
  ActivityPage,
  BadgesPage,
  CalendarPage,
  CatchUpPage,
  CountdownPage,
  DiscoverPage,
  LeaderboardPage,
  MangaPage,
  PetsPage,
  RecentlyWatchedPage,
  StatsPage,
  SubscriptionsPage,
} from '../../lazyRoutes';
import { HomePage } from '../../pages/HomePage';
import { ProfilePage } from '../../pages/Profile';
import { RatingsPage } from '../../pages/Ratings';
import { SearchPage } from '../../pages/Search';
import { WatchNextPage } from '../../pages/WatchNext';

// Keep-Alive: besuchte Haupt-Tabs bleiben gemountet (display:none statt Unmount)
const TAB_COMPONENTS: Record<string, ComponentType> = {
  '/': HomePage,
  '/profile': ProfilePage,
  '/search': SearchPage,
  '/watchlist': WatchNextPage,
  '/ratings': RatingsPage,
  '/calendar': CalendarPage,
  '/manga': MangaPage,
  '/discover': DiscoverPage,
  '/stats': StatsPage,
  '/leaderboard': LeaderboardPage,
  '/badges': BadgesPage,
  '/pets': PetsPage,
  '/activity': ActivityPage,
  '/countdowns': CountdownPage,
  '/catch-up': CatchUpPage,
  '/subscriptions': SubscriptionsPage,
  '/recently-watched': RecentlyWatchedPage,
};

export const MainTabs = () => {
  const { pathname } = useLocation();
  const navSlots = useNavSlots();
  const isTab = MAIN_TAB_PATHS.has(pathname);

  const [active, setActive] = useState<string | null>(isTab ? pathname : null);
  if (isTab && active !== pathname) setActive(pathname);

  const [mounted, setMounted] = useState<string[]>(() => (isTab ? [pathname] : []));
  if (active && !mounted.includes(active)) setMounted([...mounted, active]);

  // Aktive Navbar-Ziele im Leerlauf versteckt vormounten (nicht alle 17 Tabs)
  useEffect(() => {
    if (!active) return;
    const slotPaths = navSlots.map((id) => NAV_SLOT_PATHS[id]);
    const premountOrder = ['/', ...slotPaths, '/profile', '/search'].filter(
      (p) => p in TAB_COMPONENTS
    );
    const next = premountOrder.find((p) => !mounted.includes(p));
    if (!next) return;
    let cancelled = false;
    const kick = () => {
      if (cancelled) return;
      startTransition(() => {
        setMounted((prev) => (prev.includes(next) ? prev : [...prev, next]));
      });
    };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(kick, { timeout: 4000 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }
    const id = setTimeout(kick, 1500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [active, mounted, navSlots]);

  const scrollPositions = useRef<Record<string, number>>({});

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

  // display:none verwirft die Scroll-Position; nur Rückkehr zum selben Tab restauriert sie
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
