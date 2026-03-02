/**
 * useProfileData - Custom hook for ProfilePage business logic
 * Extracts state, data loading, stats calculations, menu items, and logout handler
 */

import type { SvgIconComponent } from '@mui/icons-material';
import {
  EmojiEvents,
  Group,
  History,
  Leaderboard,
  Palette,
  Pets,
  Search,
  Settings,
  Star,
  TrendingUp,
  ViewQuilt,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useBadges } from '../../features/badges/BadgeProvider';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Movie as MovieType } from '../../types/Movie';

export interface UserProfileData {
  username?: string;
  displayName?: string;
  photoURL?: string;
  isPublic?: boolean;
}

export interface ProfileStats {
  totalSeries: number;
  totalMovies: number;
  watchedEpisodes: number;
  totalMinutes: number;
  timeString: string;
}

export interface ProfileMenuItem {
  label: string;
  icon: SvgIconComponent;
  color: string;
  path: string;
  badge?: number;
  featured?: boolean;
}

export interface UseProfileDataResult {
  user: firebase.User | null;
  userData: UserProfileData | null | undefined;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  stats: ProfileStats;
  menuItems: ProfileMenuItem[];
  secondaryMenuItems: ProfileMenuItem[];
  settingsItems: ProfileMenuItem[];
  goTo: (path: string) => void;
  handleLogout: () => Promise<void>;
}

function computeStats(
  seriesList: ReturnType<typeof useSeriesList>['allSeriesList'],
  movieList: MovieType[]
): ProfileStats {
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
}

export const useProfileData = (): UseProfileDataResult => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const { unreadActivitiesCount, unreadRequestsCount } = useOptimizedFriends();
  const { unreadBadgesCount } = useBadges();

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

  const stats = useMemo(() => computeStats(seriesList, movieList), [seriesList, movieList]);

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      navigate('/');
    } catch {
      // Silent fail
    }
  };

  const menuItems: ProfileMenuItem[] = useMemo(
    () => [
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
    ],
    [currentTheme, unreadActivitiesCount, unreadRequestsCount]
  );

  const secondaryMenuItems: ProfileMenuItem[] = useMemo(
    () => [
      { label: 'Rangliste', icon: Leaderboard, color: '#f59e0b', path: '/leaderboard' },
      { label: 'Statistiken', icon: TrendingUp, color: currentTheme.primary, path: '/stats' },
      {
        label: 'Verlauf',
        icon: History,
        color: currentTheme.status.success,
        path: '/recently-watched',
      },
      {
        label: 'Erfolge',
        icon: EmojiEvents,
        color: currentTheme.status.warning,
        path: '/badges',
        badge: unreadBadgesCount || 0,
      },
      { label: 'Haustiere', icon: Pets, color: '#ec4899', path: '/pets' },
    ],
    [currentTheme, unreadBadgesCount]
  );

  const settingsItems: ProfileMenuItem[] = useMemo(
    () => [
      { label: 'Design', icon: Palette, color: currentTheme.primary, path: '/theme' },
      { label: 'Homepage Layout', icon: ViewQuilt, color: '#a855f7', path: '/home-layout' },
      {
        label: 'Einstellungen',
        icon: Settings,
        color: currentTheme.text.secondary,
        path: '/settings',
      },
    ],
    [currentTheme]
  );

  const goTo = (path: string) => navigate(path);

  return {
    user,
    userData,
    currentTheme,
    stats,
    menuItems,
    secondaryMenuItems,
    settingsItems,
    goTo,
    handleLogout,
  };
};
