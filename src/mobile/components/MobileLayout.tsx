import { ReactNode } from 'react';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout = ({ children, hideNav = false }: MobileLayoutProps) => {
  return (
    <div className="mobile-layout">
      <div className={`mobile-content ${hideNav ? 'no-nav' : 'with-nav'}`}>
        {children}
      </div>
      {!hideNav && <MobileBottomNavigation />}
    </div>
  );
};