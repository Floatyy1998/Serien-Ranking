import type { ReactNode } from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { consumeSwipeDirection, useSwipeTabNavigation } from '../../hooks/useSwipeTabNavigation';
import { BugFab } from '../BugFab';
import { BottomNavigation } from './BottomNavigation';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const Layout = ({ children, hideNav = false }: LayoutProps) => {
  const { pathname } = useLocation();
  const hideFab = pathname === '/bug-report' || pathname === '/admin';
  const swipeHandlers = useSwipeTabNavigation();
  // Beim Mount nach einem Swipe-Wechsel: Seite gleitet aus der Wischrichtung rein
  const [swipeClass] = useState(() => {
    const d = consumeSwipeDirection();
    return d === 1 ? 'swipe-in-next' : d === -1 ? 'swipe-in-prev' : '';
  });

  return (
    <div className="mobile-layout" {...swipeHandlers}>
      <div className={`mobile-content ${hideNav ? 'no-nav' : 'with-nav'} ${swipeClass}`}>
        {children}
      </div>
      {!hideNav && <BottomNavigation />}
      {!hideFab && <BugFab />}
    </div>
  );
};
