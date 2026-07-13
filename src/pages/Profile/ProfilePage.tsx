/**
 * ProfilePage - Premium User Profile
 * Slim composition component - delegates logic to useProfileData,
 * renders via memoized subcomponents.
 */

import { memo } from 'react';
import { BackButton } from '../../components/ui/BackButton';
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
    mangaMenuItems,
    settingsItems,
    heroBackdrops,
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

      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <BackButton />
      </div>

      {/* Kino-Hero: mobil ein neutraler Wrapper, Desktop eine Backdrop-Collage
          der Top-Serien mit Identität + Stats als Glas-Ebene darüber */}
      <div className="profile-hero">
        <div className="profile-hero-collage" aria-hidden="true">
          {heroBackdrops.map((url) => (
            <div
              key={url}
              className="profile-hero-tile"
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}
        </div>
        <div
          className="profile-hero-scrim"
          aria-hidden="true"
          style={{
            /* Detail-Hero-Rezept: links dunkler Lesebereich, unten Fade in die Seite */
            background: `linear-gradient(90deg, ${currentTheme.background.default}e6 0%, ${currentTheme.background.default}59 24%, transparent 48%),
              linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.45) 55%, ${currentTheme.background.default} 100%)`,
          }}
        />
        <div className="profile-hero-content">
          <ProfileHeader
            displayName={displayName}
            email={user?.email}
            photoURL={photoURL}
            currentTheme={currentTheme}
          />

          <ProfileStats stats={stats} currentTheme={currentTheme} />
        </div>
      </div>

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
        animationDelay={0.35}
      />

      {mangaMenuItems.length > 0 && (
        <ProfileMenuGroup
          title="Manga"
          items={mangaMenuItems}
          currentTheme={currentTheme}
          onNavigate={goTo}
          animationDelay={0.4}
        />
      )}

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
