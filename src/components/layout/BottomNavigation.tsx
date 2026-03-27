import { BarChart, CalendarToday, Person, PlayCircle } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContextDef';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useTodayEpisodes } from '../../hooks/useTodayEpisodes';
import { PetWidget } from '../pet';
import './BottomNavigation.css';

interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number | boolean;
}

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useTheme();
  const { unreadActivitiesCount, unreadRequestsCount } = useOptimizedFriends();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  // Calculate total badge count - only show if greater than 0
  // Achievement badges are kept private and not shown in navigation
  const totalBadgeCount =
    (unreadActivitiesCount || 0) + (unreadRequestsCount || 0) + (notificationUnreadCount || 0);

  const todayEpisodes = useTodayEpisodes();
  const unwatchedToday = todayEpisodes.filter((ep) => !ep.watched).length;

  const getActiveIndex = () => {
    if (location.pathname === '/') return 0;
    if (location.pathname.startsWith('/watchlist')) return 1;
    if (location.pathname === '/calendar') return 2;
    if (location.pathname.startsWith('/ratings')) return 3;
    if (location.pathname.startsWith('/profile')) return 4;
    return 0;
  };

  const activeIndex = getActiveIndex();

  const navItems: NavItem[] = [
    {
      id: 'home',
      path: '/',
      icon: (
        <div
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'currentColor',
            WebkitMaskImage: 'url(/tv-logo.svg)',
            maskImage: 'url(/tv-logo.svg)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain' as string,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat' as string,
            WebkitMaskPosition: 'center',
            maskPosition: 'center' as string,
          }}
        />
      ),
      label: 'Home',
    },
    {
      id: 'watchnext',
      path: '/watchlist',
      icon: <PlayCircle />,
      label: 'Weiter',
    },
    {
      id: 'calendar',
      path: '/calendar',
      icon: <CalendarToday />,
      label: 'Kalender',
      badge: unwatchedToday > 0 ? unwatchedToday : undefined,
    },
    {
      id: 'ratings',
      path: '/ratings',
      icon: <BarChart />,
      label: 'Bewertungen',
    },
    {
      id: 'profile',
      path: '/profile',
      icon: <Person />,
      label: 'Profil',
      badge: totalBadgeCount > 0 ? totalBadgeCount : undefined,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (isActive(path)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };

  // Hide on detail pages
  const shouldHide =
    location.pathname.includes('/series/') ||
    location.pathname.includes('/movie/') ||
    location.pathname.includes('/rating/') ||
    location.pathname.startsWith('/episodes/');

  const { onKeyDown: handleNavKeyDown } = useKeyboardNavigation({
    itemCount: navItems.length,
    currentIndex: activeIndex,
    onIndexChange: (index) => handleNavigation(navItems[index].path),
    orientation: 'horizontal',
    loop: true,
  });

  if (shouldHide) return null;

  const getAriaLabel = (item: NavItem, active: boolean) => {
    let label = item.label;
    if (item.badge && typeof item.badge === 'number') {
      label += `, ${item.badge} neue Benachrichtigungen`;
    }
    if (active) {
      label += ' (aktuelle Seite)';
    }
    return label;
  };

  return (
    <>
      <PetWidget />

      <nav className="mobile-bottom-navigation" aria-label="Hauptnavigation">
        <div
          className="nav-container"
          role="tablist"
          aria-label="Seitennavigation"
          onKeyDown={handleNavKeyDown}
        >
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <motion.button
                key={item.id}
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                aria-label={getAriaLabel(item, active)}
                tabIndex={active ? 0 : -1}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                whileTap={{ scale: 0.9 }}
              >
                <div className="nav-icon-container">
                  {item.badge && (typeof item.badge === 'boolean' || item.badge > 0) ? (
                    <Badge
                      badgeContent={item.badge}
                      color="error"
                      variant={typeof item.badge === 'boolean' ? 'dot' : 'standard'}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '9px',
                          height: '14px',
                          minWidth: '14px',
                          padding: '0 3px',
                          top: '1px',
                          right: '-1px',
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
                          boxShadow: '0 1px 3px rgba(255, 107, 107, 0.3)',
                        },
                      }}
                    >
                      <div className="nav-icon">{item.icon}</div>
                    </Badge>
                  ) : (
                    <div className="nav-icon">{item.icon}</div>
                  )}
                  {/* Active dot */}
                  {active && <div className="nav-active-dot" />}
                </div>

                <span className="nav-label">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
