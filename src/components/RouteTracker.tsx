import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../firebase/analytics';

const ROUTE_NAMES: Record<string, string> = {
  '/': 'home',
  '/watch-next': 'watch_next',
  '/ratings': 'ratings',
  '/profile': 'profile',
  '/discover': 'discover',
  '/search': 'search',
  '/activity': 'activity',
  '/calendar': 'calendar',
  '/countdown': 'countdown',
  '/recently-watched': 'recently_watched',
  '/badges': 'badges',
  '/pets': 'pets',
  '/theme': 'theme',
  '/home-layout': 'home_layout',
  '/stats': 'stats',
  '/leaderboard': 'leaderboard',
  '/wrapped': 'wrapped',
  '/actor-universe': 'actor_universe',
  '/catch-up': 'catch_up',
  '/hidden-series': 'hidden_series',
  '/watch-journey': 'watch_journey',
  '/discussion-feed': 'discussion_feed',
  '/settings': 'settings',
  '/patch-notes': 'patch_notes',
  '/login': 'login',
  '/register': 'register',
  '/privacy': 'privacy',
  '/impressum': 'impressum',
};

function getPageName(pathname: string): string {
  if (ROUTE_NAMES[pathname]) return ROUTE_NAMES[pathname];
  if (pathname.startsWith('/series/')) return 'series_detail';
  if (pathname.startsWith('/movie/')) return 'movie_detail';
  if (pathname.startsWith('/episodes/')) return 'episode_management';
  if (pathname.startsWith('/episode/')) return 'episode_discussion';
  if (pathname.startsWith('/rating/')) return 'rating';
  if (pathname.startsWith('/friend/')) return 'friend_profile';
  if (pathname.startsWith('/taste-match/')) return 'taste_match';
  if (pathname.startsWith('/public/')) return 'public_profile';
  if (pathname.startsWith('/profile-settings')) return 'profile_settings';
  return pathname.replace(/\//g, '_').replace(/^_/, '') || 'home';
}

export function RouteTracker() {
  const location = useLocation();
  const prevPath = useRef('');

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      logPageView(getPageName(location.pathname));
    }
  }, [location.pathname]);

  return null;
}
