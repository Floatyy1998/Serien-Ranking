import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsNavRoot } from '../../hooks/useIsNavRoot';
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
  // Das Dock erscheint nur auf seinen Zielen — ohne Dock kein Dock-Padding.
  const isNavRoot = useIsNavRoot();
  const contentClass = hideNav ? 'no-nav' : isNavRoot ? 'with-nav' : 'with-nav nav-hidden';

  return (
    <div className="mobile-layout">
      <div className={`mobile-content ${contentClass}`}>{children}</div>
      {!hideNav && <BottomNavigation />}
      {!hideFab && <BugFab />}
    </div>
  );
};
