import { BarChart, Person, PlayCircle, Star } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
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
  const { unreadActivitiesCount, unreadRequestsCount } = useOptimizedFriends();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  // Calculate total badge count - only show if greater than 0
  // Achievement badges are kept private and not shown in navigation
  const totalBadgeCount =
    (unreadActivitiesCount || 0) + (unreadRequestsCount || 0) + (notificationUnreadCount || 0);

  const navItems: NavItem[] = [
    {
      id: 'home',
      path: '/',
      icon: <div style={{
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
      }} />,
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
      badge: totalBadgeCount > 0 ? totalBadgeCount : undefined,
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
    location.pathname === '/new-episodes';

  if (shouldHide) return null;

  return (
    <>
      {/* Pet Widget */}
      <PetWidget />

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
                  {item.badge && (typeof item.badge === 'boolean' || item.badge > 0) ? (
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
                  ) : (
                    <div className="nav-icon">{item.icon}</div>
                  )}

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
    </>
  );
};
