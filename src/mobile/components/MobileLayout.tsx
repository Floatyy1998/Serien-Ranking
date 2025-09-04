import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const navigationOrder = [
  '/',
  '/today-episodes',
  '/movies',
  '/ratings',
  '/profile'
];

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, hideNav = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current index in navigation order
  const currentIndex = navigationOrder.indexOf(location.pathname);
  
  // Swipe handlers for navigation
  const swipeHandlers = {
    onSwipeLeft: () => {
      if (currentIndex !== -1 && currentIndex < navigationOrder.length - 1) {
        navigate(navigationOrder[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        navigate(navigationOrder[currentIndex - 1]);
      }
    }
  };
  
  // Only enable swipe gestures on main navigation pages
  const enableSwipe = !hideNav && currentIndex !== -1;
  const swipeRef = useSwipeGestures(
    enableSwipe ? swipeHandlers : {},
    { threshold: 75, restraint: 100, allowedTime: 500 }
  );
  
  return (
    <div className="mobile-layout" ref={swipeRef as any}>
      <div className={`mobile-content ${hideNav ? 'no-nav' : 'with-nav'}`}>
        {children}
      </div>
      {!hideNav && <MobileBottomNavigation />}
    </div>
  );
};