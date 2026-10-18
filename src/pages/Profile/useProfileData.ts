import type { SvgIconComponent } from '@mui/icons-material';
import { DEFAULT_EPISODE_RUNTIME_MINUTES } from '../../lib/episode/seriesMetrics';
import { ADMIN_UID } from '../../config/admin';
import {
  AdminPanelSettings,
  AutoAwesome,
  AutoStories,
  CalendarMonth,
  EmojiEvents,
  Explore,
  Forum,
  Group,
  History,
  Insights,
  Leaderboard,
  LibraryBooks,
  LiveTv,
  LocalLibrary,
  MenuBook,
  Palette,
  Pets,
  Search,
  Settings,
  Star,
  Subscriptions,
  UploadFile,
  TrendingUp,
  ViewQuilt,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBadges } from '../../features/badges/BadgeContext';
import { useEnhancedFirebaseCache } from '../../hooks/data/useEnhancedFirebaseCache';
import { bookTotals } from '../../lib/books/bookStats';
import { calculateOverallRating } from '../../lib/rating/rating';
import { t } from '../../services/i18n';
import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import type { Movie as MovieType } from '../../types/Movie';
import { hasEpisodeAired } from '../../utils/episodeDate';

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

export interface ProfileReadingStats {
  booksRead: number;
  pagesRead: number;
  mangaChapters: number;
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
  /** null, solange weder Bücher noch Manga in der Sammlung sind. */
  reading: ProfileReadingStats | null;
  menuItems: ProfileMenuItem[];
  secondaryMenuItems: ProfileMenuItem[];
  mangaMenuItems: ProfileMenuItem[];
  settingsItems: ProfileMenuItem[];
  /** Backdrop-URLs der bestbewerteten Serien für den Desktop-Kino-Hero */
  heroBackdrops: string[];
  goTo: (path: string) => void;
  handleLogout: () => Promise<void>;
}

function computeStats(
  seriesList: ReturnType<typeof useSeriesList>['allSeriesList'],
  movieList: MovieType[]
): ProfileStats {
  const totalSeries = seriesList.length;
  const totalMovies = movieList.length;

  let watchedEpisodes = 0;
  let totalMinutesWatched = 0;

  seriesList.forEach((series) => {
    if (!series) return;
    const seriesRuntime = series.episodeRuntime || DEFAULT_EPISODE_RUNTIME_MINUTES;

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

            if (isWatched && (hasEpisodeAired(episode) || !episode.air_date)) {
              const epRuntime = episode.runtime || seriesRuntime;
              watchedEpisodes++;
              const watchCount =
                episode.watchCount && episode.watchCount > 1 ? episode.watchCount : 1;
              totalMinutesWatched += epRuntime * watchCount;
            }
          });
        }
      });
    }
  });

  movieList.forEach((movie: MovieType) => {
    if (!movie) return;
    const rating = parseFloat(calculateOverallRating(movie));
    const isWatched = !isNaN(rating) && rating > 0;
    if (isWatched) {
      totalMinutesWatched += movie.runtime || 120;
    }
  });

  const years = Math.floor(totalMinutesWatched / (365 * 24 * 60));
  const remainingAfterYears = totalMinutesWatched % (365 * 24 * 60);
  const months = Math.floor(remainingAfterYears / (30 * 24 * 60));
  const remainingAfterMonths = remainingAfterYears % (30 * 24 * 60);
  const days = Math.floor(remainingAfterMonths / 1440);
  const hours = Math.floor((remainingAfterMonths % 1440) / 60);
  const minutes = remainingAfterMonths % 60;

  const timeParts: string[] = [];
  if (years > 0) timeParts.push(t('{n}J', { n: years }));
  if (months > 0) timeParts.push(t('{n}M', { n: months }));
  if (days > 0) timeParts.push(t('{n}T', { n: days }));
  if (hours > 0) timeParts.push(t('{n}S', { n: hours }));
  if (minutes > 0) timeParts.push(t('{n}Min', { n: Math.floor(minutes) }));
  const timeString = timeParts.length > 0 ? timeParts.join(' ') : t('0Min');

  return {
    totalSeries,
    totalMovies,
    watchedEpisodes,
    totalMinutes: totalMinutesWatched,
    timeString: timeString.trim(),
  };
}

export function computeReadingStats(books: Book[], manga: Manga[]): ProfileReadingStats | null {
  if (books.length === 0 && manga.length === 0) return null;
  return {
    ...bookTotals(books),
    mangaChapters: manga.reduce((sum, m) => sum + (m.currentChapter || 0), 0),
  };
}

export const useProfileData = (): UseProfileDataResult => {
  const navigate = useNavigate();
  const { user = null } = useAuth() || {};
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
  const { mangaList } = useMangaList();
  const { bookList } = useBooksList();

  const stats = useMemo(() => computeStats(seriesList, movieList), [seriesList, movieList]);
  const reading = useMemo(() => computeReadingStats(bookList, mangaList), [bookList, mangaList]);

  // Kino-Hero: Backdrops der bestbewerteten Serien (Desktop-Collage)
  const heroBackdrops = useMemo(
    () =>
      seriesList
        .filter((s) => s?.backdrop)
        .map((s) => ({
          backdrop: s.backdrop as string,
          rating: parseFloat(calculateOverallRating(s)) || 0,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
        .map((s) => `https://image.tmdb.org/t/p/w1280${s.backdrop}`),
    [seriesList]
  );

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
        label: t('Meine Bewertungen'),
        icon: Star,
        color: currentTheme.status.warning,
        path: '/ratings',
        featured: true,
      },
      {
        label: t('Aktivität & Freunde'),
        icon: Group,
        color: currentTheme.primary,
        path: '/activity',
        badge: unreadActivitiesCount + unreadRequestsCount,
        featured: true,
      },
      {
        label: t('Hinzufügen & Suchen'),
        icon: Search,
        color: currentTheme.status.error,
        path: '/discover',
        featured: true,
      },
    ],
    [currentTheme, unreadActivitiesCount, unreadRequestsCount]
  );

  const mangaMenuItems: ProfileMenuItem[] = useMemo(
    () => [
      { label: t('Bücher'), icon: LocalLibrary, color: currentTheme.primary, path: '/books' },
      {
        label: t('Dein Regal'),
        icon: LibraryBooks,
        color: currentTheme.status.warning,
        path: '/reading/library',
      },
      {
        label: t('Lese-Statistik'),
        icon: Insights,
        color: currentTheme.accent,
        path: '/reading/stats',
      },
      {
        label: t('Bücher importieren'),
        icon: UploadFile,
        color: currentTheme.status.success,
        path: '/books/import',
      },
      { label: t('Manga Home'), icon: AutoStories, color: currentTheme.secondary, path: '/manga' },
      ...(mangaList.length > 0
        ? [
            {
              label: t('Manga-Leseliste'),
              icon: MenuBook,
              color: currentTheme.status.error,
              path: '/reading/list',
            },
            {
              label: t('Manga-Statistiken'),
              icon: TrendingUp,
              color: currentTheme.secondary,
              path: '/reading/stats',
            },
          ]
        : [
            {
              label: t('Manga entdecken'),
              icon: Explore,
              color: currentTheme.status.error,
              path: '/reading/discover',
            },
          ]),
    ],
    [currentTheme, mangaList]
  );

  const secondaryMenuItems: ProfileMenuItem[] = useMemo(
    () => [
      { label: t('Rangliste'), icon: Leaderboard, color: '#f59e0b', path: '/leaderboard' },
      { label: t('Statistiken'), icon: TrendingUp, color: currentTheme.primary, path: '/stats' },
      {
        label: t('Verlauf'),
        icon: History,
        color: currentTheme.status.success,
        path: '/recently-watched',
      },
      {
        label: t('Erfolge'),
        icon: EmojiEvents,
        color: currentTheme.status.warning,
        path: '/badges',
        badge: unreadBadgesCount || 0,
      },
      { label: t('Haustiere'), icon: Pets, color: '#ec4899', path: '/pets' },
      {
        label: t('KI-Empfehlungen'),
        icon: AutoAwesome,
        color: currentTheme.secondary,
        path: '/taste-profile',
      },
      {
        label: t('Serien-Kalender'),
        icon: LiveTv,
        color: currentTheme.primary,
        path: '/serien-kalender',
      },
      {
        label: 'Anime-Season',
        icon: CalendarMonth,
        color: currentTheme.accent,
        path: '/anime-season',
      },
    ],
    [currentTheme, unreadBadgesCount]
  );

  const isAdmin = user?.uid === ADMIN_UID;

  const settingsItems: ProfileMenuItem[] = useMemo(
    () => [
      { label: t('Design'), icon: Palette, color: currentTheme.primary, path: '/theme' },
      {
        label: 'Homepage Layout',
        icon: ViewQuilt,
        color: currentTheme.secondary,
        path: '/home-layout',
      },
      {
        label: t('Streaming-Abos'),
        icon: Subscriptions,
        color: '#00A8E1',
        path: '/subscriptions',
      },
      {
        label: t('Einstellungen'),
        icon: Settings,
        color: currentTheme.text.secondary,
        path: '/settings',
      },
      {
        label: t('Ideen & Probleme'),
        icon: Forum,
        color: '#3b82f6',
        path: '/bug-report',
      },
      ...(isAdmin
        ? [{ label: 'Admin Panel', icon: AdminPanelSettings, color: '#ef4444', path: '/admin' }]
        : []),
    ],
    [currentTheme, isAdmin]
  );

  const goTo = (path: string) => {
    navigate(path);
  };

  return {
    user,
    userData,
    currentTheme,
    stats,
    reading,
    menuItems,
    secondaryMenuItems,
    mangaMenuItems,
    settingsItems,
    heroBackdrops,
    goTo,
    handleLogout,
  };
};
