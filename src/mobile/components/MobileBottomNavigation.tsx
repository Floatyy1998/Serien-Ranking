import { BarChart, Home, Person, PlayCircle, Star } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useBadges } from '../../features/badges/BadgeProvider';
import './MobileBottomNavigation.css';

interface NavItem {
  id: string;
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number | boolean;
}

export const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadActivitiesCount, unreadRequestsCount } = useOptimizedFriends();
  const { unreadBadgesCount } = useBadges();
  // const { totalUnreadActivities } = useNotifications();
  // const { unreadCount: generalNotificationCount } = useGeneralNotifications();

  const navItems: NavItem[] = [
    {
      id: 'home',
      path: '/',
      icon: <Home />,
      label: 'Home',
    },
    {
      id: 'watchnext',
      path: '/watchlist',
      icon: <PlayCircle />,
      label: 'Weiter',
    },
    {
      id: 'search',
      path: '/discover',
      icon: <Star />,
      label: 'Entdecken',
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
      label: 'Mehr',
      badge:
        unreadActivitiesCount + unreadRequestsCount + (unreadBadgesCount || 0) > 0
          ? unreadActivitiesCount + unreadRequestsCount + (unreadBadgesCount || 0)
          : undefined,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    // If already on the page, scroll to top
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
    location.pathname.includes('/rating/') || // Only hide for /rating/:type/:id
    location.pathname.includes('/episodes') ||
    location.pathname === '/all-episodes' ||
    location.pathname === '/new-episodes';

  if (shouldHide) return null;

  return (
    <div className="mobile-bottom-navigation">
      <div className="nav-container">
        {navItems.map((item) => {
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
              whileTap={{ scale: 0.9 }}
            >
              <div className="nav-icon-container">
                <Badge
                  badgeContent={item.badge}
                  color="error"
                  variant={typeof item.badge === 'boolean' ? 'dot' : 'standard'}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '10px',
                      height: '16px',
                      minWidth: '16px',
                      padding: '0 4px',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
                      boxShadow: '0 2px 4px rgba(255, 107, 107, 0.3)',
                    },
                  }}
                >
                  <div className="nav-icon">{item.icon}</div>
                </Badge>

                {/* Active Indicator */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      className="active-indicator"
                      layoutId="activeTab"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <span className="nav-label">{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Safe area for iPhone */}
      <div className="safe-area-bottom" />
    </div>
  );
};
