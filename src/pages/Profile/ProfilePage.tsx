/**
 * ProfilePage - Premium User Profile
 * Slim composition component - delegates logic to useProfileData,
 * renders via memoized subcomponents.
 */

import { memo } from 'react';
import {
  ProfileFeaturedNav,
  ProfileHeader,
  ProfileLogoutButton,
  ProfileMenuGroup,
  ProfileStats,
} from './ProfileComponents';
import { useProfileData } from './useProfileData';
import './ProfilePage.css';

export const ProfilePage = memo(() => {
  const {
    user,
    userData,
    currentTheme,
    stats,
    menuItems,
    secondaryMenuItems,
    settingsItems,
    goTo,
    handleLogout,
  } = useProfileData();

  const photoURL = userData?.photoURL || user?.photoURL || null;
  const displayName = userData?.displayName || user?.displayName || 'User';

  return (
    <div className="profile-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div
        className="profile-bg-decoration"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}40, transparent),
            radial-gradient(ellipse 60% 40% at 20% 30%, ${currentTheme.status.warning}20, transparent),
            radial-gradient(ellipse 50% 30% at 80% 20%, ${currentTheme.status.success}15, transparent)
          `,
        }}
      />

      <ProfileHeader
        displayName={displayName}
        email={user?.email}
        photoURL={photoURL}
        currentTheme={currentTheme}
      />

      <ProfileStats stats={stats} currentTheme={currentTheme} />

      <ProfileFeaturedNav
        title="Schnellzugriff"
        items={menuItems}
        currentTheme={currentTheme}
        onNavigate={goTo}
        animationDelay={0.3}
      />

      <ProfileMenuGroup
        title="Deine Aktivitäten"
        items={secondaryMenuItems}
        currentTheme={currentTheme}
        onNavigate={goTo}
        animationDelay={0.4}
      />

      <ProfileMenuGroup
        title="Einstellungen"
        items={settingsItems}
        currentTheme={currentTheme}
        onNavigate={goTo}
        animationDelay={0.5}
      />

      <ProfileLogoutButton
        currentTheme={currentTheme}
        onLogout={handleLogout}
        animationDelay={0.55}
      />
    </div>
  );
});

ProfilePage.displayName = 'ProfilePage';
