import React, { ReactNode } from 'react';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import './MobileLayout.css';

interface MobileLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, hideNav = false }) => {
  return (
    <div className="mobile-layout">
      <div className={`mobile-content ${hideNav ? 'no-nav' : 'with-nav'}`}>
        {children}
      </div>
      {!hideNav && <MobileBottomNavigation />}
    </div>
  );
};