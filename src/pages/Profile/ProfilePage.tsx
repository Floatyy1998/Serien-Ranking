/**
 * ProfilePage - Premium User Profile
 * Modern profile view with stats and navigation
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { motion } from 'framer-motion';
import {
  Person,
  Settings,
  Logout,
  Star,
  PlayCircle,
  CalendarToday,
  Movie,
  TrendingUp,
  EmojiEvents,
  ChevronRight,
  Palette,
  Search,
  Group,
  Pets,
  History,
  Leaderboard,
  ViewQuilt,
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useBadges } from '../../features/badges/BadgeProvider';
import { GradientText } from '../../components/ui';
import type { Movie as MovieType } from '../../types/Movie';

interface UserProfileData {
  username?: string;
  displayName?: string;
  photoURL?: string;
  isPublic?: boolean;
}

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const { unreadActivitiesCount, unreadRequestsCount } = useOptimizedFriends();
  const { unreadBadgesCount } = useBadges();

  // Load user data from Firebase Database
  const { data: userData } = useEnhancedFirebaseCache<UserProfileData>(
    user ? `users/${user.uid}` : '',
    {
      ttl: 5 * 60 * 1000,
      useRealtimeListener: true,
      enableOfflineSupport: true,
    }
  );

  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const stats = useMemo(() => {
    const totalSeries = seriesList.length;
    const totalMovies = movieList.length;
    const today = new Date();

    let watchedEpisodes = 0;
    let totalMinutesWatched = 0;

    seriesList.forEach((series) => {
      if (!series || series.nmr === undefined || series.nmr === null) return;
      const seriesRuntime = series.episodeRuntime || 45;

      if (series.seasons) {
        series.seasons.forEach((season) => {
          if (season.episodes) {
            season.episodes.forEach((episode) => {
              const isWatched = !!(
                episode.firstWatchedAt ||
                episode.watched === true ||
                (episode.watched as unknown) === 1 ||
                (episode.watched as unknown) === 'true' ||
                (episode.watchCount && episode.watchCount > 0)
              );

              if (isWatched) {
                const epRuntime = episode.runtime || seriesRuntime;
                if (episode.air_date) {
                  const airDate = new Date(episode.air_date);
                  if (airDate <= today) {
                    watchedEpisodes++;
                    const watchCount =
                      episode.watchCount && episode.watchCount > 1 ? episode.watchCount : 1;
                    totalMinutesWatched += epRuntime * watchCount;
                  }
                } else {
                  watchedEpisodes++;
                  const watchCount =
                    episode.watchCount && episode.watchCount > 1 ? episode.watchCount : 1;
                  totalMinutesWatched += epRuntime * watchCount;
                }
              }
            });
          }
        });
      }
    });

    movieList.forEach((movie: MovieType) => {
      if (movie && movie.nmr !== undefined && movie.nmr !== null) {
        const rating = parseFloat(calculateOverallRating(movie));
        const isWatched = !isNaN(rating) && rating > 0;
        if (isWatched) {
          totalMinutesWatched += movie.runtime || 120;
        }
      }
    });

    const years = Math.floor(totalMinutesWatched / (365 * 24 * 60));
    const remainingAfterYears = totalMinutesWatched % (365 * 24 * 60);
    const months = Math.floor(remainingAfterYears / (30 * 24 * 60));
    const remainingAfterMonths = remainingAfterYears % (30 * 24 * 60);
    const days = Math.floor(remainingAfterMonths / 1440);
    const hours = Math.floor((remainingAfterMonths % 1440) / 60);
    const minutes = remainingAfterMonths % 60;

    let timeString = '';
    if (years > 0) timeString += `${years}J `;
    if (months > 0) timeString += `${months}M `;
    if (days > 0) timeString += `${days}T `;
    if (hours > 0) timeString += `${hours}S `;
    if (minutes > 0) timeString += `${Math.floor(minutes)}Min`;
    if (!timeString) timeString = '0Min';

    return {
      totalSeries,
      totalMovies,
      watchedEpisodes,
      totalMinutes: totalMinutesWatched,
      timeString: timeString.trim(),
    };
  }, [seriesList, movieList]);

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      navigate('/');
    } catch (error) {
      // Silent fail
    }
  };

  const menuItems = [
    {
      label: 'Meine Bewertungen',
      icon: Star,
      color: currentTheme.status.warning,
      path: '/ratings',
      featured: true,
    },
    {
      label: 'Aktivität & Freunde',
      icon: Group,
      color: currentTheme.primary,
      path: '/activity',
      badge: unreadActivitiesCount + unreadRequestsCount,
      featured: true,
    },
    {
      label: 'Hinzufügen & Suchen',
      icon: Search,
      color: currentTheme.status.error,
      path: '/discover',
      featured: true,
    },
  ];

  const secondaryMenuItems = [
    { label: 'Rangliste', icon: Leaderboard, color: '#f59e0b', path: '/leaderboard' },
    { label: 'Statistiken', icon: TrendingUp, color: currentTheme.primary, path: '/stats' },
    { label: 'Verlauf', icon: History, color: currentTheme.status.success, path: '/recently-watched' },
    {
      label: 'Erfolge',
      icon: EmojiEvents,
      color: currentTheme.status.warning,
      path: '/badges',
      badge: unreadBadgesCount || 0,
    },
    { label: 'Haustiere', icon: Pets, color: '#ec4899', path: '/pets' },
  ];

  const settingsItems = [
    { label: 'Design', icon: Palette, color: currentTheme.primary, path: '/theme' },
    { label: 'Layout', icon: ViewQuilt, color: '#a855f7', path: '/home-layout' },
    { label: 'Einstellungen', icon: Settings, color: currentTheme.text.secondary, path: '/settings' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
        paddingBottom: '100px',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '350px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}40, transparent),
            radial-gradient(ellipse 60% 40% at 20% 30%, ${currentTheme.status.warning}20, transparent),
            radial-gradient(ellipse 50% 30% at 80% 20%, ${currentTheme.status.success}15, transparent)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative',
          padding: '20px',
          paddingTop: 'calc(50px + env(safe-area-inset-top))',
          textAlign: 'center',
        }}
      >
        {/* Avatar Container */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{
            width: '110px',
            height: '110px',
            margin: '0 auto 20px',
            position: 'relative',
          }}
        >
          {/* Glow Effect */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.warning}, ${currentTheme.status.success})`,
              opacity: 0.6,
              filter: 'blur(8px)',
            }}
          />
          {/* Avatar Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.warning})`,
              padding: '3px',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: currentTheme.background.default,
              }}
            />
          </div>
          {/* Avatar Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              ...(userData?.photoURL || user?.photoURL
                ? {
                    backgroundImage: `url("${userData?.photoURL || user?.photoURL}")`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }
                : {
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`,
                  }),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!(userData?.photoURL || user?.photoURL) && (
              <Person style={{ fontSize: '50px', color: 'white' }} />
            )}
          </div>
        </motion.div>

        {/* Name & Email */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <GradientText as="h1" from={currentTheme.text.primary} to={currentTheme.primary} style={{
            fontSize: '26px',
            fontWeight: 800,
            margin: '0 0 6px 0',
          }}>
            {userData?.displayName || user?.displayName || 'User'}
          </GradientText>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            fontSize: '14px',
            color: currentTheme.text.muted,
            margin: 0,
          }}
        >
          {user?.email}
        </motion.p>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          margin: '0 20px 24px',
          padding: '20px',
          borderRadius: '20px',
          background: `${currentTheme.background.surface}cc`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {/* Time Hero */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <GradientText as="p" to={currentTheme.status.warning} style={{
              fontSize: '32px',
              fontWeight: 800,
              marginBottom: '4px',
            }}
          >
            {stats.timeString}
          </GradientText>
          <div style={{ fontSize: '13px', color: currentTheme.text.muted }}>
            Gesamte Watchtime
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '14px 12px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}08)`,
              border: `1px solid ${currentTheme.primary}25`,
              textAlign: 'center',
            }}
          >
            <CalendarToday
              style={{ fontSize: '22px', color: currentTheme.primary, marginBottom: '6px' }}
            />
            <div style={{ fontSize: '22px', fontWeight: 700, color: currentTheme.text.primary }}>
              {stats.totalSeries}
            </div>
            <div style={{ fontSize: '11px', color: currentTheme.text.muted }}>Serien</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '14px 12px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${currentTheme.status.error}15, ${currentTheme.status.error}08)`,
              border: `1px solid ${currentTheme.status.error}25`,
              textAlign: 'center',
            }}
          >
            <Movie
              style={{ fontSize: '22px', color: currentTheme.status.error, marginBottom: '6px' }}
            />
            <div style={{ fontSize: '22px', fontWeight: 700, color: currentTheme.text.primary }}>
              {stats.totalMovies}
            </div>
            <div style={{ fontSize: '11px', color: currentTheme.text.muted }}>Filme</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            style={{
              padding: '14px 12px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${currentTheme.status.success}15, ${currentTheme.status.success}08)`,
              border: `1px solid ${currentTheme.status.success}25`,
              textAlign: 'center',
            }}
          >
            <PlayCircle
              style={{ fontSize: '22px', color: currentTheme.status.success, marginBottom: '6px' }}
            />
            <div style={{ fontSize: '22px', fontWeight: 700, color: currentTheme.text.primary }}>
              {stats.watchedEpisodes}
            </div>
            <div style={{ fontSize: '11px', color: currentTheme.text.muted }}>Episoden</div>
          </motion.div>
        </div>
      </motion.div>

      {/* Featured Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ padding: '0 20px', marginBottom: '20px' }}
      >
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: currentTheme.text.muted,
            margin: '0 0 12px 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Schnellzugriff
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map((item, index) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                border: `1px solid ${item.color}30`,
                borderRadius: '16px',
                color: currentTheme.text.primary,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.badge !== undefined && item.badge > 0 && (
                  <div
                    style={{
                      background: currentTheme.status.error,
                      color: 'white',
                      borderRadius: '10px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      minWidth: '24px',
                      textAlign: 'center',
                    }}
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

      {/* Secondary Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ padding: '0 20px', marginBottom: '20px' }}
      >
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: currentTheme.text.muted,
            margin: '0 0 12px 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Deine Aktivitäten
        </h2>
        <div
          style={{
            background: currentTheme.background.surface,
            borderRadius: '16px',
            border: `1px solid ${currentTheme.border.default}`,
            overflow: 'hidden',
          }}
        >
          {secondaryMenuItems.map((item, index) => (
            <motion.button
              key={item.path}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 + index * 0.03 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  index < secondaryMenuItems.length - 1
                    ? `1px solid ${currentTheme.border.default}`
                    : 'none',
                color: currentTheme.text.primary,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon style={{ fontSize: '20px', color: item.color }} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.badge !== undefined && item.badge > 0 && (
                  <div
                    style={{
                      background: currentTheme.status.error,
                      color: 'white',
                      borderRadius: '10px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      minWidth: '22px',
                      textAlign: 'center',
                    }}
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

      {/* Settings Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ padding: '0 20px', marginBottom: '20px' }}
      >
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: currentTheme.text.muted,
            margin: '0 0 12px 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Einstellungen
        </h2>
        <div
          style={{
            background: currentTheme.background.surface,
            borderRadius: '16px',
            border: `1px solid ${currentTheme.border.default}`,
            overflow: 'hidden',
          }}
        >
          {settingsItems.map((item, index) => (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  index < settingsItems.length - 1
                    ? `1px solid ${currentTheme.border.default}`
                    : 'none',
                color: currentTheme.text.primary,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon style={{ fontSize: '20px', color: item.color }} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{item.label}</span>
              </div>
              <ChevronRight style={{ fontSize: '20px', color: currentTheme.text.muted }} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        style={{ padding: '0 20px' }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '16px',
            background: `linear-gradient(135deg, ${currentTheme.status.error}15, ${currentTheme.status.error}08)`,
            border: `1px solid ${currentTheme.status.error}30`,
            borderRadius: '16px',
            color: currentTheme.status.error,
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          <Logout style={{ fontSize: '20px' }} />
          Abmelden
        </motion.button>
      </motion.div>
    </div>
  );
};
