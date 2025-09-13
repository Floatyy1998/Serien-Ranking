import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      // Scroll window to top
      window.scrollTo(0, 0);
      
      // Scroll mobile-content container to top (this is the main scroll container)
      const mobileContent = document.querySelector('.mobile-content');
      if (mobileContent) {
        mobileContent.scrollTop = 0;
      }
      
      // Also handle any other scrollable containers
      const scrollableContainers = document.querySelectorAll('.mobile-app, .mobile-layout, [data-scrollable="true"]');
      scrollableContainers.forEach(container => {
        container.scrollTop = 0;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};