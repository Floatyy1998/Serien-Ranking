import { MoreHoriz } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MAIN_TAB_PATHS, NAV_SLOT_OPTIONS } from '../../config/navItems';
import { useNotifications } from '../../contexts/NotificationContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useIsNavRoot } from '../../hooks/useIsNavRoot';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useNavSlots } from '../../hooks/useNavConfig';
import { useTodayEpisodes } from '../../hooks/useTodayEpisodes';
import { hapticTap } from '../../lib/haptics';
import { colors } from '../../theme/colors';
import { PetWidget } from '../pet';
import { NAV_SLOT_ICONS } from './navSlotIcons';
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
  const { unreadRequestsCount } = useOptimizedFriends();
  useNotifications();

  const todayEpisodes = useTodayEpisodes();
  const unwatchedToday = todayEpisodes.filter((ep) => !ep.watched).length;
  const navSlots = useNavSlots();
  const isNavRoot = useIsNavRoot();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Pille springt sofort beim Tap, nicht erst nach dem Render der Ziel-Seite
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [pillPos, setPillPos] = useState({ left: 0, width: 0 });
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = useMemo(() => {
    const slotItems: NavItem[] = navSlots
      .map((id) => NAV_SLOT_OPTIONS.find((o) => o.id === id))
      .filter((o): o is (typeof NAV_SLOT_OPTIONS)[number] => !!o)
      .map((o) => ({
        id: o.id,
        path: o.path,
        label: o.label,
        icon: NAV_SLOT_ICONS[o.id],
        badge: o.id === 'calendar' && unwatchedToday > 0 ? unwatchedToday : undefined,
      }));

    return [
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
      ...slotItems,
      {
        // "Mehr" öffnet den Profil-Hub — dort hängen Discover, Stats, Badges,
        // Pets, Leaderboard, Freunde, Abos, Einstellungen etc.
        id: 'more',
        path: '/profile',
        icon: <MoreHoriz />,
        label: 'Mehr',
        badge: unreadRequestsCount > 0 ? unreadRequestsCount : undefined,
      },
    ];
  }, [navSlots, unwatchedToday, unreadRequestsCount]);

  const getActiveIndex = () => {
    let best = 0;
    let bestLen = -1;
    navItems.forEach((item, i) => {
      const match =
        item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
      if (match && item.path.length > bestLen) {
        best = i;
        bestLen = item.path.length;
      }
    });
    return best;
  };

  const activeIndex = getActiveIndex();
  const pillTargetIndex = hoveredIndex ?? pendingIndex ?? activeIndex;

  // Auf Touch-Geräten feuert kein mouseleave — ohne Reset klebt der Pill nach
  // Swipe-/Programm-Navigation auf dem zuletzt getippten Tab fest.
  useEffect(() => {
    setHoveredIndex(null);
    setPendingIndex(null);
  }, [location.pathname]);

  // Messen nur mit sichtbarem Dock (offsetWidth 0 = versteckt → alte Werte
  // behalten); ResizeObserver fängt Resize/Font-Load/Slot-Änderungen ab
  useLayoutEffect(() => {
    const measure = () => {
      const el = itemRefs.current[pillTargetIndex];
      if (!el || el.offsetWidth === 0) return;
      setPillPos({
        left: el.offsetLeft + 4,
        width: el.offsetWidth - 8,
      });
    };
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pillTargetIndex, navItems.length, location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string, index: number) => {
    hapticTap();
    if (isActive(path)) {
      // Der eigentliche Scroller ist .mobile-content, nicht das Window
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.querySelector('.mobile-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPendingIndex(index);
      navigate(path);
    }
  };

  const { onKeyDown: handleNavKeyDown } = useKeyboardNavigation({
    itemCount: navItems.length,
    currentIndex: activeIndex,
    onIndexChange: (index) => handleNavigation(navItems[index].path, index),
    orientation: 'horizontal',
    loop: true,
  });

  // Das Dock zeigt sich NUR auf seinen eigenen Zielen (Home, Slots, "Mehr") —
  // alle anderen Seiten laufen über Zurück + Home im PageHeader. Der Check auf
  // MAIN_TAB_PATHS verhindert Renders in der versteckten Keep-Alive-Shell.
  if (!isNavRoot || !MAIN_TAB_PATHS.has(location.pathname)) return null;

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
          ref={containerRef}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Animated Pill */}
          <motion.div
            className="nav-pill"
            animate={{ left: pillPos.left, width: pillPos.width }}
            transition={{ type: 'spring', stiffness: 500, damping: 40, bounce: 0 }}
          />

          {navItems.map((item, index) => {
            const active = isActive(item.path);
            const isTarget = index === pillTargetIndex;

            return (
              <motion.button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                aria-label={getAriaLabel(item, active)}
                tabIndex={active ? 0 : -1}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path, index)}
                onMouseEnter={() => setHoveredIndex(index)}
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
                          height: '15px',
                          minWidth: '15px',
                          padding: '0 3px',
                          top: '1px',
                          right: '-1px',
                          background: `linear-gradient(135deg, ${colors.status.error} 0%, ${colors.status.errorHover} 100%)`,
                          boxShadow: `0 1px 3px color-mix(in srgb, ${colors.status.error} 30%, transparent)`,
                        },
                      }}
                    >
                      <div className="nav-icon">{item.icon}</div>
                    </Badge>
                  ) : (
                    <div className="nav-icon">{item.icon}</div>
                  )}
                </div>
                <span
                  className="nav-label"
                  style={{
                    color: isTarget ? 'var(--color-primary)' : undefined,
                  }}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
