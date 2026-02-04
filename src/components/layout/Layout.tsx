import { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const Layout = ({ children, hideNav = false }: LayoutProps) => {
  return (
    <div className="mobile-layout">
      <div className={`mobile-content ${hideNav ? 'no-nav' : 'with-nav'}`}>
        {children}
      </div>
      {!hideNav && <BottomNavigation />}
    </div>
  );
};
