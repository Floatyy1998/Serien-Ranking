import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MAIN_TAB_PATHS } from '../../config/navItems';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Haupt-Tabs stellen ihre Scroll-Position selbst wieder her (MainTabs)
    if (MAIN_TAB_PATHS.has(pathname)) return;

    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      // Scroll window to top
      window.scrollTo(0, 0);

      document.querySelectorAll('.mobile-content').forEach((el) => {
        el.scrollTop = 0;
      });

      // Also handle any other scrollable containers
      const scrollableContainers = document.querySelectorAll(
        '.mobile-app, .mobile-layout, [data-scrollable="true"]'
      );
      scrollableContainers.forEach((container) => {
        container.scrollTop = 0;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};
