import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, HomeOutlined,
  Explore, ExploreOutlined,
  Bookmark, BookmarkBorder,
  Groups, GroupsOutlined,
  Person, PersonOutline
} from '@mui/icons-material';
import './MobileBottomNav.css';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/' && location.pathname === '/home');
  };

  const tabs = [
    { path: '/', label: 'Home', icon: HomeOutlined, activeIcon: Home },
    { path: '/discover', label: 'Entdecken', icon: ExploreOutlined, activeIcon: Explore },
    { path: '/watchlist', label: 'Watchlist', icon: BookmarkBorder, activeIcon: Bookmark },
    { path: '/activity', label: 'Activity', icon: GroupsOutlined, activeIcon: Groups },
    { path: '/profile', label: 'Profil', icon: PersonOutline, activeIcon: Person },
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="nav-container">
        {tabs.map(tab => {
          const active = isActive(tab.path);
          const Icon = active ? tab.activeIcon : tab.icon;
          
          return (
            <button
              key={tab.path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                navigate(tab.path);
              }}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};