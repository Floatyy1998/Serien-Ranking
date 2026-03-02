/**
 * ProfileComponents - Memoized subcomponents for ProfilePage
 * ProfileHeader, ProfileStats, ProfileMenuSection, ProfileLogoutButton
 */

import {
  CalendarToday,
  ChevronRight,
  Logout,
  Movie,
  Person,
  PlayCircle,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { GradientText } from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import type { ProfileMenuItem, ProfileStats as ProfileStatsType } from './useProfileData';

type Theme = ReturnType<typeof useTheme>['currentTheme'];

/* ------------------------------------------------------------------ */
/*  ProfileHeader                                                      */
/* ------------------------------------------------------------------ */

interface ProfileHeaderProps {
  displayName: string;
  email: string | null | undefined;
  photoURL: string | null | undefined;
  currentTheme: Theme;
}

export const ProfileHeader = memo(
  ({ displayName, email, photoURL, currentTheme }: ProfileHeaderProps) => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="profile-header"
    >
      {/* Avatar Container */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="profile-avatar-container"
      >
        <div
          className="profile-avatar-glow"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.warning}, ${currentTheme.status.success})`,
          }}
        />
        <div
          className="profile-avatar-ring"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.warning})`,
          }}
        >
          <div
            className="profile-avatar-ring-inner"
            style={{ background: currentTheme.background.default }}
          />
        </div>
        <div
          className="profile-avatar-image"
          style={
            photoURL
              ? { backgroundImage: `url("${photoURL}")` }
              : {
                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                }
          }
        >
          {!photoURL && <Person style={{ fontSize: '50px', color: 'white' }} />}
        </div>
      </motion.div>

      {/* Name & Email */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <GradientText
          as="h1"
          from={currentTheme.text.primary}
          to={currentTheme.primary}
          style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0' }}
        >
          {displayName}
        </GradientText>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="profile-email"
        style={{ color: currentTheme.text.muted }}
      >
        {email}
      </motion.p>
    </motion.div>
  )
);
ProfileHeader.displayName = 'ProfileHeader';

/* ------------------------------------------------------------------ */
/*  ProfileStats                                                       */
/* ------------------------------------------------------------------ */

interface StatItemConfig {
  icon: SvgIconComponent;
  value: number;
  label: string;
  color: string;
}

interface ProfileStatsProps {
  stats: ProfileStatsType;
  currentTheme: Theme;
}

export const ProfileStats = memo(({ stats, currentTheme }: ProfileStatsProps) => {
  const statItems: StatItemConfig[] = [
    {
      icon: CalendarToday,
      value: stats.totalSeries,
      label: 'Serien',
      color: currentTheme.primary,
    },
    {
      icon: Movie,
      value: stats.totalMovies,
      label: 'Filme',
      color: currentTheme.status.error,
    },
    {
      icon: PlayCircle,
      value: stats.watchedEpisodes,
      label: 'Episoden',
      color: currentTheme.status.success,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="profile-stats-card"
      style={{
        background: `${currentTheme.background.surface}cc`,
        border: `1px solid ${currentTheme.border.default}`,
      }}
    >
      {/* Time Hero */}
      <div className="profile-stats-time">
        <GradientText
          as="p"
          to={currentTheme.status.warning}
          style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}
        >
          {stats.timeString}
        </GradientText>
        <div className="profile-stats-time-label" style={{ color: currentTheme.text.muted }}>
          Gesamte Watchtime
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        {statItems.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ scale: 1.02 }}
            className="profile-stat-item"
            style={{
              background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`,
              border: `1px solid ${item.color}25`,
            }}
          >
            <item.icon className="profile-stat-icon" style={{ color: item.color }} />
            <div className="profile-stat-value" style={{ color: currentTheme.text.primary }}>
              {item.value}
            </div>
            <div className="profile-stat-label" style={{ color: currentTheme.text.muted }}>
              {item.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
ProfileStats.displayName = 'ProfileStats';

/* ------------------------------------------------------------------ */
/*  ProfileFeaturedNav - Large featured navigation buttons             */
/* ------------------------------------------------------------------ */

interface ProfileFeaturedNavProps {
  title: string;
  items: ProfileMenuItem[];
  currentTheme: Theme;
  onNavigate: (path: string) => void;
  animationDelay: number;
}

export const ProfileFeaturedNav = memo(
  ({ title, items, currentTheme, onNavigate, animationDelay }: ProfileFeaturedNavProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="profile-menu-section"
    >
      <h2 className="profile-section-title" style={{ color: currentTheme.text.muted }}>
        {title}
      </h2>
      <div className="profile-featured-list">
        {items.map((item, index) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animationDelay + 0.05 + index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate(item.path)}
            className="profile-featured-item"
            style={{
              background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
              border: `1px solid ${item.color}30`,
              color: currentTheme.text.primary,
            }}
          >
            <div className="profile-featured-item-left">
              <div
                className="profile-featured-icon-wrap"
                style={{
                  background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
                }}
              >
                <item.icon style={{ fontSize: '22px', color: 'white' }} />
              </div>
              <span className="profile-featured-label">{item.label}</span>
            </div>
            <div className="profile-featured-item-right">
              {item.badge !== undefined && item.badge > 0 && (
                <div
                  className="profile-badge profile-badge-large"
                  style={{ background: currentTheme.status.error }}
                >
                  {item.badge}
                </div>
              )}
              <ChevronRight style={{ fontSize: '22px', color: currentTheme.text.muted }} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
);
ProfileFeaturedNav.displayName = 'ProfileFeaturedNav';

/* ------------------------------------------------------------------ */
/*  ProfileMenuGroup - Grouped list menu (secondary, settings)         */
/* ------------------------------------------------------------------ */

interface ProfileMenuGroupProps {
  title: string;
  items: ProfileMenuItem[];
  currentTheme: Theme;
  onNavigate: (path: string) => void;
  animationDelay: number;
}

export const ProfileMenuGroup = memo(
  ({ title, items, currentTheme, onNavigate, animationDelay }: ProfileMenuGroupProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="profile-menu-section"
    >
      <h2 className="profile-section-title" style={{ color: currentTheme.text.muted }}>
        {title}
      </h2>
      <div
        className="profile-menu-group"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {items.map((item, index) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animationDelay + 0.05 + index * 0.03 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigate(item.path)}
            className="profile-menu-item"
            style={{
              borderBottom:
                index < items.length - 1 ? `1px solid ${currentTheme.border.default}` : 'none',
              color: currentTheme.text.primary,
            }}
          >
            <div className="profile-menu-item-left">
              <div className="profile-menu-icon-wrap" style={{ background: `${item.color}15` }}>
                <item.icon style={{ fontSize: '20px', color: item.color }} />
              </div>
              <span className="profile-menu-label">{item.label}</span>
            </div>
            <div className="profile-menu-item-right">
              {item.badge !== undefined && item.badge > 0 && (
                <div
                  className="profile-badge profile-badge-small"
                  style={{ background: currentTheme.status.error }}
                >
                  {item.badge}
                </div>
              )}
              <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
);
ProfileMenuGroup.displayName = 'ProfileMenuGroup';

/* ------------------------------------------------------------------ */
/*  ProfileLogoutButton                                                */
/* ------------------------------------------------------------------ */

interface ProfileLogoutButtonProps {
  currentTheme: Theme;
  onLogout: () => void;
  animationDelay: number;
}

export const ProfileLogoutButton = memo(
  ({ currentTheme, onLogout, animationDelay }: ProfileLogoutButtonProps) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="profile-logout-section"
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        className="profile-logout-btn"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.status.error}15, ${currentTheme.status.error}08)`,
          border: `1px solid ${currentTheme.status.error}30`,
          color: currentTheme.status.error,
        }}
      >
        <Logout style={{ fontSize: '20px' }} />
        Abmelden
      </motion.button>
    </motion.div>
  )
);
ProfileLogoutButton.displayName = 'ProfileLogoutButton';
