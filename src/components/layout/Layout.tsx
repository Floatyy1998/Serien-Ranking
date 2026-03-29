import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
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

  return (
    <div className="mobile-layout">
      <div className={`mobile-content ${hideNav ? 'no-nav' : 'with-nav'}`}>{children}</div>
      {!hideNav && <BottomNavigation />}
      {!hideFab && <BugFab />}
    </div>
  );
};
