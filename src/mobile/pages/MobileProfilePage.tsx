import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { 
  Person, Settings, Logout, Star, PlayCircle, 
  CalendarToday, Movie, TrendingUp, EmojiEvents,
  ChevronRight, Palette, Search, Group
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useBadges } from '../../features/badges/BadgeProvider';

export const MobileProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const { unreadActivitiesCount, unreadRequestsCount } = useOptimizedFriends();
  const { unreadBadgesCount } = useBadges();
  
  // Load user data from Firebase Database
  const { data: userData } = useEnhancedFirebaseCache<any>(
    user ? `users/${user.uid}` : '',
    {
      ttl: 5 * 60 * 1000,
      useRealtimeListener: true,
      enableOfflineSupport: true,
    }
  );
  
  
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  
  // const getUserRating = (rating: any): number => {
  //   if (!rating || !user?.uid) return 0;
  //   return rating[user.uid] || 0;
  // };
  
  const stats = useMemo(() => {
    const totalSeries = seriesList.length;
    const totalMovies = movieList.length;
    const today = new Date();
    
    let watchedEpisodes = 0;
    let totalMinutesWatched = 0;
    
    // Series watch time - same calculation as MobileStatsGrid
    seriesList.forEach(series => {
      // Allow nmr: 0 as valid
      if (!series || series.nmr === undefined || series.nmr === null) return;
      const runtime = series.episodeRuntime || 45;
      
      if (series.seasons) {
        series.seasons.forEach(season => {
          if (season.episodes) {
            season.episodes.forEach(episode => {
              // Episode is watched if it has firstWatchedAt OR watched: true OR watchCount > 0
              const isWatched = !!(
                episode.firstWatchedAt ||
                episode.watched === true ||
                (episode.watched as any) === 1 ||
                (episode.watched as any) === 'true' ||
                (episode.watchCount && episode.watchCount > 0)
              );
              
              if (isWatched) {
                // Check if episode has aired
                if (episode.air_date) {
                  const airDate = new Date(episode.air_date);
                  if (airDate <= today) {
                    // For episode count: count once
                    watchedEpisodes++;
                    // For time: count rewatches
                    const watchCount = episode.watchCount && episode.watchCount > 1 ? episode.watchCount : 1;
                    totalMinutesWatched += runtime * watchCount;
                  }
                } else {
                  // No air_date means it's probably an old episode that's already aired
                  watchedEpisodes++;
                  const watchCount = episode.watchCount && episode.watchCount > 1 ? episode.watchCount : 1;
                  totalMinutesWatched += runtime * watchCount;
                }
              }
            });
          }
        });
      }
    });
    
    // Movie watch time - use rating > 0 to determine if watched (same as MobileStatsGrid)
    movieList.forEach((movie: any) => {
      // Allow nmr: 0 as valid
      if (movie && movie.nmr !== undefined && movie.nmr !== null) {
        const rating = parseFloat(calculateOverallRating(movie));
        const isWatched = !isNaN(rating) && rating > 0;
        if (isWatched) {
          totalMinutesWatched += (movie.runtime || 120);
        }
      }
    });
    
    // Calculate time display string like MobileStatsGrid
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
      timeString: timeString.trim()
    };
  }, [seriesList, movieList]);
  
  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      navigate('/');
    } catch (error) {
    }
  };
  
  return (
    <div>
      {/* Profile Header */}
      <div style={{
        background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        padding: '20px',
        paddingTop: 'calc(40px + env(safe-area-inset-top))',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          ...((userData?.photoURL || user?.photoURL) ? {
            backgroundImage: `url("${userData?.photoURL || user?.photoURL}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          } : {
            background: currentTheme.primary
          }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: `0 4px 12px ${currentTheme.primary}4D`
        }}>
          {!(userData?.photoURL || user?.photoURL) && <Person style={{ fontSize: '40px' }} />}
        </div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 700,
          margin: '0 0 4px 0'
        }}>
          {userData?.displayName || user?.displayName || 'User'}
        </h2>
        <p style={{ 
          fontSize: '14px',
          color: currentTheme.text.muted,
          margin: 0
        }}>
          {user?.email}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <CalendarToday style={{ fontSize: '24px', color: currentTheme.primary, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalSeries}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Serien</div>
        </div>
        
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Movie style={{ fontSize: '24px', color: currentTheme.status.error, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalMovies}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Filme</div>
        </div>
        
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <PlayCircle style={{ fontSize: '24px', color: currentTheme.status.success, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.watchedEpisodes}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Episoden</div>
        </div>
        
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <TrendingUp style={{ fontSize: '24px', color: currentTheme.status.warning, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.timeString}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Gesamt-Watchzeit</div>
          <div style={{ fontSize: '10px', color: currentTheme.text.muted, opacity: 0.7 }}>Serien + Filme</div>
        </div>
      </div>
      
      {/* Feature Navigation */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/ratings')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.status.warning}1A`,
            border: `1px solid ${currentTheme.status.warning}33`,
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Star style={{ fontSize: '20px', color: currentTheme.status.warning }} />
            <span style={{ fontSize: '16px' }}>Meine Bewertungen</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/activity')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.primary}1A`,
            border: `1px solid ${currentTheme.primary}33`,
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Group style={{ fontSize: '20px', color: currentTheme.primary }} />
            <span style={{ fontSize: '16px' }}>Aktivität & Freunde</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(unreadActivitiesCount + unreadRequestsCount) > 0 && (
              <div style={{
                background: currentTheme.status.error,
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 600,
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {unreadActivitiesCount + unreadRequestsCount}
              </div>
            )}
            <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
          </div>
        </button>
        
        <button 
          onClick={() => navigate('/discover')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}33`,
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search style={{ fontSize: '20px', color: currentTheme.status.error }} />
            <span style={{ fontSize: '16px' }}>Hinzufügen & Suchen</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
      </div>
      
      {/* Settings & Profile Items */}
      <div style={{ padding: '0 20px' }}>
        <button 
          onClick={() => navigate('/stats')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp style={{ fontSize: '20px', color: currentTheme.primary }} />
            <span style={{ fontSize: '16px' }}>Statistiken</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/badges')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <EmojiEvents style={{ fontSize: '20px', color: currentTheme.status.warning }} />
            <span style={{ fontSize: '16px' }}>Erfolge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(unreadBadgesCount || 0) > 0 && (
              <div style={{
                background: currentTheme.status.error,
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 600,
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {unreadBadgesCount}
              </div>
            )}
            <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
          </div>
        </button>
        
        <button 
          onClick={() => navigate('/theme')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Palette style={{ fontSize: '20px', color: currentTheme.primary }} />
            <span style={{ fontSize: '16px' }}>Design</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings style={{ fontSize: '20px', color: currentTheme.text.secondary }} />
            <span style={{ fontSize: '16px' }}>Einstellungen</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}33`,
            borderRadius: '12px',
            color: currentTheme.status.error,
            marginTop: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logout style={{ fontSize: '20px' }} />
            <span style={{ fontSize: '16px' }}>Abmelden</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
      </div>
    </div>
  );
};